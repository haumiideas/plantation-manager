export type StandardCropType = 'cardamom' | 'pepper' | 'coffee' | 'other';
export type CropType = StandardCropType | string;

export interface CropConfig {
  id: string;
  name: string;
  shortCode: string;
  primaryUnit: 'kg' | 'bags' | 'quintal' | string;
  harvestActivities: string[];
  defaultBlocks: string[];
  varieties?: string[];
  isCustom?: boolean;
}

export const CROPS_CONFIG: Record<CropType, CropConfig> = {
  cardamom: {
    id: 'cardamom',
    name: 'Small Cardamom',
    shortCode: 'CARD',
    primaryUnit: 'kg',
    harvestActivities: [
      'Cardamom Picking (1st Flush)',
      'Cardamom Picking (2nd Flush)',
      'Cardamom Picking (3rd Flush)',
      'Cardamom Picking (4th Flush)',
      'Dryer Loading & Firing',
      'Capsule Cleaning & Grading',
    ],
    defaultBlocks: ['Ridge Block A', 'Valley Block B', 'Shade Block C', 'Nursery Block'],
    varieties: ['Njallani Green Gold', 'Appangala 1', 'Palakkudi', 'Malabar', 'Vazhukka'],
  },
  pepper: {
    id: 'pepper',
    name: 'Black Pepper',
    shortCode: 'PEP',
    primaryUnit: 'kg',
    harvestActivities: [
      'Pepper Spikes Plucking',
      'Threshing & Berry Separation',
      'Solar Drying Yard Drying',
      'Pepper Vine Lopping & Tying',
    ],
    defaultBlocks: ['Block 1 (Intercropped)', 'Block 2 (Silver Oak Standards)', 'Boundary Block'],
    varieties: ['Panniyur 1', 'Panniyur 5', 'Karimunda', 'Thevam', 'Kumbhakal'],
  },
  coffee: {
    id: 'coffee',
    name: 'Robusta / Arabica Coffee',
    shortCode: 'COFF',
    primaryUnit: 'kg',
    harvestActivities: ['Berry Fly Picking', 'Main Strip Picking', 'Pulping & Washing'],
    defaultBlocks: ['Hilltop Section', 'Stream Valley Section'],
    varieties: [
      'Arabica - S.795',
      'Arabica - Chandragiri',
      'Arabica - Selection 9',
      'Arabica - Cauvery',
      'Robusta - S.274',
      'Robusta - CxR',
      'Old Robusta',
    ],
  },
  other: {
    id: 'other',
    name: 'Arecanut',
    shortCode: 'AREC',
    primaryUnit: 'kg',
    harvestActivities: ['Arecanut Nut Plucking', 'Nut Dehusking & Sun Drying', 'Weeding & Mulching'],
    defaultBlocks: ['Valley Block', 'Boundary Grove', 'Stream Section'],
    varieties: ['Mangala', 'Sumangala', 'Mohitnagar', 'Local Tall'],
  },
};
