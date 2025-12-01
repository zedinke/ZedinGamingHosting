import { PrismaClient, ModuleCategory } from '@prisma/client';

const prisma = new PrismaClient();

export interface ModuleDefinition {
  name: string;
  displayName: string;
  description: string;
  category: ModuleCategory;
  version: string;
  dependencies?: string[]; // Más modulok nevei
  configSchema?: Record<string, any>; // Konfigurációs séma
}

/**
 * Elérhető modulok definíciói
 */
export const AVAILABLE_MODULES: ModuleDefinition[] = [
  // Adatbázis modulok
  {
    name: 'database-mysql',
    displayName: 'MySQL Adatbázis',
    description: 'MySQL adatbázis támogatás',
    category: 'DATABASE',
    version: '1.0.0',
    configSchema: {
      host: { type: 'string', required: true },
      port: { type: 'number', default: 3306 },
      username: { type: 'string', required: true },
      password: { type: 'string', required: true, secret: true },
      database: { type: 'string', required: true },
    },
  },
  {
    name: 'database-postgresql',
    displayName: 'PostgreSQL Adatbázis',
    description: 'PostgreSQL adatbázis támogatás',
    category: 'DATABASE',
    version: '1.0.0',
    configSchema: {
      host: { type: 'string', required: true },
      port: { type: 'number', default: 5432 },
      username: { type: 'string', required: true },
      password: { type: 'string', required: true, secret: true },
      database: { type: 'string', required: true },
    },
  },
  {
    name: 'database-mongodb',
    displayName: 'MongoDB Adatbázis',
    description: 'MongoDB adatbázis támogatás',
    category: 'DATABASE',
    version: '1.0.0',
    configSchema: {
      connectionString: { type: 'string', required: true, secret: true },
      database: { type: 'string', required: true },
    },
  },
  // Kommunikációs modulok
  {
    name: 'email-smtp',
    displayName: 'Email Rendszer (SMTP)',
    description: 'SMTP email küldés támogatás',
    category: 'COMMUNICATION',
    version: '1.0.0',
    configSchema: {
      host: { type: 'string', required: true },
      port: { type: 'number', default: 587 },
      secure: { type: 'boolean', default: false },
      username: { type: 'string', required: true },
      password: { type: 'string', required: true, secret: true },
      from: { type: 'string', required: true },
    },
  },
  // Fizetési modulok
  {
    name: 'payment-stripe',
    displayName: 'Stripe Fizetés',
    description: 'Stripe fizetési integráció',
    category: 'PAYMENT',
    version: '1.0.0',
    configSchema: {
      secretKey: { type: 'string', required: true, secret: true },
      publishableKey: { type: 'string', required: true },
      webhookSecret: { type: 'string', secret: true },
    },
  },
  {
    name: 'payment-paypal',
    displayName: 'PayPal Fizetés',
    description: 'PayPal fizetési integráció',
    category: 'PAYMENT',
    version: '1.0.0',
    configSchema: {
      clientId: { type: 'string', required: true },
      clientSecret: { type: 'string', required: true, secret: true },
      mode: { type: 'string', default: 'sandbox' }, // sandbox vagy live
    },
  },
];

/**
 * Modul telepítése
 */
export async function installModule(
  moduleName: string,
  config: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const moduleDef = AVAILABLE_MODULES.find((m) => m.name === moduleName);
    if (!moduleDef) {
      return {
        success: false,
        error: 'Modul nem található',
      };
    }

    // Ellenőrizzük a függőségeket
    if (moduleDef.dependencies) {
      for (const dep of moduleDef.dependencies) {
        const depModule = await prisma.module.findUnique({
          where: { name: dep },
        });
        if (!depModule || !depModule.isInstalled) {
          return {
            success: false,
            error: `Függőség hiányzik: ${dep}`,
          };
        }
      }
    }

    // Validáljuk a konfigurációt
    if (moduleDef.configSchema) {
      for (const [key, schema] of Object.entries(moduleDef.configSchema)) {
        if (schema.required && !config[key]) {
          return {
            success: false,
            error: `Hiányzó konfiguráció: ${key}`,
          };
        }
      }
    }

    // Modul létrehozása vagy frissítése
    const module = await prisma.module.upsert({
      where: { name: moduleName },
      update: {
        config: config as any,
        isInstalled: true,
        isActive: true,
        installedAt: new Date(),
      },
      create: {
        name: moduleName,
        displayName: moduleDef.displayName,
        description: moduleDef.description,
        category: moduleDef.category,
        version: moduleDef.version,
        config: config as any,
        isInstalled: true,
        isActive: true,
        installedAt: new Date(),
      },
    });

    // Beállítások mentése
    if (moduleDef.configSchema) {
      for (const [key, value] of Object.entries(config)) {
        const schema = moduleDef.configSchema[key];
        await prisma.moduleSetting.upsert({
          where: {
            moduleId_key: {
              moduleId: module.id,
              key,
            },
          },
          update: {
            value: String(value),
            isSecret: schema?.secret === true,
            type: schema?.type || 'string',
          },
          create: {
            moduleId: module.id,
            key,
            value: String(value),
            isSecret: schema?.secret === true,
            type: schema?.type || 'string',
          },
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Module installation error:', error);
    return {
      success: false,
      error: 'Modul telepítési hiba',
    };
  }
}

/**
 * Modul eltávolítása
 */
export async function uninstallModule(
  moduleName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const module = await prisma.module.findUnique({
      where: { name: moduleName },
      include: { settings: true },
    });

    if (!module) {
      return {
        success: false,
        error: 'Modul nem található',
      };
    }

    // Ellenőrizzük, hogy más modulok függnek-e tőle
    const dependentModules = await prisma.module.findMany({
      where: {
        isInstalled: true,
        config: {
          path: ['dependencies'],
          array_contains: [moduleName],
        },
      },
    });

    if (dependentModules.length > 0) {
      return {
        success: false,
        error: `Más modulok függnek ettől: ${dependentModules.map((m) => m.displayName).join(', ')}`,
      };
    }

    // Modul deaktiválása
    await prisma.module.update({
      where: { name: moduleName },
      data: {
        isInstalled: false,
        isActive: false,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Module uninstallation error:', error);
    return {
      success: false,
      error: 'Modul eltávolítási hiba',
    };
  }
}

/**
 * Telepített modulok listázása
 */
export async function getInstalledModules() {
  return await prisma.module.findMany({
    where: { isInstalled: true },
    include: { settings: true },
    orderBy: { category: 'asc' },
  });
}

/**
 * Elérhető modulok listázása
 */
export function getAvailableModules(): ModuleDefinition[] {
  return AVAILABLE_MODULES;
}

