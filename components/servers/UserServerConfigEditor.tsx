'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { GameType } from '@prisma/client';

interface UserServerConfigEditorProps {
  serverId: string;
  gameType: GameType;
  maxPlayers: number;
  initialConfig?: any;
  readonlyFields?: string[];
}

export function UserServerConfigEditor({
  serverId,
  gameType,
  maxPlayers,
  initialConfig,
  readonlyFields = [],
}: UserServerConfigEditorProps) {
  const [config, setConfig] = useState<any>(initialConfig || {});
  const [defaults, setDefaults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [readonlyFieldsList, setReadonlyFieldsList] = useState<string[]>(readonlyFields || []);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/config`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setConfig(data.config || {});
      setDefaults(data.defaults || {});
      // Readonly mezők beállítása
      if (data.readonlyFields) {
        setReadonlyFieldsList(data.readonlyFields);
      }
    } catch (error) {
      toast.error('Hiba történt a konfiguráció betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configuration: config }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      toast.success('Konfiguráció sikeresen mentve');
    } catch (error) {
      toast.error('Hiba történt a konfiguráció mentése során');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Biztosan visszaállítod az alapértelmezett konfigurációt?')) {
      setConfig(defaults);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getFieldLabel = (key: string): string => {
    const labels: Record<string, string> = {
      // Minecraft
      'server-name': 'Szerver Név',
      difficulty: 'Nehézség',
      gamemode: 'Játékmód',
      'max-players': 'Max Játékosok',
      'view-distance': 'Látótávolság',
      'online-mode': 'Online Mód',
      pvp: 'PvP Engedélyezve',
      'spawn-protection': 'Spawn Védelem',
      'white-list': 'Whitelist',
      motd: 'Üzenet a Napról',
      // ARK
      ServerName: 'Szerver Név',
      MaxPlayers: 'Max Játékosok',
      DifficultyOffset: 'Nehézség Offset',
      HarvestAmountMultiplier: 'Gyűjtés Szorzó',
      TamingSpeedMultiplier: 'Idomítás Sebesség Szorzó',
      XPMultiplier: 'XP Szorzó',
      PvP: 'PvP Engedélyezve',
      ServerAdminPassword: 'Admin Jelszó',
      ServerPassword: 'Szerver Jelszó',
      // Rust
      hostname: 'Szerver Név',
      maxplayers: 'Max Játékosok',
      seed: 'Világ Seed',
      worldsize: 'Világ Méret',
      saveinterval: 'Mentés Intervallum (másodperc)',
      serverurl: 'Szerver URL',
      serverdescription: 'Szerver Leírás',
      // Valheim
      name: 'Szerver Név',
      world: 'Világ Név',
      password: 'Jelszó',
      public: 'Nyilvános Szerver',
      // 7 Days to Die - csak a nem readonly mezők (ServerName és ServerPassword már definiálva van ARK-nál)
      ServerVisibility: 'Szerver Láthatóság',
      ServerIsPublic: '7DTD Nyilvános Szerver',
      ServerWebsiteURL: 'Szerver Weboldal URL',
      GameWorld: 'Világ',
      WorldGenSeed: 'Világ Generálás Seed',
      WorldGenSize: 'Világ Méret',
      GameName: 'Játék Név',
      GameMode: 'Játék Mód',
      Difficulty: 'Nehézség',
      DayNightLength: 'Nap/Éjszaka Hossz (perc)',
      DayLightLength: 'Nappali Órák',
      MaxSpawnedZombies: 'Max Spawnolt Zombik',
      DropOnDeath: 'Hullás Halálkor',
      DropOnQuit: 'Hullás Kilépéskor',
      BedrollDeadZoneSize: 'Alvószsák Halálzóna Méret',
      BlockDamagePlayer: 'Blokk Sérülés Játékos (%)',
      BlockDamageZombie: 'Blokk Sérülés Zombi (%)',
      // XPMultiplier már definiálva van ARK-nál
      PlayerSafeZoneLevel: 'Játékos Biztonsági Zóna Szint',
      PlayerSafeZoneHours: 'Játékos Biztonsági Zóna Órák',
      BuildCreate: 'Építés Létrehozás',
      AdminFileName: 'Admin Fájl Név',
      TelnetEnabled: 'Telnet Engedélyezve',
      TelnetPort: 'Telnet Port',
      TelnetPassword: 'Telnet Jelszó',
      ControlPanelEnabled: 'Vezérlőpult Engedélyezve',
      ControlPanelPort: 'Vezérlőpult Port',
      ControlPanelPassword: 'Vezérlőpult Jelszó',
      MaxUncoveredMapChunksPerPlayer: 'Max Fedetlen Térkép Chunk Játékosonként',
      PersistentPlayerProfiles: 'Tartós Játékos Profilok',
      EACEnabled: 'EAC Engedélyezve',
      HideCommandExecutionLog: 'Parancs Végrehajtás Log Elrejtése',
      AirDropFrequency: 'Légi Szállítás Gyakoriság (óra)',
      AirDropMarker: 'Légi Szállítás Jelölő',
      LootAbundance: 'Zsákmány Bőség (%)',
      LootRespawnDays: 'Zsákmány Újra Spawn Napok',
      MaxSpawnedAnimals: 'Max Spawnolt Állatok',
      LandClaimCount: 'Földigénylés Darabszám',
      LandClaimSize: 'Földigénylés Méret',
      LandClaimExpiryTime: 'Földigénylés Lejárat Idő (nap)',
      LandClaimDeadZone: 'Földigénylés Halálzóna',
      LandClaimOnlineDurabilityModifier: 'Földigénylés Online Tartósság Módosító',
      LandClaimOfflineDurabilityModifier: 'Földigénylés Offline Tartósság Módosító',
      LandClaimOfflineDelay: 'Földigénylés Offline Késleltetés',
      PartySharedKillRange: 'Csapat Megosztott Ölés Távolság',
      EnemySenseMemory: 'Ellenség Érzékelés Memória',
      EnemySpawnMode: 'Ellenség Spawn Mód',
      BloodMoonFrequency: 'Vérhold Gyakoriság (nap)',
      BloodMoonRange: 'Vérhold Tartomány',
      BloodMoonWarning: 'Vérhold Figyelmeztetés',
      BloodMoonEnemyCount: 'Vérhold Ellenség Darabszám',
      BloodMoonEnemyRange: 'Vérhold Ellenség Tartomány',
      UseAllowedZombieClasses: 'Engedélyezett Zombi Osztályok Használata',
      DisableRadio: 'Rádió Letiltása',
      DisablePoison: 'Mérgezés Letiltása',
      DisableInfection: 'Fertőzés Letiltása',
      DisableVault: 'Páncélterem Letiltása',
      TraderAreaProtection: 'Kereskedő Terület Védelem',
      TraderServiceAreaProtection: 'Kereskedő Szolgáltatás Terület Védelem',
      ShowFriendPlayerOnMap: 'Barát Játékos Mutatása Térképen',
      FriendCantDamage: 'Barát Nem Sebezhető',
      FriendCantLoot: 'Barát Nem Lootolható',
      BuildCraftTime: 'Építés Készítés Idő',
      ShowAllPlayersOnMap: 'Összes Játékos Mutatása Térképen',
      ShowSpawnWindow: 'Spawn Ablak Mutatása',
      AutoParty: 'Automatikus Csapat',
      // Palworld
      AdminPassword: 'Admin Jelszó',
      PublicPort: 'Nyilvános Port',
      PublicIP: 'Nyilvános IP',
      Region: 'Régió',
      // CS:GO / CS2
      sv_region: 'Régió',
      sv_password: 'Jelszó',
      rcon_password: 'RCON Jelszó',
      sv_lan: 'LAN Mód',
      // The Forest
      servername: 'Szerver Név',
      serverpassword: 'Szerver Jelszó',
      serverplayers: 'Max Játékosok',
      serverautosaveinterval: 'Autosave Intervallum (perc)',
      // difficulty már definiálva van (Minecraft résznél)
      inittype: 'Init Típus',
      enableVAC: 'VAC Engedélyezve',
      // Satisfactory (megjegyzés: ServerName, ServerPassword, MaxPlayers már definiálva van ARK-nál)
      // AdminPassword már definiálva van Palworld-nál
      GamePort: 'Játék Port',
      BeaconPort: 'Beacon Port',
      QueryPort: 'Query Port',
      Autopause: 'Automatikus Szünet',
      AutoSaveOnDisconnect: 'Automatikus Mentés Kijelentkezéskor',
      AutoSaveInterval: 'Automatikus Mentés Intervallum (perc)',
      NetworkQuality: 'Hálózati Minőség',
      FriendlyFire: 'Baráti Tűz',
      AutoArmor: 'Automatikus Páncél',
      EnableCheats: 'Csalások Engedélyezése',
      GamePhase: 'Játék Fázis',
      StartingPhase: 'Kezdő Fázis',
      SkipTutorial: 'Oktatóanyag Kihagyása',
    };
    return labels[key] || key;
  };

  const getFieldType = (key: string, defaultValue: any): 'text' | 'number' | 'boolean' | 'select' => {
    if (typeof defaultValue === 'boolean') return 'boolean';
    if (typeof defaultValue === 'number') return 'number';
    
    // Speciális esetek
    if (key === 'difficulty' || key === 'gamemode') return 'select';
    if (key === 'GameDifficulty' || key === 'Difficulty') return 'select';
    // 7 Days to Die GameWorld select
    if (key === 'GameWorld' && gameType === 'SEVEN_DAYS_TO_DIE') return 'select';
    // 7 Days to Die WorldGenSize select (csak RWG esetén)
    if (key === 'WorldGenSize' && gameType === 'SEVEN_DAYS_TO_DIE') return 'select';
    // 7 Days to Die boolean mezők
    if (key === 'ServerIsPublic' || key === 'BuildCreate' || key === 'TelnetEnabled' || 
        key === 'ControlPanelEnabled' || key === 'PersistentPlayerProfiles' || 
        key === 'EACEnabled' || key === 'AirDropMarker' || key === 'EnemySpawnMode' ||
        key === 'UseAllowedZombieClasses' || key === 'DisableRadio' || key === 'DisablePoison' ||
        key === 'DisableInfection' || key === 'DisableVault' || key === 'ShowFriendPlayerOnMap' ||
        key === 'FriendCantDamage' || key === 'FriendCantLoot' || key === 'BuildCraftTime' ||
        key === 'ShowAllPlayersOnMap' || key === 'ShowSpawnWindow' || key === 'AutoParty') return 'boolean';
    if (key === 'inittype') return 'select';
    if (key === 'enableVAC') return 'select';
    if (key === 'public' || key === 'sv_lan' || key === 'PvPEnabled' || key === 'PvP') return 'boolean';
    // Satisfactory boolean mezők
    if (key === 'Autopause' || key === 'AutoSaveOnDisconnect' || key === 'FriendlyFire' || 
        key === 'AutoArmor' || key === 'EnableCheats' || key === 'SkipTutorial') return 'boolean';
    // Satisfactory number mezők
    if (key === 'GamePort' || key === 'BeaconPort' || key === 'QueryPort' || 
        key === 'AutoSaveInterval' || key === 'NetworkQuality' || 
        key === 'GamePhase' || key === 'StartingPhase') return 'number';
    
    return 'text';
  };

  const getSelectOptions = (key: string): Array<{ value: string; label: string }> => {
    if (key === 'difficulty') {
      // The Forest difficulty options
      if (gameType === 'THE_FOREST') {
        return [
          { value: 'Normal', label: 'Normál' },
          { value: 'Hard', label: 'Nehéz' },
          { value: 'Hard Survival', label: 'Nehéz Túlélés' },
        ];
      }
      // Minecraft difficulty options
      return [
        { value: 'peaceful', label: 'Békés' },
        { value: 'easy', label: 'Könnyű' },
        { value: 'normal', label: 'Normál' },
        { value: 'hard', label: 'Nehéz' },
      ];
    }
    if (key === 'gamemode') {
      return [
        { value: 'survival', label: 'Túlélés' },
        { value: 'creative', label: 'Kreatív' },
        { value: 'adventure', label: 'Kaland' },
        { value: 'spectator', label: 'Néző' },
      ];
    }
    if (key === 'GameDifficulty') {
      return [
        { value: '0', label: 'Újonc' },
        { value: '1', label: 'Normál' },
        { value: '2', label: 'Veterán' },
        { value: '3', label: 'Túlélő' },
        { value: '4', label: 'Insane' },
        { value: '5', label: 'Nightmare' },
      ];
    }
    if (key === 'inittype') {
      return [
        { value: 'Continue', label: 'Folytatás' },
        { value: 'New', label: 'Új' },
      ];
    }
    if (key === 'enableVAC') {
      return [
        { value: 'on', label: 'Bekapcsolva' },
        { value: 'off', label: 'Kikapcsolva' },
      ];
    }
    // 7 Days to Die GameWorld opciók
    if (key === 'GameWorld' && gameType === 'SEVEN_DAYS_TO_DIE') {
      return [
        { value: 'Navezgane', label: 'Navezgane (Fix)' },
        { value: 'Pregen06k', label: 'Pregen 6k (Gyors)' },
        { value: 'Pregen08k', label: 'Pregen 8k (Standard)' },
        { value: 'Pregen10k', label: 'Pregen 10k (Hatalmas)' },
        { value: 'RWG', label: 'Random World Gen (RWG) - Egyedi' },
        { value: 'CUSTOM', label: 'Egyéni Feltöltött Térkép (Custom)' },
      ];
    }
    // 7 Days to Die WorldGenSize opciók (csak RWG esetén)
    if (key === 'WorldGenSize' && gameType === 'SEVEN_DAYS_TO_DIE') {
      return [
        { value: '6144', label: '6144 (Kicsi)' },
        { value: '8192', label: '8192 (Közepes - Ajánlott)' },
        { value: '10240', label: '10240 (Nagy)' },
      ];
    }
    return [];
  };

  // 7 Days to Die: Ellenőrizzük, hogy RWG vagy Custom van-e kiválasztva
  const isRWGSelected = gameType === 'SEVEN_DAYS_TO_DIE' && config.GameWorld === 'RWG';
  const isCustomSelected = gameType === 'SEVEN_DAYS_TO_DIE' && config.GameWorld === 'CUSTOM';
  const shouldShowSeedAndSize = isRWGSelected;
  const shouldShowCustomMapName = isCustomSelected;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Szerver Beállítások</h2>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
          >
            Alapértelmezett
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {saving ? 'Mentés...' : 'Mentés'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(defaults).map(([key, defaultValue]) => {
          const fieldType = getFieldType(key, defaultValue);
          const label = getFieldLabel(key);
          const isReadonly = readonlyFieldsList.includes(key);

          // 7 Days to Die: Rejtsük el a WorldGenSeed és WorldGenSize mezőket, ha nem RWG van kiválasztva
          if (gameType === 'SEVEN_DAYS_TO_DIE' && (key === 'WorldGenSeed' || key === 'WorldGenSize')) {
            if (!shouldShowSeedAndSize) {
              return null;
            }
          }

          // 7 Days to Die: Custom térkép esetén külön kezeljük a GameWorld mezőt
          if (gameType === 'SEVEN_DAYS_TO_DIE' && key === 'GameWorld') {
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                  {isReadonly && (
                    <span className="ml-2 text-xs text-gray-500">(Nem módosítható)</span>
                  )}
                </label>
                <select
                  value={config[key] ?? defaultValue}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    updateConfig(key, newValue);
                    // Ha RWG-ről váltunk másra, töröljük a Seed és Size értékeket
                    if (newValue !== 'RWG') {
                      if (config.WorldGenSeed) updateConfig('WorldGenSeed', '');
                      if (config.WorldGenSize) updateConfig('WorldGenSize', '8192');
                    }
                    // Ha Custom-ról váltunk másra, töröljük a custom map name-t
                    if (newValue !== 'CUSTOM' && config.CustomMapName) {
                      updateConfig('CustomMapName', '');
                    }
                  }}
                  disabled={isReadonly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {getSelectOptions(key).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {/* RWG figyelmeztetés */}
                {isRWGSelected && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    ⚠️ Figyelem! RWG választása esetén az első indítás 5-10 percet vehet igénybe. Ne állítsd le a szervert!
                  </p>
                )}
                {/* Custom térkép mező */}
                {shouldShowCustomMapName && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Térkép Mappa Neve
                    </label>
                    <input
                      type="text"
                      value={config.CustomMapName ?? ''}
                      onChange={(e) => updateConfig('CustomMapName', e.target.value)}
                      placeholder="pl. MyCustomMap"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-400"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      A feltöltött térkép mappa nevének pontosan meg kell egyeznie ezzel az értékkel.
                    </p>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {isReadonly && (
                  <span className="ml-2 text-xs text-gray-500">(Nem módosítható)</span>
                )}
              </label>
              {fieldType === 'boolean' ? (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config[key] ?? defaultValue}
                    onChange={(e) => updateConfig(key, e.target.checked)}
                    disabled={isReadonly}
                    className="rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    {config[key] ?? defaultValue ? 'Igen' : 'Nem'}
                  </span>
                </label>
              ) : fieldType === 'select' ? (
                <select
                  value={config[key] ?? defaultValue}
                  onChange={(e) => updateConfig(key, e.target.value)}
                  disabled={isReadonly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {getSelectOptions(key).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : fieldType === 'number' ? (
                <input
                  type="number"
                  value={config[key] ?? defaultValue}
                  onChange={(e) => updateConfig(key, parseFloat(e.target.value) || 0)}
                  disabled={isReadonly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              ) : (
                <input
                  type={key.toLowerCase().includes('password') ? 'password' : 'text'}
                  value={config[key] ?? defaultValue}
                  onChange={(e) => updateConfig(key, e.target.value)}
                  disabled={isReadonly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder={label}
                />
              )}
            </div>
          );
        })}

        {Object.keys(defaults).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nincs elérhető konfiguráció ehhez a játék típushoz
          </div>
        )}
      </div>
    </div>
  );
}

