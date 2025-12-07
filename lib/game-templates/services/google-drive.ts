/**
 * Google Drive Service
 * Template file-ok kezelése Google Drive-on
 * 
 * Szükséges env változók:
 * GOOGLE_DRIVE_API_KEY
 * GOOGLE_DRIVE_FOLDER_ID (template mappa)
 * GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON (optional, for auth)
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Google Drive file info
 */
export interface GDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  modifiedTime: string;
  webContentLink?: string;
}

/**
 * Google Drive Service
 */
export class GoogleDriveService {
  private apiKey: string;
  private folderId: string;
  private baseUrl = 'https://www.googleapis.com/drive/v3';

  constructor() {
    this.apiKey = process.env.GOOGLE_DRIVE_API_KEY || '';
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

    if (!this.apiKey) {
      console.warn('⚠️  GOOGLE_DRIVE_API_KEY nincs beállítva');
    }
    if (!this.folderId) {
      console.warn('⚠️  GOOGLE_DRIVE_FOLDER_ID nincs beállítva');
    }
  }

  /**
   * Fájl ID keresése név alapján
   */
  async getFileByName(fileName: string): Promise<GDriveFile | null> {
    try {
      const query = `name='${fileName}' and '${this.folderId}' in parents and trashed=false`;
      const encodedQuery = encodeURIComponent(query);

      const response = await fetch(
        `${this.baseUrl}/files?q=${encodedQuery}&spaces=drive&fields=files(id,name,mimeType,size,modifiedTime,webContentLink)&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.status}`);
      }

      const data = await response.json();
      const files = data.files || [];

      if (files.length === 0) {
        return null;
      }

      return files[0] as GDriveFile;
    } catch (error) {
      console.error('GDrive getFileByName error:', error);
      return null;
    }
  }

  /**
   * Összes fájl listázása a mappában
   */
  async listFiles(): Promise<GDriveFile[]> {
    try {
      const query = `'${this.folderId}' in parents and trashed=false`;
      const encodedQuery = encodeURIComponent(query);

      const response = await fetch(
        `${this.baseUrl}/files?q=${encodedQuery}&spaces=drive&fields=files(id,name,mimeType,size,modifiedTime,webContentLink)&pageSize=100&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.status}`);
      }

      const data = await response.json();
      return (data.files || []) as GDriveFile[];
    } catch (error) {
      console.error('GDrive listFiles error:', error);
      return [];
    }
  }

  /**
   * Fájl letöltése Google Drive-ról
   */
  async downloadFile(
    fileId: string,
    destinationPath: string,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    try {
      console.log(`📥 Google Drive file letöltése: ${fileId}`);

      const downloadUrl = `${this.baseUrl}/files/${fileId}?alt=media&key=${this.apiKey}`;
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      // Content length
      const contentLength = parseInt(
        response.headers.get('content-length') || '0',
        10
      );

      // Directory létrehozása
      const dir = path.dirname(destinationPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // File stream
      const writer = fs.createWriteStream(destinationPath);
      let loaded = 0;

      if (response.body) {
        const reader = response.body.getReader();
        const chunk = new Uint8Array(1024 * 1024); // 1MB chunks

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          writer.write(Buffer.from(value));
          loaded += value.length;

          if (onProgress) {
            onProgress(loaded, contentLength);
          }
        }
      }

      writer.end();

      console.log(`✅ File letöltve: ${destinationPath} (${contentLength} bytes)`);
    } catch (error) {
      console.error('GDrive downloadFile error:', error);
      throw error;
    }
  }

  /**
   * Fájl feltöltése Google Drive-ra
   * 
   * MEGJEGYZÉS: Ez a metódus működéséhez OAuth 2.0 authentikáció szükséges
   * Az API key-vel nem lehet feltölteni, csak letölteni!
   */
  async uploadFile(
    filePath: string,
    fileName: string,
    _onProgress?: (loaded: number, total: number) => void
  ): Promise<GDriveFile> {
    try {
      console.log(`📤 File feltöltése Google Drive-ra: ${fileName}`);

      // Checksum számítása
      const checksum = await this.calculateFileChecksum(filePath);

      // File mérete
      const fileStats = fs.statSync(filePath);
      const fileSizeGb = fileStats.size / (1024 * 1024 * 1024);

      console.log(`   Méret: ${fileSizeGb.toFixed(2)} GB`);
      console.log(`   Checksum: ${checksum}`);

      // MEGJEGYZÉS: Valódi implementáció OAuth2 + resumable upload API-val
      // Egyelőre csak dokumentáció
      throw new Error(
        'Upload funkció OAuth2 autentikáció szükséges. ' +
          'Kézi feltöltés: https://drive.google.com vagy API megvalósítás'
      );
    } catch (error) {
      console.error('GDrive uploadFile error:', error);
      throw error;
    }
  }

  /**
   * SHA256 checksum számítása
   */
  async calculateFileChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Checksum validálása
   */
  async validateChecksum(
    filePath: string,
    expectedChecksum: string
  ): Promise<boolean> {
    const actualChecksum = await this.calculateFileChecksum(filePath);
    const isValid = actualChecksum === expectedChecksum;

    if (!isValid) {
      console.error(
        `❌ Checksum validáció sikertelen!\n   Várt: ${expectedChecksum}\n   Kapott: ${actualChecksum}`
      );
    } else {
      console.log(`✅ Checksum validálva: ${actualChecksum}`);
    }

    return isValid;
  }

  /**
   * Public download link generálása (ha publikus)
   */
  getDownloadLink(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  /**
   * File info lekérése
   */
  async getFileInfo(fileId: string): Promise<GDriveFile | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/files/${fileId}?fields=id,name,mimeType,size,modifiedTime,webContentLink&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.status}`);
      }

      return (await response.json()) as GDriveFile;
    } catch (error) {
      console.error('GDrive getFileInfo error:', error);
      return null;
    }
  }
}

/**
 * Singleton instance
 */
let instance: GoogleDriveService | null = null;

export function getGoogleDriveService(): GoogleDriveService {
  if (!instance) {
    instance = new GoogleDriveService();
  }
  return instance;
}

export default GoogleDriveService;
