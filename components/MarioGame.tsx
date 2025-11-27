'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface MarioGameProps {
  className?: string;
}

export function MarioGame({ className = '' }: MarioGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const gameStateRef = useRef({
    mario: { x: 50, y: 300, width: 40, height: 50, velocityY: 0, onGround: false },
    platforms: [
      { x: 0, y: 400, width: 200, height: 20 },
      { x: 250, y: 350, width: 150, height: 20 },
      { x: 450, y: 300, width: 150, height: 20 },
      { x: 650, y: 250, width: 150, height: 20 },
      { x: 850, y: 200, width: 150, height: 20 },
      { x: 1050, y: 150, width: 150, height: 20 },
    ],
    coins: [
      { x: 300, y: 300, width: 30, height: 30, collected: false },
      { x: 500, y: 250, width: 30, height: 30, collected: false },
      { x: 700, y: 200, width: 30, height: 30, collected: false },
      { x: 900, y: 150, width: 30, height: 30, collected: false },
      { x: 1100, y: 100, width: 30, height: 30, collected: false },
    ],
    camera: { x: 0 },
    keys: { left: false, right: false, up: false },
    gravity: 0.8,
    jumpPower: -15,
    speed: 5,
  });

  const drawMario = useCallback((ctx: CanvasRenderingContext2D, mario: typeof gameStateRef.current.mario) => {
    // Mario test (piros)
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(mario.x, mario.y, mario.width, mario.height);
    
    // Mario fej (piros)
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(mario.x + 5, mario.y - 15, 30, 20);
    
    // Mario sapka (piros)
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(mario.x, mario.y - 20, 40, 10);
    
    // Mario arc (bézs)
    ctx.fillStyle = '#FFDBAC';
    ctx.fillRect(mario.x + 10, mario.y - 10, 20, 15);
    
    // Mario szemei
    ctx.fillStyle = '#000000';
    ctx.fillRect(mario.x + 15, mario.y - 8, 3, 3);
    ctx.fillRect(mario.x + 22, mario.y - 8, 3, 3);
    
    // Mario bajusz
    ctx.fillStyle = '#000000';
    ctx.fillRect(mario.x + 12, mario.y - 2, 16, 3);
    
    // Mario test részletek
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(mario.x + 5, mario.y + 10, 30, 20);
    
    // Mario lábak
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(mario.x + 5, mario.y + 40, 12, 10);
    ctx.fillRect(mario.x + 23, mario.y + 40, 12, 10);
  }, []);

  const drawPlatform = useCallback((ctx: CanvasRenderingContext2D, platform: { x: number; y: number; width: number; height: number }) => {
    // Platform (barna)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(platform.x - gameStateRef.current.camera.x, platform.y, platform.width, platform.height);
    
    // Platform felső rész (világosabb)
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(platform.x - gameStateRef.current.camera.x, platform.y, platform.width, 5);
  }, []);

  const drawCoin = useCallback((ctx: CanvasRenderingContext2D, coin: { x: number; y: number; width: number; height: number; collected: boolean }, frame: number) => {
    if (coin.collected) return;
    
    const x = coin.x - gameStateRef.current.camera.x;
    const y = coin.y + Math.sin(frame * 0.1) * 5;
    
    // Coin (arany)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x + coin.width / 2, y + coin.height / 2, coin.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Coin fény
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.arc(x + coin.width / 2 - 5, y + coin.height / 2 - 5, coin.width / 4, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const checkCollision = useCallback((rect1: { x: number; y: number; width: number; height: number }, rect2: { x: number; y: number; width: number; height: number }) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;
    const mario = state.mario;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Sky background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Ground
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

    // Update Mario
    if (state.keys.left) {
      mario.x -= state.speed;
    }
    if (state.keys.right) {
      mario.x += state.speed;
    }

    // Gravity
    mario.velocityY += state.gravity;
    mario.y += mario.velocityY;

    // Platform collision
    mario.onGround = false;
    for (const platform of state.platforms) {
      if (checkCollision(mario, { ...platform, x: platform.x - state.camera.x })) {
        if (mario.velocityY > 0 && mario.y < platform.y) {
          mario.y = platform.y - mario.height;
          mario.velocityY = 0;
          mario.onGround = true;
        }
      }
    }

    // Ground collision
    if (mario.y + mario.height > canvas.height - 100) {
      mario.y = canvas.height - 100 - mario.height;
      mario.velocityY = 0;
      mario.onGround = true;
    }

    // Jump
    if (state.keys.up && mario.onGround) {
      mario.velocityY = state.jumpPower;
      mario.onGround = false;
    }

    // Camera follow
    state.camera.x = mario.x - canvas.width / 3;

    // Coin collection
    state.coins.forEach((coin) => {
      if (!coin.collected && checkCollision(mario, { ...coin, x: coin.x - state.camera.x })) {
        coin.collected = true;
        setScore((prev) => prev + 10);
      }
    });

    // Draw platforms
    state.platforms.forEach((platform) => drawPlatform(ctx, platform));

    // Draw coins
    const frame = Date.now() / 16;
    state.coins.forEach((coin) => drawCoin(ctx, coin, frame));

    // Draw Mario
    drawMario(ctx, { ...mario, x: mario.x - state.camera.x });

    // Draw score
    ctx.fillStyle = '#000000';
    ctx.font = '24px Arial';
    ctx.fillText(`Pontszám: ${score}`, 20, 40);

    requestAnimationFrame(gameLoop);
  }, [score, drawMario, drawPlatform, drawCoin, checkCollision]);

  useEffect(() => {
    if (gameStarted) {
      const animationId = requestAnimationFrame(gameLoop);
      return () => cancelAnimationFrame(animationId);
    }
  }, [gameStarted, gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameStateRef.current.keys.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameStateRef.current.keys.right = true;
      }
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        gameStateRef.current.keys.up = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameStateRef.current.keys.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameStateRef.current.keys.right = false;
      }
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        gameStateRef.current.keys.up = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  if (!gameStarted) {
    return (
      <div className={`text-center ${className}`}>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="border-2 border-gray-300 rounded-lg bg-sky-200 mx-auto block"
        />
        <div className="mt-4">
          <button
            onClick={() => setGameStarted(true)}
            className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors text-lg font-bold"
          >
            Játék indítása
          </button>
          <p className="mt-4 text-gray-600">
            Használd a nyilakat vagy WASD-t a mozgáshoz, SPACE vagy FEL nyíl az ugráshoz
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="border-2 border-gray-300 rounded-lg bg-sky-200 mx-auto block"
      />
    </div>
  );
}

