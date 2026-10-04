import AsyncStorage from '@react-native-async-storage/async-storage';
import { FarmId, FarmOption } from '../types/farm';

export interface FarmAcreageConfig {
  namari: number;
  adukidathan: number;
}

export interface CustomFarm {
  id: string;
  name: string;
  shortCode: string;
  acreage: number;
}

export interface FarmsConfig {
  farm1: CustomFarm;
  farm2: CustomFarm;
}

// Per user instruction: No default number should be there. Names start blank or with helpful fallback.
const DEFAULT_ACREAGES: FarmAcreageConfig = {
  namari: 0,
  adukidathan: 0,
};

function getAcreageKey(orgId: string): string {
  return `@plantation_farm_acreages_${orgId}`;
}

function getSetupKey(orgId: string): string {
  return `@plantation_initial_setup_completed_${orgId}`;
}

function getCustomFarmsKey(orgId: string): string {
  return `@plantation_custom_farms_${orgId}`;
}

export async function hasCompletedInitialSetup(orgId: string): Promise<boolean> {
  const key = getSetupKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === 'true';
  } catch {
    return false;
  }
}

export async function setInitialSetupCompleted(
  orgId: string,
  completed = true
): Promise<void> {
  const key = getSetupKey(orgId);
  try {
    await AsyncStorage.setItem(key, completed ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export async function getCustomFarms(orgId: string): Promise<FarmsConfig> {
  const key = getCustomFarmsKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }

  // Check if legacy acreages exist
  const legacyAcreages = await getFarmAcreages(orgId);

  return {
    farm1: {
      id: 'namari',
      name: 'Farm 1',
      shortCode: 'F1',
      acreage: legacyAcreages.namari || 0,
    },
    farm2: {
      id: 'adukidathan',
      name: 'Farm 2',
      shortCode: 'F2',
      acreage: legacyAcreages.adukidathan || 0,
    },
  };
}

export async function saveCustomFarms(
  orgId: string,
  config: FarmsConfig
): Promise<void> {
  const key = getCustomFarmsKey(orgId);
  try {
    await AsyncStorage.setItem(key, JSON.stringify(config));
    // Also keep legacy acreages in sync
    await saveFarmAcreages(orgId, {
      namari: config.farm1.acreage,
      adukidathan: config.farm2.acreage,
    });
  } catch {
    // ignore
  }
}

export async function getFarmAcreages(orgId: string): Promise<FarmAcreageConfig> {
  const key = getAcreageKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return DEFAULT_ACREAGES;
}

export async function saveFarmAcreages(
  orgId: string,
  acreages: FarmAcreageConfig
): Promise<void> {
  const key = getAcreageKey(orgId);
  try {
    await AsyncStorage.setItem(key, JSON.stringify(acreages));
  } catch {
    // ignore
  }
}

export async function getAcreageForFarm(orgId: string, farmId: FarmId | string): Promise<number> {
  const acreages = await getFarmAcreages(orgId);
  if (farmId === 'namari' || farmId === 'farm1') return acreages.namari;
  if (farmId === 'adukidathan' || farmId === 'farm2') return acreages.adukidathan;
  return acreages.namari + acreages.adukidathan;
}

export async function getDynamicFarmOptions(orgId: string): Promise<FarmOption[]> {
  const farms = await getCustomFarms(orgId);
  return [
    {
      id: 'namari',
      label: farms.farm1.name || 'Farm 1',
      shortCode: farms.farm1.shortCode || 'F1',
      description: `${farms.farm1.acreage > 0 ? farms.farm1.acreage + ' acres' : 'Acreage not set'}`,
    },
    {
      id: 'adukidathan',
      label: farms.farm2.name || 'Farm 2',
      shortCode: farms.farm2.shortCode || 'F2',
      description: `${farms.farm2.acreage > 0 ? farms.farm2.acreage + ' acres' : 'Acreage not set'}`,
    },
    {
      id: 'consolidated',
      label: 'Consolidated',
      shortCode: 'ALL',
      description: `Combined operations (${farms.farm1.name} + ${farms.farm2.name})`,
    },
  ];
}
