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
    // Always use project root public directory for consistency
    const baseDir = process.cwd();
    const isStandalone = baseDir.includes('.next/standalone') || existsSync(join(baseDir, 'server.js'));
    
    // Primary upload directory - always use project root public
    let uploadsDir: string;
    if (isStandalone && baseDir.includes('.next/standalone')) {
      // In standalone, go up to project root
      uploadsDir = join(baseDir, '..', '..', '..', 'public', 'uploads', 'slideshow');
    } else {
      // Normal build, use current directory
      uploadsDir = join(baseDir, 'public', 'uploads', 'slideshow');
    }
    
    // Also save to standalone public if in standalone (for Next.js to serve)
    const standalonePublicDir = isStandalone && baseDir.includes('.next/standalone')
      ? join(baseDir, 'public', 'uploads', 'slideshow')
      : null;
    
    // Create primary directory (project root)
    try {
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
        console.log('✓ Created uploads directory:', uploadsDir);
      }
    } catch (error: any) {
      console.error('Error creating primary uploads directory:', error);
      throw new Error(`Nem sikerült létrehozni az uploads mappát: ${error.message}`);
    }
    
    // Create standalone directory if needed
    if (standalonePublicDir) {
      try {
        if (!existsSync(standalonePublicDir)) {
          await mkdir(standalonePublicDir, { recursive: true });
          console.log('✓ Created standalone uploads directory:', standalonePublicDir);
        }
      } catch (error: any) {
        console.warn('Warning: Could not create standalone uploads directory:', error);
        // Don't throw, primary directory is more important
      }
    }
    
    // Debug: log directory info
    console.log('Upload info:', {
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
      console.log('✓ File saved to primary location:', filePath);
    } catch (error: any) {
      console.error('Error saving file to primary location:', error);
      throw new Error(`Nem sikerült menteni a fájlt: ${error.message}`);
    }
    
    // Also save to standalone public if in standalone (for Next.js to serve)
    if (standalonePublicDir) {
      const standaloneFilePath = join(standalonePublicDir, fileName);
      try {
        await writeFile(standaloneFilePath, buffer);
        console.log('✓ File also saved to standalone location:', standaloneFilePath);
      } catch (error: any) {
        console.warn('⚠ Could not save to standalone location:', error);
        // Don't throw, primary save succeeded
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

