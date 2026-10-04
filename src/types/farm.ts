export type FarmId = 'namari' | 'adukidathan' | 'consolidated';

export interface FarmOption {
  id: FarmId;
  label: string;
  shortCode: string;
  description: string;
}

export const FARM_OPTIONS: FarmOption[] = [
  {
    id: 'namari',
    label: 'Namari Farm',
    shortCode: 'NAM',
    description: 'Cardamom & Pepper block 1',
  },
  {
    id: 'adukidathan',
    label: 'Adukidathan Farm',
    shortCode: 'ADU',
    description: 'Cardamom & Pepper block 2',
  },
  {
    id: 'consolidated',
    label: 'Consolidated',
    shortCode: 'ALL',
    description: 'Combined operations (Namari + Adukidathan)',
  },
];
