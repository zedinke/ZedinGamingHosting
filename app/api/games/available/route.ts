import { NextResponse } from 'next/server';
import { getAvailableGameTypes } from '@/lib/games/utils';

/**
 * API endpoint az elérhető játék típusok lekéréséhez
 * Automatikusan visszaadja azokat a játékokat, amelyekhez van konfiguráció és telepítő
 */
export async function GET() {
  try {
    const gameTypes = getAvailableGameTypes();
    return NextResponse.json({ gameTypes });
  } catch (error) {
    console.error('Error fetching available game types:', error);
    return NextResponse.json(
      { error: 'Hiba történt az elérhető játékok lekérése során' },
      { status: 500 }
    );
  }
}

