import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '@/lib/prisma';

// S3 Client inicializálása
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

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

    await s3Client.send(command);

    return {
      success: true,
      s3Key,
    };
  } catch (error: any) {
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
    const { writeFile } = await import('fs/promises');
    const { createWriteStream } = await import('fs');

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const response = await s3Client.send(command);
    const stream = response.Body as any;

    if (!stream) {
      return {
        success: false,
        error: 'Backup nem található S3-ban',
      };
    }

    const writeStream = createWriteStream(localPath);
    stream.pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    return {
      success: true,
    };
  } catch (error: any) {
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
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    await s3Client.send(command);

    return {
      success: true,
    };
  } catch (error: any) {
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
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `servers/${serverId}/`,
    });

    const response = await s3Client.send(command);

    if (!response.Contents) {
      return [];
    }

    return response.Contents.map((object) => ({
      key: object.Key || '',
      size: object.Size || 0,
      lastModified: object.LastModified || new Date(),
    }));
  } catch (error) {
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
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

