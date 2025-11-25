import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

// Helper function to find project root reliably
function findProjectRoot(): string {
  let currentDir = process.cwd();
  
  // If we're in .next/standalone, go up to project root
  if (currentDir.includes('.next/standalone')) {
    currentDir = resolve(currentDir, '..', '..', '..');
  }
  
  // Verify it's the project root
  const checks = [
    join(currentDir, 'package.json'),
    join(currentDir, 'next.config.js'),
    join(currentDir, 'app'),
    join(currentDir, 'public'),
  ];
  
  const isValidRoot = checks.some(check => existsSync(check));
  
  if (isValidRoot) {
    return currentDir;
  }
  
  // Try parent directory
  const parentDir = resolve(currentDir, '..');
  const parentChecks = [
    join(parentDir, 'package.json'),
    join(parentDir, 'next.config.js'),
  ];
  
  if (parentChecks.some(check => existsSync(check))) {
    return parentDir;
  }
  
  return currentDir;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];
    
    // Security: prevent path traversal
    const sanitizedPath = pathSegments
      .map(segment => segment.replace(/\.\./g, '').replace(/\//g, ''))
      .filter(segment => segment.length > 0)
      .join('/');
    
    if (!sanitizedPath) {
      return new NextResponse('Not Found', { status: 404 });
    }
    
    const projectRoot = findProjectRoot();
    const filePath = join(projectRoot, 'public', 'uploads', sanitizedPath);
    
    // Security: ensure file is within public/uploads directory
    const publicUploadsDir = join(projectRoot, 'public', 'uploads');
    const resolvedFilePath = resolve(filePath);
    const resolvedUploadsDir = resolve(publicUploadsDir);
    
    if (!resolvedFilePath.startsWith(resolvedUploadsDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // Check if file exists
    if (!existsSync(filePath)) {
      return new NextResponse('Not Found', { status: 404 });
    }
    
    // Read and serve the file
    const fileBuffer = await readFile(filePath);
    
    // Determine content type based on file extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      mp4: 'video/mp4',
      webm: 'video/webm',
    };
    
    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream';
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving upload file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
