import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { ensureOllamaReady } from '@/lib/ollama-setup';
import { searchAndFormatContext } from '@/lib/ai/web-search';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
// Admin chat - könnyű modell (központi gép erőforrások)
const AI_MODEL = process.env.AI_DEV_MODEL || process.env.OLLAMA_MODEL || 'phi3:mini';

/**
 * Admin AI Chat - POST
 * Interaktív chat az admin panelben az AI-val
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { conversationId, message, stream, useWebSearch } = body;
    const userId = (session.user as any).id;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Üzenet kötelező' }, { status: 400 });
    }

    // Konverzáció kezelése
    let conversation;
    if (conversationId) {
      conversation = await prisma.aIChatConversation.findUnique({
        where: { 
          id: conversationId, 
          userId,
          type: 'admin'
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: 'Konverzáció nem található' },
          { status: 404 }
        );
      }
    } else {
      // Új konverzáció
      conversation = await prisma.aIChatConversation.create({
        data: {
          userId,
          title: message.substring(0, 50),
          type: 'admin',
        },
        include: { messages: true },
      });
    }

    // Felhasználó üzenet mentése
    await prisma.aIChatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    // Előző üzenetek
    const previousMessages = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Web keresés, ha kell
    let webContext = '';
    if (useWebSearch) {
      try {
        webContext = await searchAndFormatContext(message, 3);
      } catch (error) {
        console.warn('Web keresés hiba, folytatás nélküle', error);
      }
    }

    // System prompt - fejlesztés, tesztelés, hibakeresés, javítás
    const systemPrompt = `Te egy AI fejlesztési asszisztens vagy, aki segít a szoftverfejlesztésben, tesztelésben, hibakeresésben és javításban.

SZEREPKÖRÖD:
- Kód elemzés és review
- Tesztek generálása
- Hibakeresés logokból
- Javaslatok adása
- Automatikus javítások javaslása
- Rendszer optimalizálás
- Kód írása és módosítása
- Internetes információk keresése és használata

SZABÁLYOK:
- Válaszolj magyarul, RÖVIDEN és TÖMÖREN
- Maximum 2-3 bekezdés, kivéve ha kódot kérnek
- Használj technikai terminológiát, de érthetően
- Ha nem tudod a választ, mondd el őszintén
- Javasolj konkrét megoldásokat
- Ha kódot javasolsz, használj TypeScript/JavaScript szintaxist
- Ha internetes információt használsz, jelöld meg a forrást
- Ne írj hosszú bevezetőket vagy magyarázatokat, menj rögtön a lényegre
- SOHA ne használj placeholder szövegeket, mint "_HUGE STEP BY STEP WORKING DEMO PICTURE HERE._" vagy "_PLEASE REMOVE_"
- SOHA ne írj placeholder szövegeket vagy demo szövegeket a válaszaidba
- Csak valós, használható információt adj

FONTOS: Válaszaid legyenek RÖVIDEK és TÖMÖREK! Ne írj hosszú szövegeket, csak a lényeget! SOHA ne használj placeholder szövegeket!

TÉMÁK: Next.js, TypeScript, Prisma, Docker, Server management, Game server hosting, System administration

${webContext ? `\n\nINTERNETES INFORMÁCIÓK:\n${webContext}\n` : ''}`;

    // Streaming válaszok
    if (stream) {
      return handleStreamingResponse(
        previousMessages,
        message,
        systemPrompt,
        conversation.id
      );
    }

    // Normál válasz
    const ollamaReady = await ensureOllamaReady();
    if (!ollamaReady) {
      return NextResponse.json(
        { error: 'AI szolgáltatás nem elérhető' },
        { status: 503 }
      );
    }

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...previousMessages,
          { role: 'user', content: message },
        ],
        stream: false,
        options: {
          num_predict: 256, // Maximum 256 token (rövid válaszokhoz elég)
          temperature: 0.7, // Alapértelmezett kreativitás
          num_ctx: 2048, // Context window mérete (alapértelmezett)
          repeat_penalty: 1.1, // Ismétlés büntetés
          top_k: 40, // Top-k sampling
          top_p: 0.9, // Nucleus sampling
        },
      }),
      signal: AbortSignal.timeout(60000), // 60 másodperc timeout (gyorsabb válaszok)
    });

    if (!response.ok) {
      throw new Error(`Ollama API hiba: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.message?.content || 'Sajnálom, nem sikerült választ generálni.';

    // AI válasz mentése
    const assistantMessage = await prisma.aIChatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse,
        metadata: {
          model: AI_MODEL,
          tokens: data.eval_count || 0,
        },
      },
    });

    // Konverzáció frissítése
    await prisma.aIChatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      message: assistantMessage,
    });
  } catch (error: any) {
    console.error('Admin AI chat error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Hiba történt a chat művelet során',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Admin AI Chat - GET
 * Konverzációk listázása vagy egy konverzáció lekérése
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const userId = (session.user as any).id;

    if (conversationId) {
      const conversation = await prisma.aIChatConversation.findUnique({
        where: { 
          id: conversationId, 
          userId,
          type: 'admin'
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: 'Konverzáció nem található' },
          { status: 404 }
        );
      }

      return NextResponse.json({ conversation });
    }

    // Összes admin konverzáció listázása
    const conversations = await prisma.aIChatConversation.findMany({
      where: { 
        userId,
        type: 'admin'
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Admin AI chat list error:', error);
    return NextResponse.json({ error: 'Hiba történt' }, { status: 500 });
  }
}

/**
 * Streaming válasz kezelése
 */
async function handleStreamingResponse(
  previousMessages: Array<{ role: string; content: string }>,
  message: string,
  systemPrompt: string,
  conversationId: string
): Promise<Response> {
  // Ollama elérhetőség ellenőrzése
  const ollamaReady = await ensureOllamaReady();
  if (!ollamaReady) {
    const encoder = new TextEncoder();
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: 'AI szolgáltatás nem elérhető. Ellenőrizd, hogy az Ollama fut-e és a modell letöltve van-e.' })}\n\n`
          )
        );
        controller.close();
      },
    });
    return new Response(errorStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: AI_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              ...previousMessages,
              { role: 'user', content: message },
            ],
            stream: true,
            options: {
              num_predict: 256, // Maximum 256 token (rövid válaszokhoz elég)
              temperature: 0.7, // Alapértelmezett kreativitás
              num_ctx: 2048, // Context window mérete (alapértelmezett)
              repeat_penalty: 1.1, // Ismétlés büntetés
              top_k: 40, // Top-k sampling
              top_p: 0.9, // Nucleus sampling
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Ollama API hiba: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Nem sikerült olvasni a stream-et');
        }

        let fullResponse = '';

        let streamDone = false;
        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) {
            streamDone = true;
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.message?.content) {
                const content = data.message.content;
                fullResponse += content;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
              if (data.done) {
                // Válasz mentése
                try {
                  await prisma.aIChatMessage.create({
                    data: {
                      conversationId,
                      role: 'assistant',
                      content: fullResponse,
                      metadata: {
                        model: AI_MODEL,
                        tokens: data.eval_count || 0,
                      },
                    },
                  });
                  await prisma.aIChatConversation.update({
                    where: { id: conversationId },
                    data: { updatedAt: new Date() },
                  });
                } catch (error) {
                  console.error('Hiba a válasz mentése során:', error);
                }
                streamDone = true;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId })}\n\n`));
                controller.close();
                break;
              }
            } catch (e) {
              // JSON parse hiba, folytatjuk
            }
          }
        }

        // Ha a stream véget ért, de még nincs done flag
        if (fullResponse && !streamDone) {
          try {
            await prisma.aIChatMessage.create({
              data: {
                conversationId,
                role: 'assistant',
                content: fullResponse,
                metadata: { model: AI_MODEL },
              },
            });
            await prisma.aIChatConversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date() },
            });
          } catch (error) {
            console.error('Hiba a válasz mentése során:', error);
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId })}\n\n`));
        }
        controller.close();
      } catch (error: any) {
        console.error('Streaming hiba:', error);
        const errorMessage = error.message || 'Hiba történt a válasz generálása során';
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: errorMessage })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

