import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureOllamaReady } from '@/lib/ollama-setup';
import { generateAIContext } from '@/lib/ai-context';

// Ollama API integráció
async function getAIResponse(
  messages: Array<{ role: string; content: string }>,
  context?: string
) {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  // Alapértelmezett: llama3.2:3b - jobb magyar nyelv támogatás, még mindig gyors
  // Alternatívák: phi3:mini, qwen2.5:3b, tinyllama
  const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';

  // Egyszerű, világos system prompt
  const systemPrompt = `Te egy gaming szerver hosting szakértő vagy. Segítesz a felhasználóknak magyar nyelven.

SZABÁLYOK:
- Válaszolj MINDIG magyarul, érthetően és barátságosan
- Használd egyszerű, világos mondatokat
- Ha nem tudod a választ, mondd el őszintén
- Ha a kontextusban van releváns információ, használd azt

TÉMÁK: gaming szerver hosting, szerver beállítás, hibaelhárítás, Minecraft, ARK, Rust, Valheim, számlázás, előfizetések.

${context ? `\nRELEVÁNS INFORMÁCIÓK:\n${context}\n` : ''}

Válaszolj röviden, érthetően magyarul.`;

  try {
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        stream: false,
      }),
      // Timeout beállítása
      signal: AbortSignal.timeout(60000), // 60 másodperc timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API hiba:', errorText);
      
      // Ha az Ollama nem elérhető, próbáljuk automatikusan beállítani
      if (response.status === 0 || response.status >= 500) {
        // Háttérben próbáljuk beállítani (nem blokkoljuk a választ)
        // A setup automatikusan megtörténik az ensureOllamaReady-ben
      }
      
      throw new Error(`Ollama API hiba: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content || 'Sajnálom, nem sikerült választ generálni.';
  } catch (error: any) {
    console.error('Ollama API hiba részletek:', error);
    
    // Ha timeout vagy kapcsolati hiba, adjunk egy hasznos választ
    if (error.name === 'TimeoutError' || error.message?.includes('fetch failed')) {
      return `Sajnálom, jelenleg nem tudok válaszolni, mert az AI szolgáltatás nem elérhető. 
      
Kérlek, próbáld újra később, vagy vedd fel velünk a kapcsolatot a támogatási rendszeren keresztül.

Ha a probléma továbbra is fennáll, ellenőrizd, hogy:
- Az Ollama szolgáltatás fut-e
- A Docker Compose esetén az ollama container fut-e
- A hálózati kapcsolat rendben van-e`;
    }
    
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { conversationId, message, context: providedContext, stream } = body;
    const userId = (session.user as any).id;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Üzenet kötelező' }, { status: 400 });
    }

    let conversation;
    if (conversationId) {
      conversation = await prisma.chatConversation.findUnique({
        where: { id: conversationId, userId: (session.user as any).id },
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
      conversation = await prisma.chatConversation.create({
        data: {
          userId: (session.user as any).id,
          title: message.substring(0, 50),
        },
        include: { messages: true },
      });
    }

    // Felhasználó üzenet mentése
    const userMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message,
      },
    });

    // Előző üzenetek előkészítése
    const previousMessages = conversation.messages.map((m) => ({
      role: m.role.toLowerCase(),
      content: m.content,
    }));

    // Kontextus generálása (RAG + felhasználói adatok)
    const aiContext = await generateAIContext(userId, message, 'hu');
    const fullContext = providedContext 
      ? `${providedContext}\n\n${aiContext}` 
      : aiContext;

    // Streaming válaszok támogatása
    if (stream) {
      return handleStreamingResponse(
        previousMessages,
        message,
        fullContext,
        conversation.id,
        userId
      );
    }

    // AI válasz generálása
    let aiResponse: string;
    try {
      // Ellenőrzi és beállítja az Ollama-t, ha szükséges
      const ollamaReady = await ensureOllamaReady();
      if (!ollamaReady) {
        aiResponse =
          'Sajnálom, az AI szolgáltatás jelenleg nem elérhető. Kérlek, próbáld újra később, vagy vedd fel velünk a kapcsolatot a támogatási rendszeren keresztül.';
      } else {
        aiResponse = await getAIResponse(
          [...previousMessages, { role: 'user', content: message }],
          fullContext
        );
      }
    } catch (error) {
      console.error('AI válasz generálási hiba:', error);
      aiResponse =
        'Sajnálom, jelenleg nem tudok válaszolni. Kérlek, ellenőrizd, hogy az Ollama szolgáltatás fut-e és elérhető-e.';
    }

    // AI válasz mentése
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: aiResponse,
      },
    });

    // Konverzáció frissítése
    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      message: assistantMessage,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a chat művelet során' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      const conversation = await prisma.chatConversation.findUnique({
        where: { id: conversationId, userId: (session.user as any).id },
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

    // Összes konverzáció listázása
    const conversations = await prisma.chatConversation.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Chat list error:', error);
    return NextResponse.json({ error: 'Hiba történt' }, { status: 500 });
  }
}

// Streaming válasz kezelése
async function handleStreamingResponse(
  previousMessages: Array<{ role: string; content: string }>,
  message: string,
  context: string,
  conversationId: string,
  userId: string
): Promise<Response> {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  // Alapértelmezett: llama3.2:3b - jobb magyar nyelv támogatás
  const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';

  // Egyszerű, világos system prompt streaming-hez
  const systemPrompt = `Te egy gaming szerver hosting szakértő vagy. Segítesz a felhasználóknak magyar nyelven.

SZABÁLYOK:
- Válaszolj MINDIG magyarul, érthetően és barátságosan
- Használd egyszerű, világos mondatokat
- Ha nem tudod a választ, mondd el őszintén
- Ha a kontextusban van releváns információ, használd azt

TÉMÁK: gaming szerver hosting, szerver beállítás, hibaelhárítás, Minecraft, ARK, Rust, Valheim, számlázás, előfizetések.

${context ? `\nRELEVÁNS INFORMÁCIÓK:\n${context}\n` : ''}

Válaszolj röviden, érthetően magyarul.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...previousMessages,
              { role: 'user', content: message },
            ],
            stream: true,
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
                  await prisma.chatMessage.create({
                    data: {
                      conversationId,
                      role: 'ASSISTANT',
                      content: fullResponse,
                    },
                  });
                  await prisma.chatConversation.update({
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
            await prisma.chatMessage.create({
              data: {
                conversationId,
                role: 'ASSISTANT',
                content: fullResponse,
              },
            });
            await prisma.chatConversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date() },
            });
          } catch (error) {
            console.error('Hiba a válasz mentése során:', error);
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId })}\n\n`));
        }
        controller.close();
      } catch (error) {
        console.error('Streaming hiba:', error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: 'Hiba történt a válasz generálása során' })}\n\n`
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

