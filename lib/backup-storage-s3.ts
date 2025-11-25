import { prisma } from '@/lib/prisma';

// S3 Client inicializálása (lazy loading)
let s3Client: any = null;
let s3ClientPromise: Promise<any> | null = null;

async function getS3Client() {
  if (s3Client) {
    return s3Client;
  }
  
  if (s3ClientPromise) {
    return s3ClientPromise;
  }
  
  try {
    // @ts-ignore - @aws-sdk/client-s3 is an optional dependency, may not be installed
    const { S3Client } = await import('@aws-sdk/client-s3');
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-central-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    return s3Client;
  } catch (error) {
    throw new Error('AWS SDK modulok nincsenek telepítve. Telepítsd: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner');
  }
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'zedingaming-backups';

/**
 * Backup feltöltése S3-ba
 */
export async function uploadBackupToS3(
  serverId: string,
  backupPath: string,
  backupName: string
): Promise<{ success: boolean; s3Key?: string; error?: string }> {
  try {
    const client = await getS3Client();
    // @ts-ignore - @aws-sdk/client-s3 is an optional dependency, may not be installed
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { readFile } = await import('fs/promises');
    const { existsSync } = await import('fs');

    if (!existsSync(backupPath)) {
      return {
        success: false,
        error: 'Backup fájl nem található',
      };
    }

    const fileBuffer = await readFile(backupPath);
    const s3Key = `servers/${serverId}/${backupName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: 'application/gzip',
      Metadata: {
        serverId,
        uploadedAt: new Date().toISOString(),
      },
    });

    await client.send(command);

    return {
      success: true,
      s3Key,
    };
  } catch (error: any) {
    if (error.message?.includes('AWS SDK modulok nincsenek telepítve')) {
      return {
        success: false,
        error: 'S3 támogatás nincs telepítve. Telepítsd: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner',
      };
    }
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error.message || 'S3 feltöltési hiba',
    };
  }
}

/**
 * Backup letöltése S3-ból
 */
export async function downloadBackupFromS3(
  s3Key: string,
  localPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await getS3Client();
    // @ts-ignore - @aws-sdk/client-s3 is an optional dependency, may not be installed
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { writeFile } = await import('fs/promises');
    const { createWriteStream } = await import('fs');

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const response = await client.send(command);
    const stream = response.Body as any;

    if (!stream) {
      return {
        success: false,
        error: 'Backup nem található S3-ban',
      };
    }

    const writeStream = createWriteStream(localPath);
    stream.pipe(writeStream);

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    return {
      success: true,
    };
  } catch (error: any) {
    if (error.message?.includes('AWS SDK modulok nincsenek telepítve')) {
      return {
        success: false,
        error: 'S3 támogatás nincs telepítve. Telepítsd: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner',
      };
    }
    console.error('S3 download error:', error);
    return {
      success: false,
      error: error.message || 'S3 letöltési hiba',
    };
  }
}

/**
 * Backup törlése S3-ból
 */
export async function deleteBackupFromS3(
  s3Key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await getS3Client();
    // @ts-ignore - @aws-sdk/client-s3 is an optional dependency, may not be installed
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    await client.send(command);

    return {
      success: true,
    };
  } catch (error: any) {
    if (error.message?.includes('AWS SDK modulok nincsenek telepítve')) {
      return {
        success: false,
        error: 'S3 támogatás nincs telepítve. Telepítsd: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner',
      };
    }
    console.error('S3 delete error:', error);
    return {
      success: false,
      error: error.message || 'S3 törlési hiba',
    };
  }
}

/**
 * Backupok listázása S3-ból
 */
export async function listBackupsFromS3(
  serverId: string
): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
  try {
    const client = await getS3Client();
    // @ts-ignore - @aws-sdk/client-s3 is an optional dependency, may not be installed
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `servers/${serverId}/`,
    });

    const response = await client.send(command);

    if (!response.Contents) {
      return [];
    }

    return response.Contents.map((object: any) => ({
      key: object.Key || '',
      size: object.Size || 0,
      lastModified: object.LastModified || new Date(),
    }));
  } catch (error: any) {
    if (error.message?.includes('AWS SDK modulok nincsenek telepítve')) {
      console.warn('S3 támogatás nincs telepítve. Telepítsd: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner');
      return [];
    }
    console.error('S3 list error:', error);
    return [];
  }
}

/**
 * Presigned URL generálása backup letöltéshez
 */
export async function generateBackupDownloadUrl(
  s3Key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const client = await getS3Client();
    // @ts-ignore - @aws-sdk/client-s3 is an optional dependency, may not be installed
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    // @ts-ignore - @aws-sdk/s3-request-presigner is an optional dependency, may not be installed
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    return await getSignedUrl(client, command, { expiresIn });
  } catch (error: any) {
    if (error.message?.includes('AWS SDK modulok nincsenek telepítve')) {
      throw new Error('S3 támogatás nincs telepítve. Telepítsd: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner');
    }
    throw error;
  }
}

