import { prisma } from './prisma';

// Firebase Admin SDK dinamikus importálása (opcionális függőség)
// Dinamikus import használata, hogy a Next.js build során ne próbálja bundle-olni
let firebaseAdmin: any = null;

async function getFirebaseAdmin() {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  try {
    // Dinamikus import - csak futásidőben töltődik be
    firebaseAdmin = await import('firebase-admin');
    
    // Firebase inicializálása, ha még nem történt meg
    if (firebaseAdmin.apps.length === 0) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      
      if (!serviceAccountJson) {
        console.warn('FIREBASE_SERVICE_ACCOUNT nincs beállítva - push notifications nem működnek');
        return null;
      }

      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        
        firebaseAdmin.initializeApp({
          credential: firebaseAdmin.credential.cert(serviceAccount),
        });
        
        console.log('Firebase Admin SDK inicializálva');
      } catch (error) {
        console.error('Firebase Admin inicializálási hiba:', error);
        return null;
      }
    }
    
    return firebaseAdmin;
  } catch (error) {
    console.warn('firebase-admin nincs telepítve - push notifications nem működnek');
    return null;
  }
}

interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: 'high' | 'normal';
}

/**
 * Push notification küldése felhasználónak
 */
export async function sendPushNotification(
  userId: string,
  notification: PushNotificationData
): Promise<{ success: boolean; sent: number; failed: number }> {
  try {
    const admin = await getFirebaseAdmin();
    
    if (!admin) {
      return { success: false, sent: 0, failed: 0 };
    }

    // Aktív push tokenek lekérése
    const tokens = await prisma.pushToken.findMany({
      where: {
        userId,
        active: true,
      },
    });

    if (tokens.length === 0) {
      return { success: true, sent: 0, failed: 0 };
    }

    const messages = tokens.map((token) => ({
      token: token.token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      android: {
        priority: notification.priority || 'high',
        notification: {
          sound: 'default',
          channelId: 'server_notifications',
        },
      },
    }));

    // Batch küldés
    const response = await admin.messaging().sendAll(messages);

    // Sikertelen tokenek inaktiválása
    const failedTokens: string[] = [];
    response.responses.forEach((resp: any, idx: number) => {
      if (!resp.success) {
        failedTokens.push(tokens[idx].token);
      }
    });

    if (failedTokens.length > 0) {
      await prisma.pushToken.updateMany({
        where: {
          token: { in: failedTokens },
        },
        data: {
          active: false,
        },
      });
    }

    return {
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    };
  } catch (error) {
    console.error('Send push notification error:', error);
    return { success: false, sent: 0, failed: 0 };
  }
}

/**
 * Szerver állapot változás push notification
 */
export async function sendServerStatusChangeNotification(
  userId: string,
  serverName: string,
  oldStatus: string,
  newStatus: string,
  serverId: string
): Promise<void> {
  const statusLabels: Record<string, string> = {
    ONLINE: 'Online',
    OFFLINE: 'Offline',
    STARTING: 'Indítás',
    STOPPING: 'Leállítás',
    RESTARTING: 'Újraindítás',
    ERROR: 'Hiba',
  };

  const title = 'Szerver állapot változás';
  const body = `${serverName}: ${statusLabels[oldStatus] || oldStatus} → ${statusLabels[newStatus] || newStatus}`;

  await sendPushNotification(userId, {
    title,
    body,
    data: {
      type: 'SERVER_STATUS_CHANGE',
      serverId,
      oldStatus,
      newStatus,
    },
    priority: newStatus === 'ERROR' ? 'high' : 'normal',
  });
}

/**
 * Push notification küldése több felhasználónak
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  notification: PushNotificationData
): Promise<{ success: boolean; sent: number; failed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, notification);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return {
    success: totalSent > 0,
    sent: totalSent,
    failed: totalFailed,
  };
}

