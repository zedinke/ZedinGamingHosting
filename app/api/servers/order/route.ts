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
      const { name, gameType, gamePackageId, billingInfo, additionalVCpu, additionalRamGB, additionalSlots } = body;

      // Validáció
      if (!name || !gameType) {
        throw createValidationError('form', 'Név és játék típus megadása kötelező');
      }

      if (!gamePackageId) {
        throw createValidationError('form', 'Játék csomag megadása kötelező');
      }

      if (!billingInfo || !billingInfo.billingName || !billingInfo.billingAddress) {
        throw createValidationError('form', 'Számlázási adatok megadása kötelező');
      }

      // Game package ellenőrzése
      const gamePackage = await prisma.gamePackage.findUnique({
        where: { id: gamePackageId },
      });

      if (!gamePackage || !gamePackage.isActive) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Érvénytelen vagy inaktív játék csomag',
          400
        );
      }

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
      const finalMaxPlayers = gamePackage.unlimitedSlot ? 20 : (baseSlot + additionalSlotsValue);
      const basePrice = gamePackage.discountPrice || gamePackage.price;
      const finalCurrency = gamePackage.currency;

      // Bővítési árak lekérése és költség számítása
      let upgradeCost = 0;
      let slotUpgradeCost = 0;

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

      const finalPrice = basePrice + upgradeCost + slotUpgradeCost;

      logger.info('Server order request', {
        userId: (session.user as any).id,
        gameType,
        gamePackageId,
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
        gameType: gameType as GameType,
        maxPlayers: finalMaxPlayers,
        status: 'OFFLINE',
        port: null, // Port generálás a provisioning során történik
        // Game package specifikációk mentése a konfigurációba (bővített értékekkel)
        configuration: {
          slot: gamePackage.slot + additionalSlotsValue,
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
        },
      },
    });

    // Szerver provisioning háttérben - GamePackage adataival
    const { provisionServer } = await import('@/lib/server-provisioning');
    provisionServer(server.id, {
      gameType: gameType as GameType,
      maxPlayers: finalMaxPlayers,
      gamePackageId: gamePackage.id,
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
    const invoiceItems: any[] = [
      {
        description: `${gamePackage.name} - ${gameType}`,
        quantity: 1,
        unitPrice: basePrice,
        total: basePrice,
      },
    ];

    // Bővítési tételek hozzáadása
    if (upgradeCost > 0) {
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

