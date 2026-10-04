import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { ExpendableItem, FarmEquipment } from '../../types/equipment';
import { formatDate } from '../../utils/date';

interface LogConsumptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (entryData: {
    date: string;
    itemId: string;
    machineId: string;
    quantityConsumed: number;
    operatorName?: string;
    purpose?: string;
  }) => void;
  items: ExpendableItem[];
  equipmentList: FarmEquipment[];
  onAddNewEquipment?: (eq: FarmEquipment) => void;
  preselectedItemId?: string;
  orgId?: string;
}

export const LogConsumptionModal: React.FC<LogConsumptionModalProps> = ({
  visible,
  onClose,
  onSave,
  items,
  equipmentList,
  onAddNewEquipment,
  preselectedItemId,
  orgId = 'plantation_org_namari_adukidathan',
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [selectedItemId, setSelectedItemId] = useState(
    preselectedItemId || (items.length > 0 ? items[0].id : '')
  );
  const [selectedMachineId, setSelectedMachineId] = useState(
    equipmentList.length > 0 ? equipmentList[0].id : ''
  );
  const [date, setDate] = useState(formatDate());
  const [amountConsumed, setAmountConsumed] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState('');

  // Custom inline machine addition
  const [isAddingMachine, setIsAddingMachine] = useState(false);
  const [customMachineName, setCustomMachineName] = useState('');

  useEffect(() => {
    if (preselectedItemId) {
      setSelectedItemId(preselectedItemId);
    } else if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
    }
    if (equipmentList.length > 0 && !selectedMachineId) {
      setSelectedMachineId(equipmentList[0].id);
    }
  }, [preselectedItemId, items, equipmentList, visible]);

  const activeItem = items.find((i) => i.id === selectedItemId) || items[0];
  const currentStock = activeItem ? activeItem.currentStock : 0;
  const consumedNum = parseFloat(amountConsumed) || 0;
  const remainingStock = Math.max(0, currentStock - consumedNum);

  const handleSaveCustomMachine = () => {
    if (!customMachineName.trim()) return;
    const newEq: FarmEquipment = {
      id: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      orgId,
      name: customMachineName.trim(),
      assetId: `EQ-${Date.now().toString().slice(-4)}`,
      category: 'other',
      purchaseDate: formatDate(),
      expectedLifeYears: 5,
      status: 'operational',
      cumulativeFuelConsumed: 0,
      runningHoursEstimate: 0,
    };

    if (onAddNewEquipment) {
      onAddNewEquipment(newEq);
    }
    setSelectedMachineId(newEq.id);
    setCustomMachineName('');
    setIsAddingMachine(false);
  };

  const handleSubmit = () => {
    if (!selectedItemId) {
      setError('Please select an expendable item.');
      return;
    }
    if (consumedNum <= 0) {
      setError('Please enter a valid consumed quantity.');
      return;
    }
    if (consumedNum > currentStock) {
      setError(`Cannot consume more than available stock (${currentStock} ${activeItem?.unit || ''}).`);
      return;
    }

    onSave({
      date: date.trim() || formatDate(),
      itemId: selectedItemId,
      machineId: selectedMachineId,
      quantityConsumed: consumedNum,
      operatorName: operatorName.trim() || undefined,
      purpose: purpose.trim() || undefined,
    });

    setAmountConsumed('');
    setPurpose('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="flame" size={20} color="#DC2626" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t('logConsumption')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Deduct fuel, oil or materials used in farm machinery
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Select Item */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t('expendableItem')} *
              </Text>
              <View style={styles.chipsRow}>
                {items.map((it) => {
                  const isSelected = selectedItemId === it.id;
                  return (
                    <TouchableOpacity
                      key={it.id}
                      onPress={() => setSelectedItemId(it.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                          borderColor: isSelected ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                        {it.name} ({it.currentStock} {it.unit})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Select Machine / Equipment */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 0 }]}>
                  Machine / Equipment Consumed By *
                </Text>
                <TouchableOpacity
                  onPress={() => setIsAddingMachine(!isAddingMachine)}
                  style={[styles.inlineAddBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
                >
                  <Ionicons name={isAddingMachine ? 'close' : 'add'} size={12} color={colors.primary} />
                  <Text style={[styles.inlineAddBtnText, { color: colors.primary }]}>
                    {isAddingMachine ? 'Cancel' : '+ Add Machine'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Inline Custom Machine Entry */}
              {isAddingMachine && (
                <View style={[styles.inlineAddBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.primary }]}>
                  <TextInput
                    style={[styles.inlineInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Enter new equipment name (e.g. Honda Brush Cutter #2)..."
                    placeholderTextColor={colors.textMuted}
                    value={customMachineName}
                    onChangeText={setCustomMachineName}
                  />
                  <TouchableOpacity
                    onPress={handleSaveCustomMachine}
                    style={[styles.saveInlineBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.saveInlineBtnText}>Save & Select</Text>
                  </TouchableOpacity>
                </View>
              )}

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.machineRow}>
                {equipmentList.map((eq) => {
                  const isSelected = selectedMachineId === eq.id;
                  return (
                    <TouchableOpacity
                      key={eq.id}
                      onPress={() => setSelectedMachineId(eq.id)}
                      style={[
                        styles.machineChip,
                        {
                          backgroundColor: isSelected ? '#D97706' : colors.surfaceSubtle,
                          borderColor: isSelected ? '#D97706' : colors.cardBorder,
                        },
                      ]}
                    >
                      <Ionicons
                        name="hardware-chip-outline"
                        size={13}
                        color={isSelected ? '#FFFFFF' : colors.primary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.machineChipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                        {eq.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Consumption Amount & Live Remaining Stock Preview */}
            <View style={styles.stockCalculationRow}>
              <View style={{ flex: 1.1 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t('amountConsumed')} ({activeItem?.unit || 'Litres'}) *
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 10"
                  placeholderTextColor={colors.textMuted}
                  value={amountConsumed}
                  onChangeText={setAmountConsumed}
                />
              </View>

              {/* Live Remaining Stock Card */}
              <View style={[styles.remainingCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
                <Text style={[styles.remainingLabel, { color: colors.textMuted }]}>
                  {t('remainingStock')}
                </Text>
                <Text
                  style={[
                    styles.remainingValue,
                    { color: consumedNum > currentStock ? '#EF4444' : colors.primary },
                  ]}
                >
                  {remainingStock.toFixed(1)} {activeItem?.unit || ''}
                </Text>
                <Text style={[styles.remainingSub, { color: colors.textMuted }]}>
                  from {currentStock} {activeItem?.unit || ''}
                </Text>
              </View>
            </View>

            {/* Date & Operator in Row */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('date')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="21-Sep-2026"
                  placeholderTextColor={colors.textMuted}
                  value={date}
                  onChangeText={setDate}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Operator / Driver</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. Murugan"
                  placeholderTextColor={colors.textMuted}
                  value={operatorName}
                  onChangeText={setOperatorName}
                />
              </View>
            </View>

            {/* Purpose / Operational Task */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Purpose / Task Description</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Cardamom Dryer Blower night firing cycle #2"
                placeholderTextColor={colors.textMuted}
                value={purpose}
                onChangeText={setPurpose}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitBtn, { backgroundColor: '#DC2626' }]}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Deduct & Record Consumption</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  scrollArea: {
    maxHeight: 500,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  inlineAddBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inlineAddBox: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    flexDirection: 'row',
    gap: 6,
  },
  inlineInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 12,
  },
  saveInlineBtn: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderRadius: 6,
  },
  saveInlineBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  machineRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 4,
  },
  machineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  machineChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockCalculationRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  remainingCard: {
    flex: 0.9,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  remainingLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  remainingValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  remainingSub: {
    fontSize: 10,
    marginTop: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
