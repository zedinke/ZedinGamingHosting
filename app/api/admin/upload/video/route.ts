import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nincs fájl feltöltve' },
        { status: 400 }
      );
    }

    // Fájl típus ellenőrzése - csak videó
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Csak videófájlok tölthetők fel' },
        { status: 400 }
      );
    }

    // Fájl méret ellenőrzése (max 50MB - rövid videókhoz)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'A videó mérete nem lehet nagyobb 50MB-nál' },
        { status: 400 }
      );
    }

    // Determine the correct upload directory
    let baseDir = process.cwd();
    const isStandalone = baseDir.includes('.next/standalone') || existsSync(join(baseDir, 'server.js'));
    
    // If in standalone, find project root
    if (isStandalone && baseDir.includes('.next/standalone')) {
      // Go up to project root: .next/standalone -> .next -> project root
      baseDir = join(baseDir, '..', '..', '..');
      // Normalize the path to resolve any .. references
      const path = require('path');
      baseDir = path.resolve(baseDir);
      console.log('Standalone detected, using project root:', baseDir);
    }
    
    // Primary upload directory - always use project root public
    const uploadsDir = join(baseDir, 'public', 'uploads', 'slideshow', 'videos');
    
    // Also save to standalone public if in standalone (for Next.js to serve)
    const standalonePublicDir = isStandalone && process.cwd().includes('.next/standalone')
      ? join(process.cwd(), 'public', 'uploads', 'slideshow', 'videos')
      : null;
    
    // Create primary directory (project root)
    try {
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
        console.log('✓ Created video uploads directory:', uploadsDir);
      }
    } catch (error: any) {
      console.error('Error creating primary video uploads directory:', error);
      throw new Error(`Nem sikerült létrehozni a videó uploads mappát: ${error.message}`);
    }
    
    // Create standalone directory if needed
    if (standalonePublicDir) {
      try {
        if (!existsSync(standalonePublicDir)) {
          await mkdir(standalonePublicDir, { recursive: true });
          console.log('✓ Created standalone video uploads directory:', standalonePublicDir);
        }
      } catch (error: any) {
        console.warn('Warning: Could not create standalone video uploads directory:', error);
        // Don't throw, primary directory is more important
      }
    }
    
    // Debug: log directory info
    console.log('Video upload info:', {
      baseDir,
      isStandalone,
      uploadsDir,
      uploadsDirExists: existsSync(uploadsDir),
      standalonePublicDir,
      standaloneExists: standalonePublicDir ? existsSync(standalonePublicDir) : null,
    });

    // Egyedi fájlnév generálása
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Fájl mentése
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save to primary location (project root)
    try {
      await writeFile(filePath, buffer);
      console.log('✓ Video file saved to primary location:', filePath);
    } catch (error: any) {
      console.error('Error saving video file to primary location:', error);
      throw new Error(`Nem sikerült menteni a videó fájlt: ${error.message}`);
    }
    
    // Also save to standalone public if in standalone (for Next.js to serve)
    if (standalonePublicDir) {
      const standaloneFilePath = join(standalonePublicDir, fileName);
      try {
        await writeFile(standaloneFilePath, buffer);
        console.log('✓ Video file also saved to standalone location:', standaloneFilePath);
      } catch (error: any) {
        console.warn('⚠ Could not save video to standalone location:', error);
        // Don't throw, primary save succeeded
      }
    }

    // URL visszaadása
    const fileUrl = `/uploads/slideshow/videos/${fileName}`;
    
    // Debug: log file info
    console.log('Video file saved successfully:', {
      fileName,
      filePath,
      fileUrl,
      fileSize: buffer.length,
      uploadsDirExists: existsSync(uploadsDir),
    });

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: fileName,
    });
  } catch (error: any) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a videó feltöltése során: ' + (error.message || 'Ismeretlen hiba') },
      { status: 500 }
    );
  }
}

