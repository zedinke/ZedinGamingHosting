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
  const originalCwd = currentDir;
  
  // If we're in .next/standalone, go up to project root
  if (currentDir.includes('.next/standalone')) {
    // .next/standalone -> .next -> project root
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
  
  // Last resort: return current directory
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

    // Fájl kiterjesztés ellenőrzése
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Nem engedélyezett fájlformátum. Csak JPG, PNG, GIF, WEBP, SVG engedélyezett' },
        { status: 400 }
      );
    }

    // Magic bytes (fájl header) ellenőrzése a valós fájltípus meghatározásához
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const magicBytes = fileBuffer.slice(0, 12);
    
    // Képformátumok magic bytes
    const imageMagicBytes: Record<string, Buffer[]> = {
      jpg: [Buffer.from([0xFF, 0xD8, 0xFF])],
      png: [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
      gif: [Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])],
      webp: [Buffer.from([0x52, 0x49, 0x46, 0x46]), Buffer.from([0x57, 0x45, 0x42, 0x50])],
      svg: [Buffer.from([0x3C, 0x3F, 0x78, 0x6D, 0x6C]), Buffer.from([0x3C, 0x73, 0x76, 0x67])], // XML/SVG
    };
    
    let isValidImage = false;
    for (const [format, signatures] of Object.entries(imageMagicBytes)) {
      for (const signature of signatures) {
        if (magicBytes.slice(0, signature.length).equals(signature)) {
          // SVG esetén további ellenőrzés (XML dokumentum)
          if (format === 'svg') {
            const fileContent = fileBuffer.toString('utf-8', 0, Math.min(1000, fileBuffer.length));
            if (fileContent.includes('<svg') || fileContent.includes('<?xml')) {
              isValidImage = true;
              break;
            }
          } else {
            isValidImage = true;
            break;
          }
        }
      }
      if (isValidImage) break;
    }
    
    if (!isValidImage) {
      return NextResponse.json(
        { error: 'A fájl nem érvényes képfájl. A fájl header nem egyezik a képformátummal.' },
        { status: 400 }
      );
    }

    // Find project root
    const projectRoot = findProjectRoot();
    const publicDir = join(projectRoot, 'public');
    const uploadsDir = join(publicDir, 'uploads', 'slideshow');

    console.log('=== Image Upload Debug ===');
    console.log('Project root:', projectRoot);
    console.log('Public dir:', publicDir);
    console.log('Uploads dir:', uploadsDir);
    console.log('Public dir exists:', existsSync(publicDir));
    console.log('Uploads dir exists:', existsSync(uploadsDir));

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
      
      // Set permissions to 755 (rwxr-xr-x) to allow FTP uploads
      try {
        const { chmodSync } = require('fs');
        chmodSync(uploadsDir, 0o755);
        console.log('✓ Set permissions (755) for uploads directory');
      } catch (permError) {
        console.warn('⚠ Could not set permissions (non-critical):', permError);
      }
    } catch (error: any) {
      console.error('Error creating uploads directory:', error);
      throw new Error(`Nem sikerült létrehozni az uploads mappát: ${error.message}`);
    }

    // Verify directory is writable
    try {
      const testFile = join(uploadsDir, '.test-write');
      await writeFile(testFile, 'test');
      const { unlink } = await import('fs/promises');
      await unlink(testFile);
      console.log('✓ Uploads directory is writable');
    } catch (error: any) {
      console.error('✗ Uploads directory is not writable:', error);
      console.error('Directory path:', uploadsDir);
      console.error('Directory exists:', existsSync(uploadsDir));
      
      // Try to get directory stats for debugging
      try {
        const { statSync } = require('fs');
        const dirStats = statSync(uploadsDir);
        console.error('Directory stats:', {
          mode: dirStats.mode.toString(8),
          uid: dirStats.uid,
          gid: dirStats.gid,
        });
      } catch (statError) {
        console.error('Could not get directory stats:', statError);
      }
      
      // Try to fix permissions
      try {
        const { chmodSync } = require('fs');
        chmodSync(uploadsDir, 0o777); // Try 777 for maximum permissions
        console.log('⚠ Tried to set permissions to 777');
        
        // Test again
        const testFile2 = join(uploadsDir, '.test-write-2');
        await writeFile(testFile2, 'test2');
        const { unlink } = await import('fs/promises');
        await unlink(testFile2);
        console.log('✓ Directory is now writable after permission fix');
      } catch (fixError) {
        console.error('Could not fix permissions:', fixError);
        throw new Error(`Az uploads mappa nem írható. Kérjük, futtasd le: bash scripts/set-uploads-permissions.sh vagy manuálisan: chmod -R 755 public/uploads. Hiba: ${error.message}`);
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    try {
      // Try to write the file
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
      
      // Set file permissions to 644 (rw-r--r--)
      try {
        const { chmodSync } = require('fs');
        chmodSync(filePath, 0o644);
        console.log('✓ Set file permissions (644)');
      } catch (permError) {
        console.warn('⚠ Could not set file permissions (non-critical):', permError);
      }
    } catch (error: any) {
      console.error('Error saving file:', error);
      console.error('File path:', filePath);
      console.error('Directory exists:', existsSync(uploadsDir));
      console.error('Directory writable check passed:', true); // We already checked this
      
      // Try to get more info about the error
      if (error.code === 'EACCES') {
        throw new Error(`Nincs írási jogosultság a mappához: ${uploadsDir}. Kérjük, futtasd le: bash scripts/set-uploads-permissions.sh vagy chmod -R 755 public/uploads`);
      } else if (error.code === 'ENOENT') {
        throw new Error(`A mappa nem létezik: ${uploadsDir}. Próbáld meg újra létrehozni.`);
      } else {
        throw new Error(`Nem sikerült menteni a fájlt: ${error.message} (code: ${error.code || 'unknown'})`);
      }
    }

    // Return URL - use API route for serving files (more reliable)
    // Use absolute URL if we have a base URL, otherwise relative
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || '';
    const fileUrl = baseUrl ? `${baseUrl}/api/uploads/slideshow/${fileName}` : `/api/uploads/slideshow/${fileName}`;
    
    // Also return the public URL for direct access
    const publicUrl = baseUrl ? `${baseUrl}/uploads/slideshow/${fileName}` : `/uploads/slideshow/${fileName}`;
    
    // Final verification
    if (!existsSync(filePath)) {
      console.error('ERROR: File was not saved:', filePath);
      throw new Error('A fájl nem található a mentés után');
    }
    
    // Verify file is readable
    try {
      const testRead = await readFile(filePath);
      if (testRead.length !== buffer.length) {
        throw new Error('Fájl olvasási hiba: méret eltérés');
      }
      console.log('✓ File is readable');
    } catch (readError: any) {
      console.error('File read error:', readError);
      throw new Error(`A fájl nem olvasható: ${readError.message}`);
    }
    
    console.log('✓ Upload successful:', {
      fileName,
      filePath,
      fileUrl,
      publicUrl,
      fileSize: buffer.length,
      fileExists: existsSync(filePath),
    });

    return NextResponse.json({
      success: true,
      url: fileUrl, // Use API route for serving
      publicUrl: publicUrl, // Also provide public URL
      fileName: fileName,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a kép feltöltése során: ' + (error.message || 'Ismeretlen hiba') },
      { status: 500 }
    );
  }
}
