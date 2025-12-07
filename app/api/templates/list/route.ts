/**
 * GET /api/templates
 * Összes elérhető game template listázása
 */

import { getAllTemplates } from '@/lib/game-templates/models/templates';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const templates = getAllTemplates();
    
    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('Template list error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch templates',
      },
      { status: 500 }
    );
  }
}
