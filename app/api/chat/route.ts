import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureOllamaReady } from '@/lib/ollama-setup';

// Ollama API integráció
async function getAIResponse(
  messages: Array<{ role: string; content: string }>,
  context?: string
) {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3'; // Alapértelmezett modell

  const systemPrompt = `Te egy szakértő vagy a gaming szerver hosting területén. 
Segítesz a felhasználóknak kérdéseikkel kapcsolatban a szerver hosting, konfiguráció, 
hibaelhárítás és általános technikai kérdésekben. Válaszolj magyarul, részletesen és 
barátságosan. Használd a következő információkat a válaszaidban:
- Gaming szerver hosting szolgáltatások
- Szerver konfiguráció és beállítások
- Technikai hibaelhárítás
- Játék szerverek kezelése (Minecraft, ARK, Rust, Valheim, stb.)
- Előfizetések és számlázás
- Szerver állapot és monitoring
${context ? `\n\nKontextus: ${context}` : ''}`;

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
    const { conversationId, message, context } = body;

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
          context
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

