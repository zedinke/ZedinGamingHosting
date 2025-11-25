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
    // Try multiple strategies to find the project root
    let baseDir = process.cwd();
    const originalCwd = baseDir;
    const isStandalone = baseDir.includes('.next/standalone') || existsSync(join(baseDir, 'server.js'));
    
    console.log('=== Upload Debug Info ===');
    console.log('Original process.cwd():', originalCwd);
    console.log('Is standalone:', isStandalone);
    
    // Strategy 1: If in standalone, go up to project root
    if (isStandalone && baseDir.includes('.next/standalone')) {
      // Go up: .next/standalone -> .next -> project root
      baseDir = join(baseDir, '..', '..', '..');
      const path = require('path');
      baseDir = path.resolve(baseDir);
      console.log('Strategy 1: Standalone detected, going up to:', baseDir);
    }
    
    // Strategy 2: Check if we're in the right place by looking for app/ or public/ directory
    const path = require('path');
    const hasAppDir = existsSync(join(baseDir, 'app'));
    const hasPublicDir = existsSync(join(baseDir, 'public'));
    const hasPackageJson = existsSync(join(baseDir, 'package.json'));
    
    console.log('Directory check:', {
      baseDir,
      hasAppDir,
      hasPublicDir,
      hasPackageJson,
    });
    
    // If we don't have the expected directories, try to find project root
    if (!hasPublicDir && !hasAppDir) {
      // Try going up one more level
      const parentDir = path.resolve(join(baseDir, '..'));
      if (existsSync(join(parentDir, 'public')) || existsSync(join(parentDir, 'app'))) {
        baseDir = parentDir;
        console.log('Strategy 2: Found project root at:', baseDir);
      }
    }
    
    // Final check: ensure we have a public directory
    const finalPublicDir = join(baseDir, 'public');
    if (!existsSync(finalPublicDir)) {
      console.error('ERROR: Cannot find public directory!');
      console.error('Searched in:', baseDir);
      throw new Error(`Nem található a public mappa a következő helyen: ${baseDir}`);
    }
    
    // Primary upload directory - always use project root public
    const uploadsDir = join(baseDir, 'public', 'uploads', 'slideshow');
    
    // Also save to standalone public if in standalone (for Next.js to serve)
    const standalonePublicDir = isStandalone && originalCwd.includes('.next/standalone')
      ? join(originalCwd, 'public', 'uploads', 'slideshow')
      : null;
    
    console.log('Final directories:', {
      baseDir,
      uploadsDir,
      standalonePublicDir,
    });
    
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
      processCwd: process.cwd(),
      baseDir,
      isStandalone,
      uploadsDir,
      uploadsDirExists: existsSync(uploadsDir),
      standalonePublicDir,
      standaloneExists: standalonePublicDir ? existsSync(standalonePublicDir) : null,
    });
    
    // Verify the directory exists and is writable
    if (!existsSync(uploadsDir)) {
      console.error('Uploads directory does not exist:', uploadsDir);
      throw new Error(`Az uploads mappa nem létezik: ${uploadsDir}`);
    }
    
    // Test write permissions
    try {
      const testFile = join(uploadsDir, '.test-write');
      await writeFile(testFile, 'test');
      const { unlink } = await import('fs/promises');
      await unlink(testFile);
      console.log('✓ Uploads directory is writable');
    } catch (error: any) {
      console.error('✗ Uploads directory is not writable:', error);
      throw new Error(`Az uploads mappa nem írható: ${error.message}`);
    }

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
      
      // Verify file was actually written
      const { statSync } = require('fs');
      const stats = statSync(filePath);
      console.log('✓ File verified:', {
        path: filePath,
        size: stats.size,
        exists: existsSync(filePath),
      });
      
      if (stats.size === 0) {
        throw new Error('A fájl üres, valószínűleg nem sikerült menteni');
      }
    } catch (error: any) {
      console.error('Error saving file to primary location:', error);
      console.error('File path:', filePath);
      console.error('Directory exists:', existsSync(uploadsDir));
      throw new Error(`Nem sikerült menteni a fájlt: ${error.message}`);
    }
    
    // Also save to standalone public if in standalone (for Next.js to serve)
    if (standalonePublicDir) {
      const standaloneFilePath = join(standalonePublicDir, fileName);
      try {
        // Ensure standalone directory exists
        const standaloneDir = require('path').dirname(standaloneFilePath);
        if (!existsSync(standaloneDir)) {
          await mkdir(standaloneDir, { recursive: true });
        }
        
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

