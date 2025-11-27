import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { executeSSHCommand } from '@/lib/ssh-client';

/**
 * AI rendszer telepítése meglévő szerver gépen
 * 
 * Ez a funkció lehetővé teszi, hogy meglévő szerver gépeken telepítsd az AI rendszert
 * anélkül, hogy újra kellene telepíteni az agentet.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { id } = params;
    const machine = await prisma.serverMachine.findUnique({
      where: { id },
    });

    if (!machine) {
      return NextResponse.json(
        { error: 'Szerver gép nem található' },
        { status: 404 }
      );
    }

    // SSH konfiguráció
    const sshConfig = {
      host: machine.ipAddress,
      port: machine.sshPort,
      user: machine.sshUser,
      keyPath: machine.sshKeyPath || undefined,
      password: undefined, // Jelszó nem tárolódik, csak SSH kulcs
    };

    // AI telepítési script
    const aiInstallScript = `
#!/bin/bash
set -e

echo "=== AI Rendszer Telepítése ==="
echo "🤖 AI Server Agent telepítése..."

# Ollama telepítése (ha nincs)
if ! command -v ollama &> /dev/null; then
    echo "📦 Ollama telepítése..."
    curl -fsSL https://ollama.com/install.sh | sudo -E bash - || {
        echo "⚠️  Ollama telepítési figyelmeztetés (nem kritikus)" >&2
    }
    # Ollama service indítása
    sudo systemctl start ollama 2>/dev/null || {
        echo "⚠️  Ollama service indítás figyelmeztetés (nem kritikus)" >&2
    }
    sudo systemctl enable ollama 2>/dev/null || true
    sleep 5
fi

# Ollama elérhetőség ellenőrzése
OLLAMA_URL="http://localhost:11434"
AI_SERVER_MODEL="${process.env.AI_SERVER_MODEL || 'llama3.2:3b'}"

export AI_SERVER_MODE=true
export OLLAMA_URL="$OLLAMA_URL"
export AI_SERVER_MODEL="$AI_SERVER_MODEL"

echo "🔍 Ollama elérhetőség ellenőrzése..."
for i in {1..12}; do
    if curl -s -f "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
        echo "✅ Ollama elérhető!"
        break
    fi
    if [ $i -eq 12 ]; then
        echo "⚠️  Ollama nem elérhető (nem kritikus, később is telepíthető)" >&2
    else
        sleep 5
    fi
done

# Modell letöltése (ha Ollama elérhető)
if curl -s -f "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
    echo "🔍 Modell ellenőrzése: $AI_SERVER_MODEL..."
    MODEL_EXISTS=$(curl -s "$OLLAMA_URL/api/tags" | grep -o "$AI_SERVER_MODEL" || echo "")
    
    if [ -z "$MODEL_EXISTS" ]; then
        echo "📥 Modell letöltése: $AI_SERVER_MODEL (ez eltarthat néhány percig)..."
        curl -X POST "$OLLAMA_URL/api/pull" \\
            -H "Content-Type: application/json" \\
            -d "{\\"name\\": \\"$AI_SERVER_MODEL\\", \\"stream\\": false}" > /dev/null 2>&1 || {
            echo "⚠️  Modell letöltési figyelmeztetés (nem kritikus)" >&2
        }
        echo "✅ Modell letöltése befejezve"
    else
        echo "✅ Modell már letöltve: $AI_SERVER_MODEL"
    fi
fi

echo "🎉 AI rendszer telepítés kész!"
echo "✅ Környezet: Szerver gép"
echo "✅ Modell: $AI_SERVER_MODEL"
`;

    // Script futtatása SSH-n keresztül
    const logs: string[] = [];
    logs.push(`AI rendszer telepítése: ${machine.name} (${machine.ipAddress})`);

    try {
      // Script írása ideiglenes fájlba a szerveren
      const tempScriptPath = `/tmp/ai-install-${Date.now()}.sh`;
      
      // Script feltöltése (egyszerű echo-n keresztül, mert nincs SCP)
      const scriptLines = aiInstallScript.split('\n');
      const escapedScript = scriptLines
        .map(line => line.replace(/'/g, "'\\''"))
        .join('\\n');
      
      const uploadCommand = `cat > ${tempScriptPath} << 'SCRIPT_EOF'
${aiInstallScript}
SCRIPT_EOF
chmod +x ${tempScriptPath}`;

      logs.push('Script feltöltése...');
      const uploadResult = await executeSSHCommand(sshConfig, uploadCommand, 30000);
      
      if (uploadResult.exitCode !== 0) {
        logs.push(`Script feltöltési hiba: ${uploadResult.stderr}`);
        return NextResponse.json(
          { 
            success: false,
            error: `Script feltöltési hiba: ${uploadResult.stderr}`,
            logs 
          },
          { status: 500 }
        );
      }

      logs.push('Script futtatása (ez eltarthat néhány percig, ha a modellt letölti)...');
      const scriptResult = await executeSSHCommand(
        sshConfig,
        `bash ${tempScriptPath} 2>&1`,
        300000 // 5 perc timeout (modell letöltés miatt)
      );

      // Script törlése
      await executeSSHCommand(sshConfig, `rm -f ${tempScriptPath}`, 10000).catch(() => {});

      // Logok hozzáadása
      if (scriptResult.stdout) {
        const stdoutLines = scriptResult.stdout.split('\n');
        stdoutLines.forEach(line => {
          if (line.trim()) logs.push(line.trim());
        });
      }

      if (scriptResult.stderr && !scriptResult.stdout.includes(scriptResult.stderr)) {
        const stderrLines = scriptResult.stderr.split('\n');
        stderrLines.forEach(line => {
          if (line.trim()) logs.push(`[ERROR] ${line.trim()}`);
        });
      }

      if (scriptResult.exitCode === 0) {
        logs.push('✅ AI rendszer telepítés sikeres!');
        return NextResponse.json({
          success: true,
          message: 'AI rendszer sikeresen telepítve',
          logs,
        });
      } else {
        logs.push(`⚠️  AI telepítés részben sikertelen (exit code: ${scriptResult.exitCode})`);
        return NextResponse.json({
          success: false,
          error: `AI telepítés részben sikertelen: ${scriptResult.stderr || 'Ismeretlen hiba'}`,
          logs,
        }, { status: 500 });
      }
    } catch (error: any) {
      logs.push(`Hiba: ${error.message}`);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'AI telepítési hiba',
          logs,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('AI install error:', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt az AI telepítése során' },
      { status: 500 }
    );
  }
}

