import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GameType } from '@prisma/client';
import { handleApiError, AppError, ErrorCodes, createUnauthorizedError, createValidationError } from '@/lib/error-handler';
import { withPerformanceMonitoring } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';

export const POST = withPerformanceMonitoring(
  async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session) {
        throw createUnauthorizedError('Bejelentkezés szükséges');
      }

      const body = await request.json();
      const { name, gameType, gamePackageId, premiumPackageId, billingInfo, additionalVCpu, additionalRamGB, additionalSlots } = body;

      // Validáció - vagy gamePackageId vagy premiumPackageId kell
      if (!gamePackageId && !premiumPackageId) {
        throw createValidationError('form', 'Játék csomag vagy Premium csomag megadása kötelező');
      }

      if (gamePackageId && premiumPackageId) {
        throw createValidationError('form', 'Csak egy csomag típus választható');
      }

      // Premium csomag esetén nem kell gameType kezdetben
      if (gamePackageId && !gameType) {
        throw createValidationError('form', 'Játék típus megadása kötelező normál csomag esetén');
      }

      if (!name) {
        throw createValidationError('form', 'Név megadása kötelező');
      }

      if (!billingInfo || !billingInfo.billingName || !billingInfo.billingAddress) {
        throw createValidationError('form', 'Számlázási adatok megadása kötelező');
      }

      // Premium csomag vagy normál csomag kezelése
      let premiumPackage = null;
      let gamePackage = null;
      let finalPrice = 0;
      let finalCurrency = 'HUF';
      let finalMaxPlayers = 10;
      let finalGameType: GameType | null = null;
      let serverConfig: any = {};

      if (premiumPackageId) {
        // Premium csomag kezelése
        premiumPackage = await prisma.premiumPackage.findUnique({
          where: { id: premiumPackageId },
          include: {
            games: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        });

        if (!premiumPackage || !premiumPackage.isActive) {
          throw new AppError(
            ErrorCodes.VALIDATION_ERROR,
            'Érvénytelen vagy inaktív premium csomag',
            400
          );
        }

        finalPrice = premiumPackage.discountPrice || premiumPackage.price;
        finalCurrency = premiumPackage.currency;
        finalMaxPlayers = 10; // Alapértelmezett, mert még nincs kiválasztott játék
        serverConfig = {
          premiumPackageId: premiumPackage.id,
          cpuCores: premiumPackage.cpuCores,
          ram: premiumPackage.ram,
          availableGames: premiumPackage.games.map((g) => g.gameType),
        };
      } else if (gamePackageId) {
        // Normál csomag kezelése
        gamePackage = await prisma.gamePackage.findUnique({
          where: { id: gamePackageId },
        });

        if (!gamePackage || !gamePackage.isActive) {
          throw new AppError(
            ErrorCodes.VALIDATION_ERROR,
            'Érvénytelen vagy inaktív játék csomag',
            400
          );
        }

        finalGameType = gameType as GameType;
      }

      // Premium csomagoknál nincs bővítés, normál csomagoknál van
      let upgradeCost = 0;
      let slotUpgradeCost = 0;

      if (gamePackage) {
        const additionalVCpuValue = additionalVCpu || 0;
        const additionalRamGBValue = additionalRamGB || 0;
        const additionalSlotsValue = additionalSlots || 0;
        
        // Maximum értékek validálása
        const MAX_RAM_GB = 30;
        const MAX_VCPU = 20;
        const MAX_SLOTS = 50;
        
        if (gamePackage.ram + additionalRamGBValue > MAX_RAM_GB) {
          throw createValidationError('form', `A RAM nem lehet nagyobb ${MAX_RAM_GB} GB-nál`);
        }
        if (gamePackage.cpuCores + additionalVCpuValue > MAX_VCPU) {
          throw createValidationError('form', `A vCPU nem lehet nagyobb ${MAX_VCPU}-nál`);
        }
        // Unlimited slot kezelése
        const baseSlot = gamePackage.unlimitedSlot ? 20 : (gamePackage.slot || 0);
        
        if (!gamePackage.unlimitedSlot && gamePackage.slot && (gamePackage.slot + additionalSlotsValue) > MAX_SLOTS) {
          throw createValidationError('form', `A slot szám nem lehet nagyobb ${MAX_SLOTS}-nál`);
        }

        // Ha unlimited slot, akkor 20 slot az indítósorban (nem lehet bővíteni)
        finalMaxPlayers = gamePackage.unlimitedSlot ? 20 : (baseSlot + additionalSlotsValue);

        // Bővítési árak lekérése és költség számítása
        if (additionalVCpuValue > 0 || additionalRamGBValue > 0) {
          const [pricePerVCpuSetting, pricePerRamGBSetting] = await Promise.all([
            prisma.setting.findUnique({ where: { key: 'resource_upgrade_price_per_vcpu' } }),
            prisma.setting.findUnique({ where: { key: 'resource_upgrade_price_per_ram_gb' } }),
          ]);

          const pricePerVCpu = pricePerVCpuSetting ? parseFloat(pricePerVCpuSetting.value) : 0;
          const pricePerRamGB = pricePerRamGBSetting ? parseFloat(pricePerRamGBSetting.value) : 0;

          upgradeCost = (additionalVCpuValue * pricePerVCpu) + (additionalRamGBValue * pricePerRamGB);
        }

        // Slot bővítési költség számítása
        if (additionalSlotsValue > 0 && gamePackage.pricePerSlot) {
          slotUpgradeCost = additionalSlotsValue * gamePackage.pricePerSlot;
        }

        finalPrice = (gamePackage.discountPrice || gamePackage.price) + upgradeCost + slotUpgradeCost;
        finalCurrency = gamePackage.currency;

        serverConfig = {
          slot: gamePackage.unlimitedSlot ? 20 : ((gamePackage.slot || 0) + additionalSlotsValue),
          unlimitedSlot: gamePackage.unlimitedSlot || false,
          cpuCores: gamePackage.cpuCores + additionalVCpuValue,
          ram: gamePackage.unlimitedRam ? null : (gamePackage.ram + additionalRamGBValue),
          unlimitedRam: gamePackage.unlimitedRam || false,
          gamePackageId: gamePackage.id,
          baseSlot: gamePackage.slot,
          baseCpuCores: gamePackage.cpuCores,
          baseRam: gamePackage.ram,
          additionalSlots: additionalSlotsValue,
          additionalVCpu: additionalVCpuValue,
          additionalRamGB: additionalRamGBValue,
          upgradeCost: upgradeCost,
          slotUpgradeCost: slotUpgradeCost,
        };
      }

      logger.info('Server order request', {
        userId: (session.user as any).id,
        gameType: finalGameType,
        gamePackageId,
        premiumPackageId,
        maxPlayers: finalMaxPlayers,
      });

    // Port generálása - NEM generálunk portot itt, mert még nincs machineId
    // A port generálás a provisioning során történik, amikor már van machineId
    // Ez biztosítja, hogy a ténylegesen kiosztott portot használjuk

    // Szerver létrehozása
    const server = await prisma.server.create({
      data: {
        userId: (session.user as any).id,
        name,
        gameType: finalGameType || 'OTHER', // Premium csomagnál OTHER, majd később változik
        maxPlayers: finalMaxPlayers,
        status: 'OFFLINE',
        port: null, // Port generálás a provisioning során történik
        premiumPackageId: premiumPackage?.id || null,
        configuration: serverConfig,
      },
    });

    // Szerver provisioning háttérben
    const { provisionServer } = await import('@/lib/server-provisioning');
    provisionServer(server.id, {
      gameType: finalGameType || 'OTHER',
      maxPlayers: finalMaxPlayers,
      gamePackageId: gamePackage?.id,
      premiumPackageId: premiumPackage?.id,
      }).catch((error) => {
        logger.error('Server provisioning error', error as Error, {
          serverId: server.id,
        });
        // Szerver státusz frissítése hibára
        prisma.server.update({
          where: { id: server.id },
          data: { status: 'ERROR' },
        }).catch((updateError) => {
          logger.error('Failed to update server status', updateError as Error);
        });
      });

    // Előfizetés létrehozása (fizetési integrációval)
    // A fizetés a checkout API-n keresztül történik
    const subscription = await prisma.subscription.create({
      data: {
        userId: (session.user as any).id,
        serverId: server.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 nap
      },
    });

    // Számla létrehozása számlázási adatokkal
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Számla tételek összeállítása
    const invoiceItems: any[] = [];
    
    if (premiumPackage) {
      // Locale meghatározása (alapértelmezetten 'hu')
      const userLocale = (session.user as any).locale || 'hu';
      invoiceItems.push({
        description: `${userLocale === 'hu' ? premiumPackage.nameHu : premiumPackage.nameEn} - Premium Csomag`,
        quantity: 1,
        unitPrice: premiumPackage.discountPrice || premiumPackage.price,
        total: premiumPackage.discountPrice || premiumPackage.price,
      });
    } else if (gamePackage) {
      const basePrice = gamePackage.discountPrice || gamePackage.price;
      invoiceItems.push({
        description: `${gamePackage.name} - ${gameType}`,
        quantity: 1,
        unitPrice: basePrice,
        total: basePrice,
      });
    }

    // Bővítési tételek hozzáadása (csak normál csomagoknál)
    if (gamePackage && upgradeCost > 0) {
      const additionalVCpuValue = additionalVCpu || 0;
      const additionalRamGBValue = additionalRamGB || 0;
      const additionalSlotsValue = additionalSlots || 0;

      const [pricePerVCpuSetting, pricePerRamGBSetting] = await Promise.all([
        prisma.setting.findUnique({ where: { key: 'resource_upgrade_price_per_vcpu' } }),
        prisma.setting.findUnique({ where: { key: 'resource_upgrade_price_per_ram_gb' } }),
      ]);

      const pricePerVCpu = pricePerVCpuSetting ? parseFloat(pricePerVCpuSetting.value) : 0;
      const pricePerRamGB = pricePerRamGBSetting ? parseFloat(pricePerRamGBSetting.value) : 0;

      if (additionalVCpuValue > 0 && pricePerVCpu > 0) {
        invoiceItems.push({
          description: `vCPU bővítés: +${additionalVCpuValue} vCPU`,
          quantity: additionalVCpuValue,
          unitPrice: pricePerVCpu,
          total: additionalVCpuValue * pricePerVCpu,
        });
      }
      if (additionalRamGBValue > 0 && pricePerRamGB > 0) {
        invoiceItems.push({
          description: `RAM bővítés: +${additionalRamGBValue} GB`,
          quantity: additionalRamGBValue,
          unitPrice: pricePerRamGB,
          total: additionalRamGBValue * pricePerRamGB,
        });
      }

      // Slot bővítési tétel hozzáadása
      if (slotUpgradeCost > 0 && gamePackage.pricePerSlot) {
        invoiceItems.push({
          description: `Slot bővítés: +${additionalSlotsValue} slot`,
          quantity: additionalSlotsValue,
          unitPrice: gamePackage.pricePerSlot,
          total: slotUpgradeCost,
        });
      }
    }

    const invoice = await prisma.invoice.create({
      data: {
        userId: (session.user as any).id,
        subscriptionId: subscription.id,
        amount: finalPrice,
        currency: 'EUR', // Számlák mindig EUR-ban
        status: 'PENDING',
        invoiceNumber,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 nap
        // Számlázási adatok
        billingName: billingInfo.billingName,
        billingAddress: billingInfo.billingAddress || `${billingInfo.street}, ${billingInfo.city} ${billingInfo.postalCode}, ${billingInfo.country}`,
        items: invoiceItems,
      },
    });

    return NextResponse.json({
      success: true,
      serverId: server.id,
      subscriptionId: subscription.id,
      invoiceId: invoice.id,
        message: 'Szerver sikeresen létrehozva',
      });
    } catch (error) {
      logger.error('Server order error', error as Error);
      return handleApiError(error);
    }
  },
  '/api/servers/order',
  'POST'
);

