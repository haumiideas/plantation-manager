import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { CropConfig } from '../../types/crop';
import { FarmId, FARM_OPTIONS } from '../../types/farm';
import { useLanguage } from '../../context/LanguageContext';
import {
  HarvestEntry,
  HarvestEntryMode,
  LaborGroupOutput,
  PackagingItemUsed,
  ContractorGroupConfig,
  DEFAULT_CONTRACTOR_GROUPS,
} from '../../types/harvest';
import { PlantationWorker } from '../../types/worker';
import { formatDate } from '../../utils/date';
import {
  getContractorGroups,
  getCoffeeVarieties,
  addCoffeeVariety,
  getCustomFieldBlocks,
  addCustomFieldBlock,
  getCardamomFlushes,
  addCardamomFlush,
} from '../../services/harvestService';
import { ThemedDatePickerModal } from '../common/ThemedDatePickerModal';
import { logAuditEvent } from '../../services/auditService';
import { getLocalizedGroupName, getLocalizedBlockName } from '../../utils/localizationUtils';

interface LogHarvestModalProps {
  visible: boolean;
  onClose: () => void;
  crops: CropConfig[];
  defaultCropId?: string;
  defaultFarmId?: FarmId;
  workers: PlantationWorker[];
  editingEntry?: HarvestEntry | null;
  onSaveHarvest: (entry: Omit<HarvestEntry, 'id' | 'createdAt'>) => void;
  onUpdateHarvest?: (entry: HarvestEntry) => void;
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const LogHarvestModal: React.FC<LogHarvestModalProps> = ({
  visible,
  onClose,
  crops,
  defaultCropId = 'cardamom',
  defaultFarmId = 'namari',
  editingEntry,
  onSaveHarvest,
  onUpdateHarvest,
}) => {
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const isEditing = !!editingEntry;

  const [cropId, setCropId] = useState(defaultCropId);
  const [farmId, setFarmId] = useState<FarmId>(
    defaultFarmId === 'consolidated' ? 'namari' : defaultFarmId
  );
  const [date, setDate] = useState(formatDate());
  const [dayOfWeek, setDayOfWeek] = useState(
    DAYS_OF_WEEK[new Date().getDay()]
  );
  const [blockName, setBlockName] = useState('');
  const [variety, setVariety] = useState('');
  const [availableVarieties, setAvailableVarieties] = useState<string[]>([]);
  const [newVarietyText, setNewVarietyText] = useState('');
  const [showAddVarietyInput, setShowAddVarietyInput] = useState(false);
  const [flushNumber, setFlushNumber] = useState('2nd Flush');
  const [availableFlushes, setAvailableFlushes] = useState<string[]>([
    '1st Flush',
    '2nd Flush',
    '3rd Flush',
    '4th Flush',
  ]);
  const [showAddFlushInput, setShowAddFlushInput] = useState(false);
  const [newFlushText, setNewFlushText] = useState('');
  const [entryMode, setEntryMode] = useState<HarvestEntryMode>('bulk');

  // String buffers for labor group inputs to guarantee decimal points are never erased while typing (e.g. 208.8)
  const [groupWeightInputs, setGroupWeightInputs] = useState<Record<string, string>>({});
  const [groupWorkerInputs, setGroupWorkerInputs] = useState<Record<string, string>>({});

  // Dynamic field blocks & Date picker modal
  const [customBlocks, setCustomBlocks] = useState<string[]>([]);
  const [newBlockText, setNewBlockText] = useState('');
  const [showAddBlockInput, setShowAddBlockInput] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  // Configurable Fresh Sacks & Tare weights (Default empty sack qty, 200g tare)
  const [freshSackName, setFreshSackName] = useState('Fresh PP Picking Sack');
  const [freshSacks, setFreshSacks] = useState('');
  const [sackTare, setSackTare] = useState('0.2');
  const [grossWeight, setGrossWeight] = useState('');
  const [netWeightOverride, setNetWeightOverride] = useState('');

  // Contractor Groups (Dynamic list loaded from service, Own Estate always first)
  const [laborGroups, setLaborGroups] = useState<LaborGroupOutput[]>([]);

  // Configurable Dry Produce & Packaging (1.1kg gunny, 0.1kg plastic default, empty sack qtys)
  const [dryGunnyName, setDryGunnyName] = useState('Gunny / Jute Storage Bag');
  const [drySacksCount, setDrySacksCount] = useState('');
  const [gunnyTare, setGunnyTare] = useState('1.1');

  const [dryPlasticName, setDryPlasticName] = useState('Plastic Inner Liner Bag');
  const [dryPlasticBagsCount, setDryPlasticBagsCount] = useState('');
  const [plasticTare, setPlasticTare] = useState('0.1');

  const [dryGrossWeight, setDryGrossWeight] = useState('');
  const [dryNetWeight, setDryNetWeight] = useState('');

  const [qualityNotes, setQualityNotes] = useState('');
  const [error, setError] = useState('');

  const activeCrop = crops.find((c) => c.id === cropId) || crops[0];
  const isCardamom = activeCrop?.id === 'cardamom';
  const isCoffee = activeCrop?.id === 'coffee';

  useEffect(() => {
    if (visible) {
      const initData = async () => {
        const [groups, vars, blocks, fls] = await Promise.all([
          getContractorGroups('plantation_org_namari_adukidathan'),
          getCoffeeVarieties('plantation_org_namari_adukidathan'),
          getCustomFieldBlocks('plantation_org_namari_adukidathan', defaultCropId),
          getCardamomFlushes('plantation_org_namari_adukidathan'),
        ]);

        setAvailableVarieties(vars);
        setCustomBlocks(blocks);
        setAvailableFlushes(fls);

        // Sort master groups so Own Estate is always first
        const sortedMaster = [...groups].sort(
          (a, b) => (b.isOwnEstate ? 1 : 0) - (a.isOwnEstate ? 1 : 0)
        );

        if (editingEntry && editingEntry.laborGroups && editingEntry.laborGroups.length > 0) {
          const initWeights: Record<string, string> = {};
          const initWorkers: Record<string, string> = {};
          editingEntry.laborGroups.forEach((g) => {
            if (g.totalWeightKg) initWeights[g.id] = String(g.totalWeightKg);
            if (g.workerCount) initWorkers[g.id] = String(g.workerCount);
          });
          setGroupWeightInputs(initWeights);
          setGroupWorkerInputs(initWorkers);
          // Merge master groups with editingEntry.laborGroups to ensure Own Estate always reflects
          const merged: LaborGroupOutput[] = sortedMaster.map((m) => {
            const existing = editingEntry.laborGroups?.find(
              (eg) =>
                eg.groupId === m.id ||
                (m.isOwnEstate &&
                  (eg.groupType === 'own_estate' ||
                    (eg.groupName && eg.groupName.toLowerCase().includes('own estate')))) ||
                (eg.groupName && eg.groupName.toLowerCase() === m.name.toLowerCase())
            );

            const gName = m.isOwnEstate ? 'Own Estate workers' : m.name;

            if (existing) {
              return {
                ...existing,
                groupId: m.id,
                groupName: gName,
                groupType: m.isOwnEstate ? 'own_estate' : m.id,
              };
            }
            return {
              id: `lg-${m.id}-${Date.now()}`,
              groupId: m.id,
              groupName: gName,
              groupType: m.isOwnEstate ? 'own_estate' : m.id,
              workerCount: 0,
              totalWeightKg: 0,
              kgPerPersonPerDay: 0,
            };
          });
          setLaborGroups(merged);
        } else {
          setLaborGroups(
            sortedMaster.map((g) => ({
              id: `lg-${g.id}-${Date.now()}`,
              groupId: g.id,
              groupName: g.isOwnEstate ? 'Own Estate workers' : g.name,
              groupType: g.isOwnEstate ? 'own_estate' : g.id,
              workerCount: 0,
              totalWeightKg: 0,
              kgPerPersonPerDay: 0,
            }))
          );
        }
      };

      initData();

      if (editingEntry) {
        setCropId(editingEntry.cropId);
        setFarmId(editingEntry.farmId);
        setDate(editingEntry.date);
        setDayOfWeek(editingEntry.dayOfWeek || DAYS_OF_WEEK[new Date().getDay()]);
        setBlockName(editingEntry.blockName);
        setVariety(editingEntry.variety || '');
        setFlushNumber(editingEntry.flushNumber || '2nd Flush');
        setEntryMode(editingEntry.entryMode);
        setFreshSacks(editingEntry.freshSacksCount ? String(editingEntry.freshSacksCount) : '');
        setSackTare(String(editingEntry.sackTareWeightKg || 0.2));
        setGrossWeight(String(editingEntry.freshWeightGrossKg || editingEntry.totalWeightKg));
        setNetWeightOverride(String(editingEntry.freshWeightNetKg || editingEntry.totalWeightKg));
        setDryGrossWeight(editingEntry.dryWeightGrossKg ? String(editingEntry.dryWeightGrossKg) : '');
        setDryNetWeight(editingEntry.dryWeightNetKg ? String(editingEntry.dryWeightNetKg) : '');
        setDrySacksCount(editingEntry.dryStorageSacksCount ? String(editingEntry.dryStorageSacksCount) : '');
        setDryPlasticBagsCount(editingEntry.dryStoragePlasticBagsCount ? String(editingEntry.dryStoragePlasticBagsCount) : '');
        setQualityNotes(editingEntry.qualityNotes || '');
      } else {
        setCropId(defaultCropId);
        setFarmId(defaultFarmId === 'consolidated' ? 'namari' : defaultFarmId);
        setDate(formatDate());
        setDayOfWeek(DAYS_OF_WEEK[new Date().getDay()]);
        setVariety('');
        setEntryMode('bulk');
        setFreshSackName('Fresh PP Picking Sack');
        setFreshSacks('');
        setSackTare('0.2');
        setGrossWeight('');
        setNetWeightOverride('');
        setDryGunnyName('Gunny / Jute Storage Bag');
        setDrySacksCount('');
        setGunnyTare('1.1');
        setDryPlasticName('Plastic Inner Liner Bag');
        setDryPlasticBagsCount('');
        setPlasticTare('0.1');
        setDryGrossWeight('');
        setDryNetWeight('');
        setQualityNotes('');
        const defaultBlock = activeCrop?.defaultBlocks?.[0] || 'Ridge Block A';
        setBlockName(defaultBlock);
      }
      setError('');
    }
  }, [visible, editingEntry, defaultCropId, defaultFarmId]);

  // Compute live fresh tare net weight
  const parsedGross = parseFloat(grossWeight) || 0;
  const parsedSacks = parseInt(freshSacks, 10) || 0;
  const parsedTare = parseFloat(sackTare) || 0.2;
  const calculatedFreshTare = Number((parsedSacks * parsedTare).toFixed(2));
  const calculatedFreshNet = Math.max(0, Number((parsedGross - calculatedFreshTare).toFixed(1)));
  const finalFreshNet = netWeightOverride ? parseFloat(netWeightOverride) || calculatedFreshNet : calculatedFreshNet;

  // Compute live dry tare and net weight (1.1kg gunny, 0.1kg plastic)
  const parsedDryGross = parseFloat(dryGrossWeight) || 0;
  const parsedDrySacks = parseInt(drySacksCount, 10) || 0;
  const parsedGunnyTare = parseFloat(gunnyTare) || 1.1;
  const parsedDryPlastic = parseInt(dryPlasticBagsCount, 10) || 0;
  const parsedPlasticTare = parseFloat(plasticTare) || 0.1;

  const calculatedDryTare = Number(
    (parsedDrySacks * parsedGunnyTare + parsedDryPlastic * parsedPlasticTare).toFixed(2)
  );
  const calculatedDryNet = Math.max(0, Number((parsedDryGross - calculatedDryTare).toFixed(1)));
  const finalDryNet = dryNetWeight ? parseFloat(dryNetWeight) || calculatedDryNet : calculatedDryNet;

  // Live Dry Ratio
  const calculatedRatio =
    finalFreshNet > 0 && finalDryNet > 0
      ? Number((finalFreshNet / finalDryNet).toFixed(2))
      : undefined;

  // Update labor group with string buffering so decimal inputs like 208.8 never drop decimal
  const handleUpdateGroupCount = (idx: number, countStr: string) => {
    const updated = [...laborGroups];
    const group = updated[idx];
    setGroupWorkerInputs((prev) => ({ ...prev, [group.id]: countStr }));
    const count = parseInt(countStr, 10) || 0;
    group.workerCount = count;
    group.kgPerPersonPerDay =
      count > 0 ? Number((group.totalWeightKg / count).toFixed(2)) : 0;
    setLaborGroups(updated);
  };

  const handleUpdateGroupKg = (idx: number, kgStr: string) => {
    const updated = [...laborGroups];
    const group = updated[idx];
    setGroupWeightInputs((prev) => ({ ...prev, [group.id]: kgStr }));
    const kg = parseFloat(kgStr) || 0;
    group.totalWeightKg = kg;
    group.kgPerPersonPerDay =
      group.workerCount > 0
        ? Number((kg / group.workerCount).toFixed(2))
        : 0;
    setLaborGroups(updated);
  };

  const handleAddBlock = async () => {
    if (!newBlockText.trim()) return;
    const bName = newBlockText.trim();
    const updated = await addCustomFieldBlock(
      'plantation_org_namari_adukidathan',
      cropId,
      bName
    );
    setCustomBlocks(updated);
    setBlockName(bName);
    setNewBlockText('');
    setShowAddBlockInput(false);
  };

  const handleAddNewFlush = async () => {
    const trimmed = newFlushText.trim();
    if (!trimmed) return;
    const updated = await addCardamomFlush('plantation_org_namari_adukidathan', trimmed);
    setAvailableFlushes(updated);
    setFlushNumber(trimmed);
    setNewFlushText('');
    setShowAddFlushInput(false);
  };

  const allBlocks = Array.from(
    new Set([...(activeCrop?.defaultBlocks || ['Ridge Block A', 'Valley Block B']), ...customBlocks])
  );

  // Total workers from active labor groups
  const totalGroupWorkers = laborGroups.reduce((s, g) => s + (g.workerCount || 0), 0);
  const totalGroupKg = laborGroups.reduce((s, g) => s + (g.totalWeightKg || 0), 0);

  const handleSave = () => {
    if (!blockName.trim()) {
      setError('Please select or enter field block name');
      return;
    }

    if (finalFreshNet <= 0 && totalGroupKg <= 0) {
      setError('Please enter valid harvest weight (gross weight or labor group weights)');
      return;
    }

    const effectiveNetKg = finalFreshNet > 0 ? finalFreshNet : totalGroupKg;
    const effectiveGrossKg = parsedGross > 0 ? parsedGross : effectiveNetKg + calculatedFreshTare;

    const filteredGroups = laborGroups.filter((g) => g.workerCount > 0 || g.totalWeightKg > 0);

    const freshPackagingItems: PackagingItemUsed[] = [
      {
        id: 'fresh_sack',
        name: freshSackName.trim() || 'Fresh PP Picking Sack',
        quantity: parsedSacks,
        tarePerUnitKg: parsedTare,
        totalTareKg: calculatedFreshTare,
      },
    ];

    const dryPackagingItems: PackagingItemUsed[] = [];
    if (parsedDrySacks > 0) {
      dryPackagingItems.push({
        id: 'dry_gunny',
        name: dryGunnyName.trim() || 'Gunny / Jute Storage Bag',
        quantity: parsedDrySacks,
        tarePerUnitKg: parsedGunnyTare,
        totalTareKg: Number((parsedDrySacks * parsedGunnyTare).toFixed(2)),
      });
    }
    if (parsedDryPlastic > 0) {
      dryPackagingItems.push({
        id: 'dry_plastic',
        name: dryPlasticName.trim() || 'Plastic Inner Liner Bag',
        quantity: parsedDryPlastic,
        tarePerUnitKg: parsedPlasticTare,
        totalTareKg: Number((parsedDryPlastic * parsedPlasticTare).toFixed(2)),
      });
    }

    const harvestData = {
      orgId: 'plantation_org_namari_adukidathan',
      farmId,
      date,
      dayOfWeek,
      cropId: activeCrop.id,
      cropName: activeCrop.name,
      variety: variety.trim() || undefined,
      blockName: blockName.trim(),
      entryMode,
      workerCount: totalGroupWorkers > 0 ? totalGroupWorkers : parsedSacks > 0 ? parsedSacks : 1,
      freshPackagingItems,
      totalFreshTareKg: calculatedFreshTare,
      freshSacksCount: parsedSacks,
      sackTareWeightKg: parsedTare,
      freshWeightGrossKg: effectiveGrossKg,
      freshWeightNetKg: effectiveNetKg,
      totalWeightKg: effectiveNetKg,
      flushNumber: isCardamom ? flushNumber : undefined,
      dryPackagingItems: dryPackagingItems.length > 0 ? dryPackagingItems : undefined,
      totalDryTareKg: calculatedDryTare > 0 ? calculatedDryTare : undefined,
      dryStorageSacksCount: parsedDrySacks > 0 ? parsedDrySacks : undefined,
      dryStoragePlasticBagsCount: parsedDryPlastic > 0 ? parsedDryPlastic : undefined,
      dryWeightGrossKg: parsedDryGross > 0 ? parsedDryGross : undefined,
      dryWeightNetKg: finalDryNet > 0 ? finalDryNet : undefined,
      freshToDryRatio: calculatedRatio,
      laborGroups: filteredGroups.length > 0 ? filteredGroups : undefined,
      qualityNotes: qualityNotes.trim() || undefined,
    };

    if (isEditing && editingEntry && onUpdateHarvest) {
      onUpdateHarvest({
        ...editingEntry,
        ...harvestData,
      });
    } else {
      onSaveHarvest(harvestData);
    }

    logAuditEvent({
      orgId: 'plantation_org_namari_adukidathan',
      performedByUid: 'user_local',
      performedByName: 'Supervisor',
      action: isEditing ? 'update' : 'create',
      entityType: 'harvest',
      title: isEditing ? 'Harvest Weighment Updated' : 'Harvest Weighment Logged',
      details: `${activeCrop.name} (${harvestData.totalWeightKg} kg Net) at ${farmId.toUpperCase()} - Block: ${harvestData.blockName}`,
    });

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons
                name={isEditing ? 'pencil' : 'leaf'}
                size={22}
                color={colors.primary}
              />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isEditing ? 'Edit Harvest Record' : 'Log Harvest Weighment'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: '#EF444420' }]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Farm & Day & Date */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={[styles.label, { color: colors.text }]}>Estate / Farm</Text>
                <View style={styles.farmRow}>
                  {FARM_OPTIONS.filter((f) => f.id !== 'consolidated').map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => setFarmId(f.id)}
                      style={[
                        styles.chip,
                        {
                          borderColor: farmId === f.id ? colors.primary : colors.border,
                          backgroundColor:
                            farmId === f.id
                              ? isDark
                                ? '#1B3D2F'
                                : '#DCFCE7'
                              : colors.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color:
                              farmId === f.id
                                ? isDark
                                  ? colors.primaryLight
                                  : colors.primary
                                : colors.textMuted,
                            fontWeight: farmId === f.id ? '700' : '500',
                          },
                        ]}
                      >
                        {f.shortCode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.col}>
                <Text style={[styles.label, { color: colors.text }]}>{t('date') || 'Picking Date'}</Text>
                <TouchableOpacity
                  onPress={() => setIsDatePickerVisible(true)}
                  style={[
                    styles.datePickerTrigger,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={[styles.datePickerValueText, { color: colors.text }]}>
                    {date}
                  </Text>
                  <Text style={[styles.dayOfWeekSubText, { color: colors.primary }]}>
                    ({dayOfWeek})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Block Selector with Dynamic Custom Blocks */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>
                {t('fieldBlock') || 'Field Block / Section'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddBlockInput((prev) => !prev)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Ionicons name="add-circle" size={16} color={colors.primary} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                  + Add Block
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inline Add Custom Block Input */}
            {showAddBlockInput && (
              <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="e.g. Valley Section C"
                  placeholderTextColor={colors.textMuted}
                  value={newBlockText}
                  onChangeText={setNewBlockText}
                />
                <TouchableOpacity
                  onPress={handleAddBlock}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.blocksContainer}>
              {allBlocks.map((b) => (
                <TouchableOpacity
                  key={b}
                  onPress={() => setBlockName(b)}
                  style={[
                    styles.blockChip,
                    {
                      borderColor: blockName === b ? colors.primary : colors.border,
                      backgroundColor:
                        blockName === b
                          ? isDark
                            ? '#1B3D2F'
                            : '#DCFCE7'
                          : colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          blockName === b
                            ? isDark
                              ? colors.primaryLight
                              : colors.primary
                            : colors.textMuted,
                        fontWeight: blockName === b ? '700' : '500',
                      },
                    ]}
                  >
                    {getLocalizedBlockName(b, language)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="Or type custom block..."
              placeholderTextColor={colors.textMuted}
              value={blockName}
              onChangeText={setBlockName}
            />

            {/* Coffee Variety Selector */}
            {isCoffee && (
              <View style={styles.sectionCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.sectionCardTitle, { color: '#B45309' }]}>
                    {t('coffeeVariety')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAddVarietyInput((prev) => !prev)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Ionicons name="add-circle" size={15} color="#B45309" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#B45309' }}>
                      {t('addVariety')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Inline Add Variety Input */}
                {showAddVarietyInput && (
                  <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
                    <TextInput
                      style={[
                        styles.input,
                        { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                      ]}
                      placeholder={t('newVarietyPlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      value={newVarietyText}
                      onChangeText={setNewVarietyText}
                    />
                    <TouchableOpacity
                      onPress={async () => {
                        if (!newVarietyText.trim()) return;
                        const updated = await addCoffeeVariety(
                          'plantation_org_namari_adukidathan',
                          newVarietyText.trim()
                        );
                        setAvailableVarieties(updated);
                        setVariety(newVarietyText.trim());
                        setNewVarietyText('');
                        setShowAddVarietyInput(false);
                      }}
                      style={{
                        backgroundColor: '#B45309',
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>
                        {t('save')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Editable Variety Name Input */}
                <View style={{ marginVertical: 6 }}>
                  <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                    {t('varietyName')} (Tap a chip below or edit directly)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, color: colors.text, borderColor: '#B45309', fontWeight: '700' },
                    ]}
                    value={variety}
                    onChangeText={setVariety}
                    placeholder="e.g. Arabica - S.795"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* Arabica Varieties */}
                <View style={styles.varietyCategory}>
                  <Text style={[styles.varietyCategoryTitle, { color: colors.text }]}>
                    Arabica Varieties:
                  </Text>
                  <View style={styles.varietyChipsRow}>
                    {availableVarieties
                      .filter((v) => v.toLowerCase().includes('arabica'))
                      .map((v) => (
                        <TouchableOpacity
                          key={v}
                          onPress={() => setVariety(v)}
                          style={[
                            styles.varietyChip,
                            {
                              borderColor: variety === v ? '#B45309' : colors.border,
                              backgroundColor:
                                variety === v
                                  ? isDark
                                    ? '#78350F'
                                    : '#FEF3C7'
                                  : colors.background,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.varietyChipText,
                              {
                                color: variety === v ? '#B45309' : colors.text,
                                fontWeight: variety === v ? '700' : '500',
                              },
                            ]}
                          >
                            {v.replace('Arabica - ', '')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>

                {/* Robusta Varieties */}
                <View style={[styles.varietyCategory, { marginTop: 6 }]}>
                  <Text style={[styles.varietyCategoryTitle, { color: colors.text }]}>
                    Robusta Varieties:
                  </Text>
                  <View style={styles.varietyChipsRow}>
                    {availableVarieties
                      .filter((v) => v.toLowerCase().includes('robusta'))
                      .map((v) => (
                        <TouchableOpacity
                          key={v}
                          onPress={() => setVariety(v)}
                          style={[
                            styles.varietyChip,
                            {
                              borderColor: variety === v ? '#B45309' : colors.border,
                              backgroundColor:
                                variety === v
                                  ? isDark
                                    ? '#78350F'
                                    : '#FEF3C7'
                                  : colors.background,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.varietyChipText,
                              {
                                color: variety === v ? '#B45309' : colors.text,
                                fontWeight: variety === v ? '700' : '500',
                              },
                            ]}
                          >
                            {v.replace('Robusta - ', '')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>

                {/* Custom / Other Varieties */}
                {availableVarieties.some(
                  (v) =>
                    !v.toLowerCase().includes('arabica') &&
                    !v.toLowerCase().includes('robusta')
                ) && (
                  <View style={[styles.varietyCategory, { marginTop: 6 }]}>
                    <Text style={[styles.varietyCategoryTitle, { color: colors.text }]}>
                      Custom Varieties:
                    </Text>
                    <View style={styles.varietyChipsRow}>
                      {availableVarieties
                        .filter(
                          (v) =>
                            !v.toLowerCase().includes('arabica') &&
                            !v.toLowerCase().includes('robusta')
                        )
                        .map((v) => (
                          <TouchableOpacity
                            key={v}
                            onPress={() => setVariety(v)}
                            style={[
                              styles.varietyChip,
                              {
                                borderColor: variety === v ? '#B45309' : colors.border,
                                backgroundColor:
                                  variety === v
                                    ? isDark
                                      ? '#78350F'
                                      : '#FEF3C7'
                                    : colors.background,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.varietyChipText,
                                {
                                  color: variety === v ? '#B45309' : colors.text,
                                  fontWeight: variety === v ? '700' : '500',
                                },
                              ]}
                            >
                              {v}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Cardamom Flush */}
            {isCardamom && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>{t('cardamomPickingFlush')}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (!showAddFlushInput) {
                        const nextNum = availableFlushes.length + 1;
                        const suffix = nextNum === 1 ? 'st' : nextNum === 2 ? 'nd' : nextNum === 3 ? 'rd' : 'th';
                        setNewFlushText(`${nextNum}${suffix} Flush`);
                      }
                      setShowAddFlushInput(!showAddFlushInput);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Ionicons name={showAddFlushInput ? 'close-circle' : 'add-circle'} size={15} color={colors.primary} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                      {showAddFlushInput ? 'Cancel' : '+ Add Flush'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showAddFlushInput && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 8, alignItems: 'center' }}>
                    <TextInput
                      style={[
                        styles.input,
                        { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                      ]}
                      placeholder="e.g. 5th Flush, Late Flush"
                      placeholderTextColor={colors.textMuted}
                      value={newFlushText}
                      onChangeText={setNewFlushText}
                      autoFocus
                    />
                    <TouchableOpacity
                      onPress={handleAddNewFlush}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Save</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  <View style={styles.flushRow}>
                    {availableFlushes.map((fl) => (
                      <TouchableOpacity
                        key={fl}
                        onPress={() => setFlushNumber(fl)}
                        style={[
                          styles.flushChip,
                          {
                            borderColor: flushNumber === fl ? '#D97706' : colors.border,
                            backgroundColor:
                              flushNumber === fl
                                ? isDark
                                  ? '#78350F'
                                  : '#FEF3C7'
                                : colors.background,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.flushText,
                            {
                              color: flushNumber === fl ? '#D97706' : colors.textMuted,
                              fontWeight: flushNumber === fl ? '800' : '600',
                            },
                          ]}
                        >
                          {fl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            {/* FRESH WEIGHT WITH SACK & WITHOUT SACK */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionCardTitle, { color: colors.primary }]}>
                {t('freshHarvestTare')}
              </Text>

              <View style={styles.row}>
                <View style={{ flex: 2 }}>
                  <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                    Sack Material / Name
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                    ]}
                    value={freshSackName}
                    onChangeText={setFreshSackName}
                    placeholder="Fresh PP Picking Sack"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                    Sack Qty
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                    ]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={freshSacks}
                    onChangeText={setFreshSacks}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                    Tare/Sack (kg)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                    ]}
                    keyboardType="decimal-pad"
                    placeholder="0.2"
                    placeholderTextColor={colors.textMuted}
                    value={sackTare}
                    onChangeText={setSackTare}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                    {t('grossWeight')}
                  </Text>
                  <TextInput
                    style={[
                      styles.inputLarge,
                      { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                    ]}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 382.0"
                    placeholderTextColor={colors.textMuted}
                    value={grossWeight}
                    onChangeText={setGrossWeight}
                  />
                </View>

                <View style={styles.col}>
                  <Text style={[styles.subLabel, { color: colors.primary }]}>
                    {t('netWeight')}
                  </Text>
                  <TextInput
                    style={[
                      styles.inputLarge,
                      { backgroundColor: colors.card, color: colors.primary, borderColor: colors.primary },
                    ]}
                    keyboardType="decimal-pad"
                    placeholder={String(calculatedFreshNet)}
                    placeholderTextColor={colors.textMuted}
                    value={netWeightOverride || (calculatedFreshNet > 0 ? String(calculatedFreshNet) : '')}
                    onChangeText={setNetWeightOverride}
                  />
                </View>
              </View>

              {parsedSacks > 0 && parsedGross > 0 && (
                <Text style={[styles.tareMathHint, { color: colors.textMuted }]}>
                  Formula: {parsedGross} kg Gross - ({parsedSacks} sacks × {parsedTare} kg tare = {calculatedFreshTare} kg) = {calculatedFreshNet} kg Net
                </Text>
              )}
            </View>

            {/* LABOR CONTRACTOR GROUPS (OWN ESTATE, BOOPATHI, THANGAMANI) */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <View style={styles.sectionTitleWithTotal}>
                <Text style={[styles.sectionCardTitle, { color: colors.primary }]}>
                  {t('laborContractorGroups')}
                </Text>
                {totalGroupKg > 0 && (
                  <Text style={[styles.groupSumBadge, { color: colors.primary }]}>
                    {totalGroupWorkers} workers • {totalGroupKg.toFixed(1)} kg
                  </Text>
                )}
              </View>

              {laborGroups.map((group, idx) => (
                <View
                  key={group.id}
                  style={[
                    styles.laborGroupInputRow,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.groupNameColumn}>
                    <Text style={[styles.groupRowLabel, { color: colors.text }]}>
                      {getLocalizedGroupName(group.groupName, language)}
                    </Text>
                    {group.kgPerPersonPerDay > 0 && (
                      <Text style={[styles.groupPerPersonHint, { color: colors.primary }]}>
                        ⚡ {group.kgPerPersonPerDay.toFixed(1)} kg / person / day
                      </Text>
                    )}
                  </View>

                  <View style={styles.groupInputCol}>
                    <Text style={[styles.tinyLabel, { color: colors.textMuted }]}>{t('pickers')}</Text>
                    <TextInput
                      style={[
                        styles.inputSmall,
                        { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                      ]}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      value={
                        groupWorkerInputs[group.id] !== undefined
                          ? groupWorkerInputs[group.id]
                          : group.workerCount > 0
                          ? String(group.workerCount)
                          : ''
                      }
                      onChangeText={(v) => handleUpdateGroupCount(idx, v)}
                    />
                  </View>

                  <View style={styles.groupInputCol}>
                    <Text style={[styles.tinyLabel, { color: colors.textMuted }]}>Weight (kg)</Text>
                    <TextInput
                      style={[
                        styles.inputSmall,
                        { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                      ]}
                      keyboardType="decimal-pad"
                      placeholder="0.0"
                      placeholderTextColor={colors.textMuted}
                      value={
                        groupWeightInputs[group.id] !== undefined
                          ? groupWeightInputs[group.id]
                          : group.totalWeightKg > 0
                          ? String(group.totalWeightKg)
                          : ''
                      }
                      onChangeText={(v) => handleUpdateGroupKg(idx, v)}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* DRY PRODUCE & STORAGE PACKAGING (CONFIGURABLE TARE) */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionCardTitle, { color: '#D97706' }]}>
                {t('dryPackaging')}
              </Text>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                    Dry Weight with Sack (Gross kg)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                    ]}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 83.4"
                    placeholderTextColor={colors.textMuted}
                    value={dryGrossWeight}
                    onChangeText={setDryGrossWeight}
                  />
                </View>

                <View style={styles.col}>
                  <Text style={[styles.subLabel, { color: '#D97706' }]}>
                    Dry Net without Sack (kg)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                    ]}
                    keyboardType="decimal-pad"
                    placeholder={String(calculatedDryNet)}
                    placeholderTextColor={colors.textMuted}
                    value={dryNetWeight || (calculatedDryNet > 0 ? String(calculatedDryNet) : '')}
                    onChangeText={setDryNetWeight}
                  />
                </View>
              </View>

              {/* Gunny Bag Packaging Config */}
              <View style={styles.row}>
                <View style={{ flex: 2 }}>
                  <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                    Gunny Bag Type
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                    ]}
                    value={dryGunnyName}
                    onChangeText={setDryGunnyName}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                    Sacks Qty
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                    ]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={drySacksCount}
                    onChangeText={setDrySacksCount}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                    Tare (kg/ea)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                    ]}
                    keyboardType="decimal-pad"
                    placeholder="1.1"
                    placeholderTextColor={colors.textMuted}
                    value={gunnyTare}
                    onChangeText={setGunnyTare}
                  />
                </View>
              </View>

              {/* Plastic Inner Bag Config */}
              <View style={styles.row}>
                <View style={{ flex: 2 }}>
                  <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                    Plastic Liner Bag Type
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                    ]}
                    value={dryPlasticName}
                    onChangeText={setDryPlasticName}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                    Plastics Qty
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                    ]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={dryPlasticBagsCount}
                    onChangeText={setDryPlasticBagsCount}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                    Tare (kg/ea)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                    ]}
                    keyboardType="decimal-pad"
                    placeholder="0.1"
                    placeholderTextColor={colors.textMuted}
                    value={plasticTare}
                    onChangeText={setPlasticTare}
                  />
                </View>
              </View>

              {calculatedDryTare > 0 && parsedDryGross > 0 && (
                <Text style={[styles.tareMathHint, { color: colors.textMuted }]}>
                  Tare Deduction: ({parsedDrySacks} gunny × {parsedGunnyTare}kg) + ({parsedDryPlastic} plastic × {parsedPlasticTare}kg) = {calculatedDryTare} kg tare. Net = {calculatedDryNet} kg.
                </Text>
              )}

              {calculatedRatio && (
                <Text style={[styles.ratioBadge, { color: '#D97706' }]}>
                  Fresh to Dry Outturn Ratio: {calculatedRatio} : 1 (
                  {((1 / calculatedRatio) * 100).toFixed(1)}% recovery)
                </Text>
              )}
            </View>

            {/* Quality Notes */}
            <Text style={[styles.label, { color: colors.text }]}>Quality & Field Notes</Text>
            <TextInput
              style={[
                styles.notesInput,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="e.g. Clean harvesting, bold green maturity, bagged in shade."
              placeholderTextColor={colors.textMuted}
              value={qualityNotes}
              onChangeText={setQualityNotes}
              multiline
            />

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.btnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.saveBtnText}>
                  {isEditing ? 'Update Harvest Record' : 'Save Harvest Record'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      <ThemedDatePickerModal
        visible={isDatePickerVisible}
        onClose={() => setIsDatePickerVisible(false)}
        selectedDate={date}
        onSelectDate={(formattedDate, _iso, dayName) => {
          setDate(formattedDate);
          setDayOfWeek(dayName);
        }}
        title="Select Picking Date"
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '94%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    maxHeight: 560,
  },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 4,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  tinyLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  farmRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
  },
  inputLarge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: '800',
  },
  inputSmall: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '700',
  },
  blocksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  blockChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  flushRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  flushChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  flushText: {
    fontSize: 11,
  },
  sectionCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 6,
    gap: 6,
  },
  sectionCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sectionTitleWithTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupSumBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  tareMathHint: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  laborGroupInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  groupNameColumn: {
    flex: 3,
  },
  groupRowLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  groupPerPersonHint: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  groupInputCol: {
    flex: 1.5,
  },
  ratioBadge: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    minHeight: 45,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  subText: {
    fontSize: 11,
    lineHeight: 15,
  },
  varietyCategory: {
    marginBottom: 4,
  },
  varietyCategoryTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  varietyChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  varietyChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  varietyChipText: {
    fontSize: 11,
  },
  selectedVarietyHint: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  datePickerValueText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dayOfWeekSubText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
