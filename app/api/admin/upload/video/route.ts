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
    const baseDir = process.cwd();
    const isStandalone = baseDir.includes('.next/standalone') || existsSync(join(baseDir, 'server.js'));
    
    // Primary upload directory
    const uploadsDir = isStandalone 
      ? join(baseDir, 'public', 'uploads', 'slideshow', 'videos')
      : join(baseDir, 'public', 'uploads', 'slideshow', 'videos');
    
    // Also save to project root public if in standalone
    const projectRootPublic = isStandalone && baseDir.includes('.next/standalone')
      ? join(baseDir, '..', '..', '..', 'public', 'uploads', 'slideshow', 'videos')
      : null;
    
    // Create directories
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
      console.log('✓ Created video uploads directory:', uploadsDir);
    }
    
    if (projectRootPublic && !existsSync(projectRootPublic)) {
      await mkdir(projectRootPublic, { recursive: true });
      console.log('✓ Created project root video uploads directory:', projectRootPublic);
    }
    
    // Debug: log directory info
    console.log('Video upload info:', {
      baseDir,
      isStandalone,
      uploadsDir,
      uploadsDirExists: existsSync(uploadsDir),
      projectRootPublic,
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
    
    // Save to primary location
    await writeFile(filePath, buffer);
    
    // Also save to project root if in standalone (for backup and direct access)
    if (projectRootPublic) {
      const projectRootFilePath = join(projectRootPublic, fileName);
      try {
        await writeFile(projectRootFilePath, buffer);
        console.log('✓ Video file also saved to project root:', projectRootFilePath);
      } catch (error) {
        console.warn('⚠ Could not save video to project root:', error);
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

