import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

// Helper function to find project root
function findProjectRoot(): string {
  let currentDir = process.cwd();
  
  if (currentDir.includes('.next/standalone')) {
    currentDir = resolve(currentDir, '..', '..', '..');
  }
  
  const checks = [
    join(currentDir, 'package.json'),
    join(currentDir, 'public'),
  ];
  
  if (checks.some(check => existsSync(check))) {
    return currentDir;
  }
  
  const parentDir = resolve(currentDir, '..');
  if (existsSync(join(parentDir, 'package.json'))) {
    return parentDir;
  }
  
  return currentDir;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path || [];
    
    if (pathSegments.length === 0) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Find project root
    const projectRoot = findProjectRoot();
    const publicDir = join(projectRoot, 'public');
    
    // Build file path (security: only allow files in public/uploads)
    const filePath = join(publicDir, ...pathSegments);
    
    // Security check: ensure path is within public directory
    const resolvedPath = resolve(filePath);
    const resolvedPublic = resolve(publicDir);
    
    if (!resolvedPath.startsWith(resolvedPublic)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Get file stats
    const stats = await stat(filePath);
    
    if (!stats.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }
    
    // Read file
    const fileBuffer = await readFile(filePath);
    
    // Determine content type
    const ext = pathSegments[pathSegments.length - 1].split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mov': 'video/quicktime',
    };
    
    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream';
    
    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('File serve error:', error);
    return NextResponse.json(
      { error: 'Error serving file: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

