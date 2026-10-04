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
import { useLanguage } from '../../context/LanguageContext';
import { FarmId, FARM_OPTIONS } from '../../types/farm';
import {
  FieldActivityEntry,
  StandardTaskType,
  TASK_TYPES,
  FertigationMode,
  FertigationMethod,
  ActivityChangeLog,
} from '../../types/activity';
import {
  getTaskTypeActivities,
  addActivityToTaskType,
  getCustomFertigationMethods,
  addCustomFertigationMethod,
} from '../../services/activityService';
import { formatDate } from '../../utils/date';

interface LogActivityModalProps {
  visible: boolean;
  onClose: () => void;
  defaultFarmId?: FarmId;
  orgId: string;
  editingEntry?: FieldActivityEntry | null;
  onSave: (entry: Omit<FieldActivityEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: string; editHistory?: ActivityChangeLog[] }) => void;
}

export const LogActivityModal: React.FC<LogActivityModalProps> = ({
  visible,
  onClose,
  defaultFarmId = 'namari',
  orgId,
  editingEntry,
  onSave,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [farmId, setFarmId] = useState<FarmId>(
    defaultFarmId === 'consolidated' ? 'namari' : defaultFarmId
  );
  const [date, setDate] = useState(formatDate());
  const [cropId, setCropId] = useState('cardamom');
  const [blockName, setBlockName] = useState('Ridge Block A');
  const [taskType, setTaskType] = useState<StandardTaskType>('weeding');
  const [activityName, setActivityName] = useState('');
  const [taskActivities, setTaskActivities] = useState<Record<StandardTaskType, string[]>>({} as any);

  // Adding new activity
  const [showAddActivityInput, setShowAddActivityInput] = useState(false);
  const [newActivityText, setNewActivityText] = useState('');

  // Custom Fertigation Methods
  const [customMethods, setCustomMethods] = useState<string[]>([]);
  const [showAddMethodInput, setShowAddMethodInput] = useState(false);
  const [newMethodText, setNewMethodText] = useState('');

  // Operational metrics
  const [workersAssigned, setWorkersAssigned] = useState('4');
  const [hoursWorked, setHoursWorked] = useState('8');
  const [chemicalUsed, setChemicalUsed] = useState('');
  const [dilutionLitres, setDilutionLitres] = useState('');
  const [costIncurred, setCostIncurred] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Fertigation parameters
  const [fertDrumsCount, setFertDrumsCount] = useState('5');
  const [fertDrumCapacity, setFertDrumCapacity] = useState('200');
  const [fertMode, setFertMode] = useState<FertigationMode>('petrol_motor');
  const [fertMethod, setFertMethod] = useState<FertigationMethod>('drenching');
  const [fertFuelLitres, setFertFuelLitres] = useState('3.5');
  const [fertAutoLogFuel, setFertAutoLogFuel] = useState(true);

  useEffect(() => {
    if (visible) {
      const loadData = async () => {
        const mapping = await getTaskTypeActivities(orgId);
        setTaskActivities(mapping);

        const customMeths = await getCustomFertigationMethods(orgId);
        setCustomMethods(customMeths);

        if (editingEntry) {
          setFarmId(editingEntry.farmId || 'namari');
          setDate(editingEntry.date || formatDate());
          setCropId(editingEntry.cropId || 'cardamom');
          setBlockName(editingEntry.blockName || 'Ridge Block A');
          setTaskType(editingEntry.taskType || 'weeding');
          setActivityName(editingEntry.activityName || '');
          setWorkersAssigned(String(editingEntry.workersAssigned || 1));
          setHoursWorked(String(editingEntry.hoursWorked || 8));
          setCostIncurred(editingEntry.costIncurred ? String(editingEntry.costIncurred) : '');
          setChemicalUsed(editingEntry.chemicalUsed || '');
          setDilutionLitres(editingEntry.dilutionLitres ? String(editingEntry.dilutionLitres) : '');
          setNotes(editingEntry.notes || '');

          if (editingEntry.fertigation) {
            setFertDrumsCount(String(editingEntry.fertigation.drumsCount || 5));
            setFertDrumCapacity(String(editingEntry.fertigation.drumCapacityLitres || 200));
            setFertMode(editingEntry.fertigation.mode || 'petrol_motor');
            setFertMethod(editingEntry.fertigation.method || 'drenching');
            setFertFuelLitres(editingEntry.fertigation.fuelConsumedLitres ? String(editingEntry.fertigation.fuelConsumedLitres) : '3.5');
            setFertAutoLogFuel(!!editingEntry.fertigation.fuelConsumedLitres);
          }
        } else {
          setDate(formatDate());
          const currentList = mapping[taskType] || [];
          if (currentList.length > 0 && !activityName) {
            setActivityName(currentList[0]);
          }
        }
      };
      loadData();
      setError('');
    }
  }, [visible, orgId, editingEntry]);

  const handleSelectTaskType = (type: StandardTaskType) => {
    setTaskType(type);
    const list = taskActivities[type] || [];
    if (list.length > 0) {
      setActivityName(list[0]);
    } else {
      setActivityName('');
    }
  };

  const handleAddCustomActivity = async () => {
    if (!newActivityText.trim()) return;
    const updated = await addActivityToTaskType(orgId, taskType, newActivityText.trim());
    setTaskActivities(updated);
    setActivityName(newActivityText.trim());
    setNewActivityText('');
    setShowAddActivityInput(false);
  };

  const handleAddCustomMethod = async () => {
    if (!newMethodText.trim()) return;
    const updated = await addCustomFertigationMethod(newMethodText.trim(), orgId);
    setCustomMethods(updated);
    setFertMethod(newMethodText.trim());
    setNewMethodText('');
    setShowAddMethodInput(false);
  };

  const handleSave = () => {
    if (!blockName.trim()) {
      setError('Please enter field block/section');
      return;
    }
    if (!activityName.trim()) {
      setError('Please select or type an activity name');
      return;
    }

    const workers = parseInt(workersAssigned, 10) || 1;
    const hours = parseFloat(hoursWorked) || 8;
    const cost = costIncurred ? parseFloat(costIncurred) || 0 : undefined;
    const litres = dilutionLitres ? parseFloat(dilutionLitres) || undefined : undefined;

    const fertDetails = taskType === 'fertigation' ? {
      drumsCount: parseFloat(fertDrumsCount) || 1,
      drumCapacityLitres: parseFloat(fertDrumCapacity) || 200,
      totalSolutionLitres: (parseFloat(fertDrumsCount) || 1) * (parseFloat(fertDrumCapacity) || 200),
      mode: fertMode,
      method: fertMethod,
      fuelConsumedLitres: (fertMode === 'petrol_motor' || fertMode === 'diesel_motor') && fertAutoLogFuel
        ? parseFloat(fertFuelLitres) || undefined
        : undefined,
    } : undefined;

    // Diff calculation for edit audit trail
    let editHistory = editingEntry?.editHistory || [];
    if (editingEntry) {
      const changes: string[] = [];
      if (editingEntry.workersAssigned !== workers) {
        changes.push(`Workers: ${editingEntry.workersAssigned} ➔ ${workers}`);
      }
      if (editingEntry.hoursWorked !== hours) {
        changes.push(`Hours: ${editingEntry.hoursWorked} ➔ ${hours}`);
      }
      if ((editingEntry.costIncurred || 0) !== (cost || 0)) {
        changes.push(`Cost: ₹${editingEntry.costIncurred || 0} ➔ ₹${cost || 0}`);
      }
      if (editingEntry.blockName !== blockName.trim()) {
        changes.push(`Block: ${editingEntry.blockName} ➔ ${blockName.trim()}`);
      }
      if (editingEntry.activityName !== activityName.trim()) {
        changes.push(`Activity: ${editingEntry.activityName} ➔ ${activityName.trim()}`);
      }
      if ((editingEntry.chemicalUsed || '') !== chemicalUsed.trim()) {
        changes.push(`Chemical: ${editingEntry.chemicalUsed || 'None'} ➔ ${chemicalUsed.trim() || 'None'}`);
      }
      if (editingEntry.taskType !== taskType) {
        changes.push(`Type: ${editingEntry.taskType} ➔ ${taskType}`);
      }
      if (taskType === 'fertigation' && fertDetails) {
        if (editingEntry.fertigation?.drumsCount !== fertDetails.drumsCount) {
          changes.push(`Drums: ${editingEntry.fertigation?.drumsCount || 0} ➔ ${fertDetails.drumsCount}`);
        }
        if (editingEntry.fertigation?.mode !== fertDetails.mode) {
          changes.push(`Mode: ${editingEntry.fertigation?.mode || 'None'} ➔ ${fertDetails.mode}`);
        }
        if (editingEntry.fertigation?.method !== fertDetails.method) {
          changes.push(`Method: ${editingEntry.fertigation?.method || 'None'} ➔ ${fertDetails.method}`);
        }
      }

      if (changes.length > 0) {
        editHistory = [
          ...editHistory,
          {
            editedAt: new Date().toISOString(),
            fieldChanges: changes,
          },
        ];
      }
    }

    onSave({
      id: editingEntry?.id,
      createdAt: editingEntry?.createdAt,
      orgId,
      farmId,
      date,
      cropId,
      blockName: blockName.trim(),
      taskType,
      activityName: activityName.trim(),
      workersAssigned: workers,
      hoursWorked: hours,
      chemicalUsed: chemicalUsed.trim() || undefined,
      dilutionLitres: litres,
      costIncurred: cost,
      notes: notes.trim() || undefined,
      fertigation: fertDetails,
      editHistory: editingEntry ? editHistory : undefined,
    });

    onClose();
  };

  const availableForType = taskActivities[taskType] || [];

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
              <Ionicons name="construct" size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {editingEntry ? (t('editActivity') || 'Edit Field Activity') : t('logActivity')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Farm & Date Row */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={[styles.label, { color: colors.text }]}>{t('farm')}</Text>
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
                <Text style={[styles.label, { color: colors.text }]}>{t('date')}</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                  ]}
                  value={date}
                  onChangeText={setDate}
                />
              </View>
            </View>

            {/* Block & Crop */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={[styles.label, { color: colors.text }]}>{t('block')}</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                  ]}
                  value={blockName}
                  onChangeText={setBlockName}
                  placeholder="e.g. Ridge Block A"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.col}>
                <Text style={[styles.label, { color: colors.text }]}>{t('crop')}</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                  ]}
                  value={cropId}
                  onChangeText={setCropId}
                  placeholder="cardamom, coffee, pepper"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Task Type Chips */}
            <Text style={[styles.label, { color: colors.text, marginTop: 6 }]}>
              {t('taskType')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.taskTypeScroll}>
              {TASK_TYPES.map((type) => {
                const isSelected = taskType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => handleSelectTaskType(type.id)}
                    style={[
                      styles.taskTypeChip,
                      {
                        backgroundColor: isSelected ? type.color : colors.background,
                        borderColor: isSelected ? type.color : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={14}
                      color={isSelected ? '#FFFFFF' : type.color}
                    />
                    <Text
                      style={[
                        styles.taskTypeChipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {t(type.labelKey as any) || type.defaultLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Activities within Selected Task Type */}
            <View style={[styles.sectionCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionCardTitle, { color: colors.text }]}>
                  {t('activityName')}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddActivityInput((prev) => !prev)}
                  style={styles.addInlineBtn}
                >
                  <Ionicons name="add-circle" size={15} color={colors.primary} />
                  <Text style={[styles.addInlineBtnText, { color: colors.primary }]}>
                    {t('addActivity')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Inline Add Activity Input */}
              {showAddActivityInput && (
                <View style={styles.inlineAddRow}>
                  <TextInput
                    style={[
                      styles.input,
                      { flex: 1, backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                    ]}
                    placeholder="Enter activity description..."
                    placeholderTextColor={colors.textMuted}
                    value={newActivityText}
                    onChangeText={setNewActivityText}
                  />
                  <TouchableOpacity
                    onPress={handleAddCustomActivity}
                    style={[styles.saveInlineBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.saveInlineBtnText}>{t('save')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Selected Activity editable directly */}
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, color: colors.primary, borderColor: colors.primary, fontWeight: '700', marginVertical: 6 },
                ]}
                value={activityName}
                onChangeText={setActivityName}
                placeholder="Select from below or edit directly..."
                placeholderTextColor={colors.textMuted}
              />

              {/* Preset Activity Chips */}
              <View style={styles.activitiesGrid}>
                {availableForType.map((act) => {
                  const isSelected = activityName === act;
                  return (
                    <TouchableOpacity
                      key={act}
                      onPress={() => setActivityName(act)}
                      style={[
                        styles.activityOptionChip,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected
                            ? isDark
                              ? '#1B3D2F'
                              : '#DCFCE7'
                            : colors.card,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activityOptionText,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {act}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Workers & Hours */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={[styles.label, { color: colors.text }]}>{t('workersAssigned')}</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                  ]}
                  keyboardType="numeric"
                  value={workersAssigned}
                  onChangeText={setWorkersAssigned}
                  placeholder="4"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.col}>
                <Text style={[styles.label, { color: colors.text }]}>{t('hoursWorked')}</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                  ]}
                  keyboardType="decimal-pad"
                  value={hoursWorked}
                  onChangeText={setHoursWorked}
                  placeholder="8"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.col}>
                <Text style={[styles.label, { color: colors.text }]}>{t('costIncurred')}</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                  ]}
                  keyboardType="decimal-pad"
                  value={costIncurred}
                  onChangeText={setCostIncurred}
                  placeholder="₹ 1800"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Chemical & Spray Volume (If Spraying or Fertilizer) */}
            {(taskType === 'spraying' || taskType === 'fertilizer') && (
              <View style={styles.row}>
                <View style={{ flex: 2 }}>
                  <Text style={[styles.label, { color: colors.text }]}>{t('chemicalUsed')}</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                    ]}
                    value={chemicalUsed}
                    onChangeText={setChemicalUsed}
                    placeholder="e.g. 1% Bordeaux / DAP"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>{t('dilutionLitres')}</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                    ]}
                    keyboardType="numeric"
                    value={dilutionLitres}
                    onChangeText={setDilutionLitres}
                    placeholder="450"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            )}

            {/* Fertigation Process Specifics */}
            {taskType === 'fertigation' && (
              <View
                style={{
                  backgroundColor: colors.surfaceSubtle,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#0D948840',
                  padding: 14,
                  marginBottom: 12,
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="color-filter" size={16} color="#0D9488" />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                      {t('fertigation' as any) || 'Fertigation Process Specifications'}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: '#0D948820', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#0D9488' }}>
                      {(parseFloat(fertDrumsCount) || 0) * (parseFloat(fertDrumCapacity) || 0)} L Total
                    </Text>
                  </View>
                </View>

                {/* Drums count and drum capacity */}
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      {t('drums') || 'Drums'} *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                      ]}
                      keyboardType="numeric"
                      value={fertDrumsCount}
                      onChangeText={setFertDrumsCount}
                      placeholder="e.g. 5"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={[styles.label, { color: colors.text }]}>Drum Capacity (L)</Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                      ]}
                      keyboardType="numeric"
                      value={fertDrumCapacity}
                      onChangeText={setFertDrumCapacity}
                      placeholder="200"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* Fertilizer/Nutrient mix description */}
                <View>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t('chemicalUsed') || 'Fertilizer / Nutrient Drum Mix'}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                    ]}
                    value={chemicalUsed}
                    onChangeText={setChemicalUsed}
                    placeholder="e.g. 19:19:19 + Humic Acid + Cow Dung Slurry"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* Mode of Application */}
                <View>
                  <Text style={[styles.label, { color: colors.text, marginBottom: 6 }]}>
                    {t('applicationMode') || 'Application Mode'} *
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      { id: 'gravity' as FertigationMode, label: 'Gravity', icon: 'water-outline' },
                      { id: 'petrol_motor' as FertigationMode, label: 'Petrol Motor', icon: 'speedometer-outline' },
                      { id: 'diesel_motor' as FertigationMode, label: 'Diesel Motor', icon: 'hardware-chip-outline' },
                      { id: 'current_motor' as FertigationMode, label: 'Current Motor (Electric)', icon: 'flash-outline' },
                    ].map((m) => {
                      const isSel = fertMode === m.id;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          onPress={() => setFertMode(m.id)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            paddingHorizontal: 10,
                            paddingVertical: 7,
                            borderRadius: 8,
                            borderWidth: 1,
                            backgroundColor: isSel ? '#0D9488' : colors.card,
                            borderColor: isSel ? '#0D9488' : colors.border,
                          }}
                        >
                          <Ionicons name={m.icon as any} size={13} color={isSel ? '#FFFFFF' : colors.textMuted} />
                          <Text style={{ fontSize: 11, fontWeight: isSel ? '700' : '500', color: isSel ? '#FFFFFF' : colors.text }}>
                            {m.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Method of Application */}
                <View>
                  <Text style={[styles.label, { color: colors.text, marginBottom: 6 }]}>
                    {t('applicationMethod') || 'Application Method'} *
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      { id: 'drenching' as FertigationMethod, label: 'Soil Drenching' },
                      { id: 'spraying' as FertigationMethod, label: 'Canopy Spraying' },
                      { id: 'semi_spraying' as FertigationMethod, label: 'Semi-Spraying' },
                      { id: 'drip' as FertigationMethod, label: 'Drip / Venturi' },
                      ...customMethods.map((cm) => ({ id: cm as FertigationMethod, label: cm })),
                    ].map((m) => {
                      const isSel = fertMethod === m.id;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          onPress={() => setFertMethod(m.id)}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 8,
                            borderWidth: 1,
                            backgroundColor: isSel ? '#0D948820' : colors.card,
                            borderColor: isSel ? '#0D9488' : colors.border,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: isSel ? '700' : '500', color: isSel ? '#0D9488' : colors.text }}>
                            {m.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* (+) Add Custom Method Button */}
                    <TouchableOpacity
                      onPress={() => setShowAddMethodInput(!showAddMethodInput)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderStyle: 'dashed',
                        borderColor: '#0D9488',
                        backgroundColor: showAddMethodInput ? '#0D948815' : colors.card,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Ionicons name="add" size={14} color="#0D9488" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#0D9488' }}>
                        {t('addCustomMethod') || 'Add Method'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showAddMethodInput && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <TextInput
                        style={[
                          styles.input,
                          { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: '#0D9488', height: 40, marginBottom: 0 },
                        ]}
                        placeholder={t('enterCustomMethod') || 'Enter custom application method...'}
                        placeholderTextColor={colors.textMuted}
                        value={newMethodText}
                        onChangeText={setNewMethodText}
                      />
                      <TouchableOpacity
                        onPress={handleAddCustomMethod}
                        style={{
                          backgroundColor: '#0D9488',
                          paddingHorizontal: 14,
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
                </View>

                {/* Fuel Logging if Petrol or Diesel Motor */}
                {(fertMode === 'petrol_motor' || fertMode === 'diesel_motor') && (
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#F59E0B40',
                      padding: 10,
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="flame-outline" size={15} color="#D97706" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                          Motor Fuel Consumption
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setFertAutoLogFuel(!fertAutoLogFuel)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      >
                        <Ionicons
                          name={fertAutoLogFuel ? 'checkbox' : 'square-outline'}
                          size={16}
                          color={fertAutoLogFuel ? colors.primary : colors.textMuted}
                        />
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>Auto-log to Fuel Stock</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: colors.text, marginBottom: 2 }]}>
                          {fertMode === 'petrol_motor' ? 'Petrol Consumed (Litres)' : 'Diesel Consumed (Litres)'}
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, marginBottom: 0, height: 38 },
                          ]}
                          keyboardType="decimal-pad"
                          value={fertFuelLitres}
                          onChangeText={setFertFuelLitres}
                          placeholder="e.g. 3.5"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Notes */}
            <Text style={[styles.label, { color: colors.text, marginTop: 4 }]}>{t('notes')}</Text>
            <TextInput
              style={[
                styles.notesInput,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              placeholder="Field observations, weather, progress..."
              placeholderTextColor={colors.textMuted}
            />

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.btnText, { color: colors.textMuted }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.saveBtnText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '94%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    maxHeight: 520,
  },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#EF444420',
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
    marginBottom: 10,
  },
  col: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
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
    paddingVertical: 8,
    fontSize: 13,
  },
  taskTypeScroll: {
    gap: 6,
    paddingVertical: 4,
    marginBottom: 10,
  },
  taskTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  taskTypeChipText: {
    fontSize: 11,
  },
  sectionCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  addInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addInlineBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inlineAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  saveInlineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveInlineBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  activitiesGrid: {
    gap: 6,
    marginTop: 4,
  },
  activityOptionChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  activityOptionText: {
    fontSize: 12,
    lineHeight: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
