import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  FarmEquipment,
  EquipmentMuster,
  EquipmentMusterItem,
  MusterFrequency,
  EquipmentStatus,
} from '../../types/equipment';
import { formatDate } from '../../utils/date';
import { ThemedConfirmModal } from '../common/ThemedConfirmModal';

interface EquipmentMusterModalProps {
  visible: boolean;
  onClose: () => void;
  equipmentList: FarmEquipment[];
  onSaveMuster: (muster: EquipmentMuster) => void;
  orgId: string;
}

export const EquipmentMusterModal: React.FC<EquipmentMusterModalProps> = ({
  visible,
  onClose,
  equipmentList,
  onSaveMuster,
  orgId,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [frequency, setFrequency] = useState<MusterFrequency>('monthly');
  const [auditedBy, setAuditedBy] = useState('Estate Manager');
  const [auditDate, setAuditDate] = useState(formatDate());
  const [notes, setNotes] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  // Local state for each item's muster check
  const [musterItems, setMusterItems] = useState<Record<string, {
    isPresent: boolean;
    condition: EquipmentStatus;
    operator: string;
    remarks: string;
  }>>({});

  useEffect(() => {
    if (visible) {
      const initial: Record<string, { isPresent: boolean; condition: EquipmentStatus; operator: string; remarks: string }> = {};
      equipmentList.forEach((eq) => {
        initial[eq.id] = {
          isPresent: true,
          condition: eq.status || 'operational',
          operator: '',
          remarks: '',
        };
      });
      setMusterItems(initial);
      setAuditDate(formatDate());
    }
  }, [equipmentList, visible]);

  const handleTogglePresent = (eqId: string) => {
    setMusterItems((prev) => ({
      ...prev,
      [eqId]: {
        ...prev[eqId],
        isPresent: !prev[eqId]?.isPresent,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    setMusterItems((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], isPresent: true };
      });
      return next;
    });
  };

  const handleConditionChange = (eqId: string, cond: EquipmentStatus) => {
    setMusterItems((prev) => ({
      ...prev,
      [eqId]: {
        ...prev[eqId],
        condition: cond,
      },
    }));
  };

  const handleOperatorChange = (eqId: string, text: string) => {
    setMusterItems((prev) => ({
      ...prev,
      [eqId]: {
        ...prev[eqId],
        operator: text,
      },
    }));
  };

  // Live Counts
  const totalCount = equipmentList.length;
  const presentCount = equipmentList.filter((eq) => musterItems[eq.id]?.isPresent !== false).length;
  const missingCount = totalCount - presentCount;
  const serviceCount = equipmentList.filter((eq) => musterItems[eq.id]?.condition === 'needsService').length;
  const breakdownCount = equipmentList.filter((eq) => musterItems[eq.id]?.condition === 'breakdown').length;

  const handleSubmit = () => {
    if (equipmentList.length === 0) {
      Alert.alert('No Equipment Registered', 'Please register farm machinery in the Asset Registry first before conducting a muster audit.');
      return;
    }

    const items: EquipmentMusterItem[] = equipmentList.map((eq) => {
      const state = musterItems[eq.id] || { isPresent: true, condition: 'operational', operator: '', remarks: '' };
      return {
        equipmentId: eq.id,
        equipmentName: eq.name,
        isPresent: state.isPresent,
        condition: state.condition,
        operatorAssigned: state.operator,
        remarks: state.remarks,
      };
    });

    const operationalCount = items.filter((i) => i.condition === 'operational').length;
    const serviceNeededCount = items.filter((i) => i.condition === 'needsService').length;
    const missing = items.filter((i) => !i.isPresent).length;

    const muster: EquipmentMuster = {
      id: `muster_${Date.now()}`,
      orgId,
      auditDate: auditDate.trim() || formatDate(),
      frequency,
      auditedBy: auditedBy.trim() || 'Estate Manager',
      items,
      totalEquipmentCount: items.length,
      operationalCount,
      serviceNeededCount,
      missingCount: missing,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveMuster(muster);
    setSuccessInfo({
      visible: true,
      message: `Physical audit saved successfully!\n\n• Verified: ${presentCount}/${totalCount} Present\n• Needs Service: ${serviceNeededCount}\n• Missing: ${missing}`,
    });
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="clipboard-outline" size={22} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {t('accountabilityMuster')}
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    Physical audit of estate machinery & equipment accountability
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Live Verification Summary Header Bar */}
            <View style={[styles.liveSummaryBar, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              <View style={styles.summaryBadge}>
                <Text style={[styles.summaryNum, { color: '#059669' }]}>{presentCount}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Present</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryBadge}>
                <Text style={[styles.summaryNum, { color: '#D97706' }]}>{serviceCount}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Needs Service</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryBadge}>
                <Text style={[styles.summaryNum, { color: '#DC2626' }]}>{missingCount}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Missing</Text>
              </View>
            </View>

            {/* Scrollable Form Content */}
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={true}>
              {/* Frequency Selector: Monthly, Quarterly, Yearly */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Audit Frequency</Text>
                <View style={styles.freqRow}>
                  {(['monthly', 'quarterly', 'yearly'] as MusterFrequency[]).map((f) => {
                    const isSelected = frequency === f;
                    return (
                      <TouchableOpacity
                        key={f}
                        onPress={() => setFrequency(f)}
                        style={[
                          styles.freqChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                            borderColor: isSelected ? colors.primary : colors.cardBorder,
                          },
                        ]}
                      >
                        <Text style={[styles.freqChipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                          {t(f as any) || f.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

            {/* Auditor & Date Fields */}
            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Audit Date</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={auditDate}
                  onChangeText={setAuditDate}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Audited By</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={auditedBy}
                  onChangeText={setAuditedBy}
                />
              </View>
            </View>

            {/* Checklist Header with Quick Action */}
            <View style={styles.checklistTitleRow}>
              <Text style={[styles.sectionLabel, { color: colors.text, marginBottom: 0 }]}>
                Tool & Machine Checklist ({equipmentList.length} items)
              </Text>
              <TouchableOpacity onPress={handleMarkAllPresent} style={styles.markAllBtn}>
                <Ionicons name="checkmark-done" size={13} color={colors.primary} />
                <Text style={[styles.markAllText, { color: colors.primary }]}>Mark All Present</Text>
              </TouchableOpacity>
            </View>

            {/* Checklist of Equipment */}
            <View style={styles.checklist}>
              {equipmentList.length === 0 ? (
                <View style={[styles.emptyBox, { borderColor: colors.cardBorder }]}>
                  <Ionicons name="alert-circle-outline" size={32} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No machinery registered in Asset Registry yet.
                  </Text>
                </View>
              ) : (
                equipmentList.map((eq) => {
                  const state = musterItems[eq.id] || { isPresent: true, condition: 'operational', operator: '', remarks: '' };

                  return (
                    <View
                      key={eq.id}
                      style={[
                        styles.checkRow,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: !state.isPresent ? '#EF4444' : colors.cardBorder,
                        },
                      ]}
                    >
                      {/* Top: Name & Presence Toggle */}
                      <View style={styles.checkHeader}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={[styles.eqName, { color: colors.text }]} numberOfLines={1}>
                            {eq.name}
                          </Text>
                          <Text style={[styles.eqAsset, { color: colors.textMuted }]}>
                            {eq.assetId} • {eq.makeModel || 'Machinery'}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleTogglePresent(eq.id)}
                          style={[
                            styles.presentToggle,
                            {
                              backgroundColor: state.isPresent ? '#DCFCE7' : '#FEE2E2',
                              borderColor: state.isPresent ? '#10B981' : '#EF4444',
                            },
                          ]}
                        >
                          <Ionicons
                            name={state.isPresent ? 'checkmark-circle' : 'close-circle'}
                            size={16}
                            color={state.isPresent ? '#15803D' : '#DC2626'}
                          />
                          <Text
                            style={[
                              styles.presentText,
                              { color: state.isPresent ? '#15803D' : '#DC2626' },
                            ]}
                          >
                            {state.isPresent ? 'Present' : 'Missing'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Condition Pills */}
                      <View style={styles.conditionRow}>
                        {(['operational', 'needsService', 'breakdown'] as EquipmentStatus[]).map((cond) => {
                          const isSelected = state.condition === cond;
                          return (
                            <TouchableOpacity
                              key={cond}
                              onPress={() => handleConditionChange(eq.id, cond)}
                              style={[
                                styles.condChip,
                                {
                                  backgroundColor: isSelected
                                    ? cond === 'operational'
                                      ? '#10B981'
                                      : cond === 'needsService'
                                      ? '#F59E0B'
                                      : '#EF4444'
                                    : colors.card,
                                  borderColor: isSelected ? 'transparent' : colors.cardBorder,
                                },
                              ]}
                            >
                              <Text style={[styles.condChipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                                {t(cond as any) || cond}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Operator input */}
                      <TextInput
                        style={[
                          styles.subInput,
                          { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                        ]}
                        placeholder="Operator name / storage location (e.g. Murugan / Dryer Shed)"
                        placeholderTextColor={colors.textMuted}
                        value={state.operator}
                        onChangeText={(t) => handleOperatorChange(eq.id, t)}
                      />
                    </View>
                  );
                })
              )}
            </View>

            {/* Notes */}
            <View style={[styles.section, { marginTop: 12 }]}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Overall Audit Remarks</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Physical shed condition, missing tool action plan, or repair notes..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Fixed Bottom Footer - Always Visible and Tappable! */}
          <View style={[styles.footer, { borderTopColor: colors.cardBorder }]}>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.saveBtn, { backgroundColor: '#059669' }]}
            >
              <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Accountability Muster</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    {/* Themed Success Confirmation Dialog */}
    <ThemedConfirmModal
      visible={successInfo.visible}
      type="success"
      title="Muster Audit Recorded"
      message={successInfo.message}
      confirmText="Done"
      isSingleButton
      onConfirm={() => {
        setSuccessInfo({ visible: false, message: '' });
        onClose();
      }}
    />
  </>
);
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 10,
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
  closeBtn: {
    padding: 4,
  },
  liveSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  summaryBadge: {
    alignItems: 'center',
  },
  summaryNum: {
    fontSize: 15,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#9CA3AF40',
  },
  scrollArea: {
    flexShrink: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freqChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  freqChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  input: {
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  checklistTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
  },
  checklist: {
    gap: 8,
  },
  checkRow: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  checkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eqName: {
    fontSize: 13,
    fontWeight: '700',
  },
  eqAsset: {
    fontSize: 10,
    marginTop: 1,
  },
  presentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  presentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  condChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  condChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subInput: {
    height: 34,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 11,
  },
  textArea: {
    height: 54,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
  },
});
