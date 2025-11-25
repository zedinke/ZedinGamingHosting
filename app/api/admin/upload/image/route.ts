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

    // Fájl típus ellenőrzése
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Csak képfájlok tölthetők fel' },
        { status: 400 }
      );
    }

    // Fájl méret ellenőrzése (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'A fájl mérete nem lehet nagyobb 10MB-nál' },
        { status: 400 }
      );
    }

    // Determine the correct upload directory
    // In standalone build, process.cwd() points to .next/standalone
    // We need to save to both public and standalone/public for compatibility
    const baseDir = process.cwd();
    const isStandalone = baseDir.includes('.next/standalone') || existsSync(join(baseDir, 'server.js'));
    
    // Primary upload directory (where Next.js serves from)
    const uploadsDir = isStandalone 
      ? join(baseDir, 'public', 'uploads', 'slideshow')
      : join(baseDir, 'public', 'uploads', 'slideshow');
    
    // Also save to project root public if in standalone (for backup)
    const projectRootPublic = isStandalone && baseDir.includes('.next/standalone')
      ? join(baseDir, '..', '..', '..', 'public', 'uploads', 'slideshow')
      : null;
    
    // Create directories
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
      console.log('✓ Created uploads directory:', uploadsDir);
    }
    
    if (projectRootPublic && !existsSync(projectRootPublic)) {
      await mkdir(projectRootPublic, { recursive: true });
      console.log('✓ Created project root uploads directory:', projectRootPublic);
    }
    
    // Debug: log directory info
    console.log('Upload info:', {
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
        console.log('✓ File also saved to project root:', projectRootFilePath);
      } catch (error) {
        console.warn('⚠ Could not save to project root:', error);
      }
    }

    // URL visszaadása
    const fileUrl = `/uploads/slideshow/${fileName}`;
    
    // Debug: log file info
    console.log('File saved successfully:', {
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
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a kép feltöltése során: ' + (error.message || 'Ismeretlen hiba') },
      { status: 500 }
    );
  }
}

