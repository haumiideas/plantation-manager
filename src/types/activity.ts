import { FarmId } from './farm';

export type StandardTaskType =
  | 'fertigation'
  | 'weeding'
  | 'spraying'
  | 'fertilizer'
  | 'shadeLopping'
  | 'irrigation'
  | 'pruning'
  | 'maintenance'
  | 'custom';

export type FertigationMode =
  | 'gravity'
  | 'petrol_motor'
  | 'diesel_motor'
  | 'current_motor';

export type FertigationMethod =
  | 'spraying'
  | 'drenching'
  | 'semi_spraying'
  | 'drip'
  | string;

export interface FertigationDetails {
  drumsCount: number; // e.g. 5 drums
  drumCapacityLitres: number; // e.g. 200L default
  totalSolutionLitres: number; // e.g. 1000L
  mode: FertigationMode; // gravity, petrol_motor, diesel_motor, current_motor
  method: FertigationMethod; // spraying, drenching, semi_spraying, drip, or custom
  motorEquipmentId?: string;
  motorEquipmentName?: string;
  fuelConsumedLitres?: number;
  fuelLogged?: boolean;
}

export interface TaskTypeConfig {
  id: StandardTaskType;
  labelKey: string;
  defaultLabel: string;
  icon: string;
  color: string;
}

export interface ActivityChangeLog {
  editedAt: string;
  editedBy?: string;
  fieldChanges: string[];
}

export const TASK_TYPES: TaskTypeConfig[] = [
  { id: 'fertigation', labelKey: 'fertigation', defaultLabel: 'Fertigation & Drenching', icon: 'color-filter-outline', color: '#0D9488' },
  { id: 'weeding', labelKey: 'weeding', defaultLabel: 'Weeding & Trashing', icon: 'cut-outline', color: '#10B981' },
  { id: 'spraying', labelKey: 'spraying', defaultLabel: 'Spraying & Disease Control', icon: 'flask-outline', color: '#3B82F6' },
  { id: 'fertilizer', labelKey: 'fertilizer', defaultLabel: 'Fertilizer & Nutrition', icon: 'leaf-outline', color: '#8B5CF6' },
  { id: 'shadeLopping', labelKey: 'shadeLopping', defaultLabel: 'Shade Lopping & Canopy', icon: 'sunny-outline', color: '#F59E0B' },
  { id: 'irrigation', labelKey: 'irrigation', defaultLabel: 'Irrigation & Mulching', icon: 'water-outline', color: '#06B6D4' },
  { id: 'pruning', labelKey: 'pruning', defaultLabel: 'Pruning & Desuckering', icon: 'construct-outline', color: '#EC4899' },
  { id: 'maintenance', labelKey: 'maintenance', defaultLabel: 'Estate Infrastructure', icon: 'hammer-outline', color: '#64748B' },
];

export interface FieldActivityEntry {
  id: string;
  orgId: string;
  farmId: FarmId;
  date: string; // DD-MMM-YYYY
  cropId: string;
  blockName: string;
  taskType: StandardTaskType;
  activityName: string;
  workersAssigned: number;
  hoursWorked: number;
  chemicalUsed?: string;
  dilutionLitres?: number;
  costIncurred?: number;
  notes?: string;
  fertigation?: FertigationDetails;
  editHistory?: ActivityChangeLog[];
  updatedAt?: string;
  createdAt: string;
}

export const DEFAULT_TASK_ACTIVITIES: Record<StandardTaskType, string[]> = {
  fertigation: [
    '19:19:19 + Micronutrient Drum Mix Drenching',
    'Cow Dung Slurry & Jeevamrutham Basin Drenching',
    'Humic Acid & Potassium Schoenite Drenching',
    'Foliar Bio-Fertigation Spray',
    'Cardamom Root Zone Nutrient Drenching',
  ],
  weeding: [
    'Base clearing around cardamom clumps',
    'Ring weeding coffee plants',
    'Slash weeding avenues & pathways',
    'Vine & creeper removal from pepper standards',
  ],
  spraying: [
    '1% Bordeaux mixture prophylactic spray',
    'Bio-fungicide (Trichoderma / Pseudomonas)',
    'Insecticide spray for cardamom thrips',
    'Foliar micronutrient & amino acid spray',
  ],
  fertilizer: [
    'Complex NPK 17-17-17 application',
    'Organic compost & vermicompost spreading',
    'Neem cake & bio-fertilizer placement',
    'Dolomite / Agricultural Lime soil conditioning',
  ],
  shadeLopping: [
    'Pre-monsoon light shade lopping',
    'Post-monsoon canopy regulation & thinning',
    'Dadap (Erythrina) tree pollarding',
    'Silver oak side branch trimming',
  ],
  irrigation: [
    'Sprinkler irrigation cycle (hours)',
    'Drip irrigation line flush & run',
    'Hose pipe manual watering for young plants',
    'Mulching root zones with dry leaf litter',
  ],
  pruning: [
    'Coffee centering & tertiary branch removal',
    'Cardamom dry pseudostem & panicle cleaning',
    'Pepper runner shoots trimming',
    'Coffee sucker / water shoot pruning',
  ],
  maintenance: [
    'Perimeter solar fencing inspection & clearing',
    'Field inspection path & road repairs',
    'Catch pit & drainage channel clearing',
    'Rainwater harvesting check dam desilting',
  ],
  custom: [
    'Soil testing sample collection',
    'Nursery seedling bag preparation',
    'Boundary line demarcation',
  ],
};
