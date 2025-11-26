import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { writeFile, mkdir, stat, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

// Helper function to find project root reliably
function findProjectRoot(): string {
  // First, check if there's an environment variable for the project root
  if (process.env.PROJECT_ROOT && existsSync(process.env.PROJECT_ROOT)) {
    const envRoot = process.env.PROJECT_ROOT;
    if (existsSync(join(envRoot, 'package.json')) || existsSync(join(envRoot, 'public'))) {
      console.log('Using PROJECT_ROOT from environment:', envRoot);
      return envRoot;
    }
  }
  
  // Try common Hestia CP paths
  const commonPaths = [
    '/home/ZedGamingHosting_zedin/public_html',
    '/home/ZedGamingHosting/web/zedgaminghosting.hu/public_html',
    '/home/ZedGamingHosting/web/zedgaminghosting.hu',
  ];
  
  for (const testPath of commonPaths) {
    if (existsSync(testPath)) {
      const checks = [
        join(testPath, 'package.json'),
        join(testPath, 'next.config.js'),
        join(testPath, 'public'),
      ];
      
      if (checks.some(check => existsSync(check))) {
        console.log('Found project root in common path:', testPath);
        return testPath;
      }
    }
  }
  
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
  
  console.warn('Could not find project root, using:', currentDir);
  return currentDir;
}

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
    const { imageData, fileName } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: 'Nincs kép adat' },
        { status: 400 }
      );
    }

    // Extract base64 data (remove data:image/...;base64, prefix if present)
    let base64Data = imageData;
    let mimeType = 'image/jpeg';
    
    if (imageData.includes(',')) {
      const parts = imageData.split(',');
      const dataPart = parts[0];
      base64Data = parts[1];
      
      // Extract MIME type
      const mimeMatch = dataPart.match(/data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    // Validate it's an image
    if (!mimeType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Csak képfájlok tölthetők fel' },
        { status: 400 }
      );
    }

    // Decode base64
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, 'base64');
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Érvénytelen base64 adat: ' + error.message },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (buffer.length > maxSize) {
      return NextResponse.json(
        { error: 'A fájl mérete nem lehet nagyobb 10MB-nál' },
        { status: 400 }
      );
    }

    // Find project root
    const projectRoot = findProjectRoot();
    const publicDir = join(projectRoot, 'public');
    const uploadsDir = join(publicDir, 'uploads', 'slideshow');

    console.log('=== Base64 Image Upload Debug ===');
    console.log('Project root:', projectRoot);
    console.log('Public dir:', publicDir);
    console.log('Uploads dir:', uploadsDir);
    console.log('File size:', buffer.length);
    console.log('MIME type:', mimeType);

    // Ensure public directory exists
    if (!existsSync(publicDir)) {
      console.error('Public directory does not exist:', publicDir);
      throw new Error(`A public mappa nem létezik: ${publicDir}`);
    }

    // Create uploads directory if it doesn't exist
    try {
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
        console.log('✓ Created uploads directory:', uploadsDir);
      }
    } catch (error: any) {
      console.error('Error creating uploads directory:', error);
      throw new Error(`Nem sikerült létrehozni az uploads mappát: ${error.message}`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    
    // Determine file extension from MIME type
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };
    
    const fileExtension = mimeToExt[mimeType] || 'jpg';
    const finalFileName = fileName 
      ? `${timestamp}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      : `${timestamp}-${randomString}.${fileExtension}`;
    
    const filePath = join(uploadsDir, finalFileName);

    // Save file
    try {
      await writeFile(filePath, buffer);
      console.log('✓ File saved:', filePath);
      
      // Verify file was written
      const stats = await stat(filePath);
      console.log('✓ File verified:', {
        path: filePath,
        size: stats.size,
        exists: existsSync(filePath),
      });
      
      if (stats.size === 0) {
        throw new Error('A fájl üres, valószínűleg nem sikerült menteni');
      }
      
      if (stats.size !== buffer.length) {
        throw new Error(`Fájl méret eltérés: várt ${buffer.length}, kapott ${stats.size}`);
      }
    } catch (error: any) {
      console.error('Error saving file:', error);
      throw new Error(`Nem sikerült menteni a fájlt: ${error.message}`);
    }

    // Return URL - use API route for serving files (more reliable)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || '';
    const fileUrl = baseUrl 
      ? `${baseUrl}/api/uploads/slideshow/${finalFileName}` 
      : `/api/uploads/slideshow/${finalFileName}`;
    
    // Also return the public URL for direct access
    const publicUrl = baseUrl 
      ? `${baseUrl}/uploads/slideshow/${finalFileName}` 
      : `/uploads/slideshow/${finalFileName}`;

    console.log('✓ Upload successful:', {
      fileName: finalFileName,
      filePath,
      fileUrl,
      publicUrl,
      fileSize: buffer.length,
    });

    return NextResponse.json({
      success: true,
      url: fileUrl,
      publicUrl: publicUrl,
      fileName: finalFileName,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Base64 image upload error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a kép feltöltése során: ' + (error.message || 'Ismeretlen hiba') },
      { status: 500 }
    );
  }
}

