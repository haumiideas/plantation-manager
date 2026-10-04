import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { HarvestEntry } from '../../types/harvest';
import { FARM_OPTIONS } from '../../types/farm';
import { ThemedConfirmModal } from '../common/ThemedConfirmModal';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedGroupName, getLocalizedBlockName } from '../../utils/localizationUtils';
import { FULL_MONTH_NAMES, parseEstateDate } from '../../utils/date';

interface DailyHarvestListProps {
  entries: HarvestEntry[];
  onEditEntry: (entry: HarvestEntry) => void;
  onDeleteEntry: (id: string) => void;
  onOpenLogModal: () => void;
  cropName?: string;
}

export const DailyHarvestList: React.FC<DailyHarvestListProps> = ({
  entries,
  onEditEntry,
  onDeleteEntry,
  onOpenLogModal,
  cropName = 'Crop',
}) => {
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'delete' | 'warning' | 'info';
    confirmText?: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'confirm',
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const confirmDelete = (entry: HarvestEntry) => {
    if (entry.isFlushLocked) {
      setModalConfig({
        visible: true,
        title: 'Entry Locked',
        message: `This harvest record belongs to ${entry.flushNumber || 'a completed flush'}, which has been locked. Unlock the flush in the banner above to make changes.`,
        type: 'warning',
        confirmText: 'OK',
        onConfirm: () => setModalConfig((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    setModalConfig({
      visible: true,
      title: 'Delete Harvest Entry',
      message: `Are you sure you want to delete the ${(entry.freshWeightNetKg || entry.totalWeightKg).toFixed(1)} kg record for ${entry.blockName} (${entry.date})?`,
      type: 'delete',
      confirmText: 'Delete',
      onConfirm: () => {
        setModalConfig((prev) => ({ ...prev, visible: false }));
        onDeleteEntry(entry.id);
      },
    });
  };

  const handleEdit = (entry: HarvestEntry) => {
    if (entry.isFlushLocked) {
      setModalConfig({
        visible: true,
        title: 'Entry Locked',
        message: `This harvest record belongs to ${entry.flushNumber || 'a completed flush'}, which has been locked. Unlock the flush in the banner above to edit.`,
        type: 'warning',
        confirmText: 'OK',
        onConfirm: () => setModalConfig((prev) => ({ ...prev, visible: false })),
      });
      return;
    }
    onEditEntry(entry);
  };

  // Group harvest entries by Month & Year
  const groupedHarvest = useMemo(() => {
    const map: Record<string, { monthYear: string; totalKg: number; entries: HarvestEntry[] }> = {};
    const order: string[] = [];

    entries.forEach((entry) => {
      const d = parseEstateDate(entry.date) || new Date();
      const my = `${FULL_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      if (!map[my]) {
        map[my] = { monthYear: my, totalKg: 0, entries: [] };
        order.push(my);
      }
      map[my].entries.push(entry);
      map[my].totalKg += (entry.freshWeightNetKg || entry.totalWeightKg || 0);
    });

    return order.map((key) => map[key]);
  }, [entries]);

  if (entries.length === 0) {
    return (
      <View
        style={[
          styles.emptyCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <Ionicons name="basket-outline" size={40} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No {cropName} Harvest Logged Yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          Record green picking weights with gross/net sack tare, worker contractor teams, and storage bags.
        </Text>
        <TouchableOpacity
          onPress={onOpenLogModal}
          style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add-circle" size={18} color="#FFFFFF" />
          <Text style={styles.emptyBtnText}>Log {cropName} Pick</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {groupedHarvest.map((group) => (
        <View key={group.monthYear} style={{ marginBottom: 16 }}>
          {/* Month Header Banner */}
          <View
            style={[
              styles.monthHeaderRow,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="calendar" size={14} color={colors.primary} />
              <Text style={[styles.monthHeaderText, { color: colors.text }]}>
                {group.monthYear}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <View style={[styles.countPill, { backgroundColor: colors.card }]}>
                <Text style={[styles.countPillText, { color: colors.textMuted }]}>
                  {group.entries.length} picks
                </Text>
              </View>
              <Text style={[styles.monthTotalKg, { color: colors.primary }]}>
                {group.totalKg.toFixed(1)} kg
              </Text>
            </View>
          </View>

          <View style={{ gap: 12 }}>
            {group.entries.map((entry) => {
        const farmMeta = FARM_OPTIONS.find((f) => f.id === entry.farmId);
        const isExpanded = expandedId === entry.id;
        const hasPickerBreakdown =
          entry.pickerEntries && entry.pickerEntries.length > 0;
        const netKg = entry.freshWeightNetKg || entry.totalWeightKg;
        const grossKg = entry.freshWeightGrossKg || netKg;
        const isLocked = !!entry.isFlushLocked;

        return (
          <View
            key={entry.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: isLocked
                  ? isDark
                    ? '#B45309'
                    : '#FCD34D'
                  : colors.cardBorder,
              },
            ]}
          >
            {/* Top Meta Row */}
            <View style={styles.topRow}>
              <View style={styles.badgesRow}>
                {farmMeta && (
                  <View
                    style={[
                      styles.farmBadge,
                      {
                        backgroundColor:
                          entry.farmId === 'namari'
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.farmBadgeText,
                        {
                          color:
                            entry.farmId === 'namari'
                              ? isDark
                                ? colors.primaryLight
                                : colors.primary
                              : '#3B82F6',
                        },
                      ]}
                    >
                      {farmMeta.shortCode}
                    </Text>
                  </View>
                )}

                {entry.flushNumber && (
                  <View
                    style={[
                      styles.flushBadge,
                      {
                        backgroundColor: isLocked
                          ? '#F59E0B25'
                          : 'rgba(34, 197, 94, 0.12)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={isLocked ? 'lock-closed' : 'leaf-outline'}
                      size={11}
                      color={isLocked ? '#D97706' : colors.primary}
                    />
                    <Text
                      style={[
                        styles.flushBadgeText,
                        { color: isLocked ? '#D97706' : colors.primary },
                      ]}
                    >
                      {entry.flushNumber} {isLocked ? '(Locked)' : ''}
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.workerCountBadge,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="people-outline" size={12} color={colors.textMuted} />
                  <Text style={[styles.workerCountText, { color: colors.textMuted }]}>
                    {entry.workerCount || 0} pickers
                  </Text>
                </View>
              </View>

              {/* Action Icons: Edit & Delete */}
              <View style={styles.actionsCluster}>
                {isLocked ? (
                  <View style={styles.lockedPill}>
                    <Ionicons name="lock-closed" size={13} color="#D97706" />
                    <Text style={styles.lockedPillText}>Locked</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => handleEdit(entry)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.actionIconBtn}
                    >
                      <Ionicons name="pencil-outline" size={17} color={colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => confirmDelete(entry)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.actionIconBtn}
                    >
                      <Ionicons name="trash-outline" size={17} color="#EF4444" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {/* Main Info Row: Day & Date + Net Weight */}
            <View style={styles.mainRow}>
              <View style={styles.infoCol}>
                <Text style={[styles.blockName, { color: colors.text }]}>
                  {getLocalizedBlockName(entry.blockName, language)}
                </Text>
                <Text style={[styles.dateText, { color: colors.textMuted }]}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>
                    {entry.dayOfWeek ? `${entry.dayOfWeek}, ` : ''}
                  </Text>
                  {entry.date} • {entry.cropName}
                </Text>
              </View>

              {/* Weight: Net without sack in large font */}
              <View style={styles.weightCol}>
                <View style={styles.weightNumRow}>
                  <Text style={[styles.weightValue, { color: colors.text }]}>
                    {netKg.toFixed(1)}
                  </Text>
                  <Text
                    style={[
                      styles.weightUnit,
                      { color: isDark ? colors.primaryLight : colors.primary },
                    ]}
                  >
                    kg Net
                  </Text>
                </View>
                {grossKg !== netKg && (
                  <Text style={[styles.grossText, { color: colors.textMuted }]}>
                    Gross: {grossKg.toFixed(1)} kg ({entry.freshSacksCount || 0} sacks)
                  </Text>
                )}
              </View>
            </View>

            {/* SACK TARE & DRY PRODUCE PACKAGING STRIP */}
            <View style={[styles.metaStrip, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.metaStripItem}>
                <Ionicons name="cube-outline" size={13} color={colors.textMuted} />
                <Text style={[styles.metaStripText, { color: colors.textMuted }]}>
                  Fresh Sacks: <Text style={{ fontWeight: '700', color: colors.text }}>{entry.freshSacksCount || 0}</Text> (Tare {entry.sackTareWeightKg || 1}kg/ea)
                </Text>
              </View>

              {entry.dryWeightNetKg ? (
                <View style={styles.metaStripItem}>
                  <Ionicons name="sparkles" size={13} color="#D97706" />
                  <Text style={[styles.metaStripText, { color: colors.textMuted }]}>
                    Dry: <Text style={{ fontWeight: '800', color: '#D97706' }}>{entry.dryWeightNetKg.toFixed(1)}kg</Text>{' '}
                    {entry.freshToDryRatio ? `(${entry.freshToDryRatio}:1)` : ''} •{' '}
                    <Text style={{ fontWeight: '700', color: colors.text }}>
                      {entry.dryStorageSacksCount || 0} sacks / {entry.dryStoragePlasticBagsCount || 0} plastic bags
                    </Text>
                  </Text>
                </View>
              ) : null}
            </View>

            {/* LABOR CONTRACTOR GROUPS (Per-person productivity) */}
            {entry.laborGroups && entry.laborGroups.length > 0 && (
              <View style={styles.laborGroupsSection}>
                <Text style={[styles.laborSectionTitle, { color: colors.textMuted }]}>
                  Labor Groups Picked (kg / person / day):
                </Text>
                <View style={styles.laborChipsRow}>
                  {entry.laborGroups.map((group) => {
                    let groupColor = colors.primary;
                    const nameLower = (group.groupName || '').toLowerCase();
                    if (group.groupType === 'boopathi' || nameLower.includes('boopathi')) groupColor = '#3B82F6';
                    else if (group.groupType === 'thangamani' || nameLower.includes('thangamani')) groupColor = '#D97706';

                    return (
                      <View
                        key={group.id}
                        style={[
                          styles.laborGroupChip,
                          {
                            backgroundColor: colors.background,
                            borderColor: groupColor,
                          },
                        ]}
                      >
                        <Text style={[styles.groupNameText, { color: groupColor }]}>
                          {getLocalizedGroupName(group.groupName, language)}:
                        </Text>
                        <Text style={[styles.groupOutputText, { color: colors.text }]}>
                          {group.totalWeightKg.toFixed(1)}kg ({group.workerCount}p)
                        </Text>
                        <View style={[styles.perPersonPill, { backgroundColor: groupColor + '20' }]}>
                          <Text style={[styles.perPersonText, { color: groupColor }]}>
                            {group.kgPerPersonPerDay.toFixed(1)} kg/p
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Quality Notes */}
            {entry.qualityNotes && (
              <View
                style={[
                  styles.notesBox,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.notesText, { color: colors.textMuted }]}>
                  {entry.qualityNotes}
                </Text>
              </View>
            )}

            {/* Individual Picker Breakdown Toggle (If recorded) */}
            {hasPickerBreakdown && (
              <View style={styles.breakdownSection}>
                <TouchableOpacity
                  onPress={() => toggleExpand(entry.id)}
                  style={[styles.breakdownToggle, { borderColor: colors.border }]}
                >
                  <Text style={[styles.toggleText, { color: colors.primary }]}>
                    {isExpanded ? 'Hide' : 'View'} Individual Picker Records ({entry.pickerEntries!.length})
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.pickerTable, { backgroundColor: colors.background }]}>
                    <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.thName, { color: colors.textMuted }]}>Picker Name</Text>
                      <Text style={[styles.thWeight, { color: colors.textMuted }]}>Weight (kg)</Text>
                    </View>
                    {entry.pickerEntries!.map((p, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.tableRow,
                          {
                            borderBottomColor:
                              idx === entry.pickerEntries!.length - 1
                                ? 'transparent'
                                : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.tdName, { color: colors.text }]}>{p.workerName}</Text>
                        <Text style={[styles.tdWeight, { color: colors.text }]}>
                          {p.weightKg.toFixed(1)} kg
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
          </View>
        </View>
      ))}

      <ThemedConfirmModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 12,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  monthHeaderText: {
    fontSize: 14,
    fontWeight: '800',
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  monthTotalKg: {
    fontSize: 13,
    fontWeight: '800',
  },
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  farmBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  farmBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  flushBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  flushBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  workerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  workerCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconBtn: {
    padding: 2,
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F59E0B20',
  },
  lockedPillText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  infoCol: {
    flex: 1,
  },
  blockName: {
    fontSize: 16,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
  },
  weightCol: {
    alignItems: 'flex-end',
  },
  weightNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  weightValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  weightUnit: {
    fontSize: 13,
    fontWeight: '700',
  },
  grossText: {
    fontSize: 10,
    marginTop: 1,
  },
  metaStrip: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  metaStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaStripText: {
    fontSize: 11,
  },
  laborGroupsSection: {
    gap: 6,
    marginTop: 2,
  },
  laborSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  laborChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  laborGroupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  groupNameText: {
    fontSize: 11,
    fontWeight: '700',
  },
  groupOutputText: {
    fontSize: 11,
    fontWeight: '600',
  },
  perPersonPill: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  perPersonText: {
    fontSize: 10,
    fontWeight: '800',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  notesText: {
    fontSize: 12,
    flex: 1,
  },
  breakdownSection: {
    marginTop: 4,
  },
  breakdownToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pickerTable: {
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  thName: {
    flex: 2,
    fontSize: 11,
    fontWeight: '700',
  },
  thWeight: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  thBonus: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tdName: {
    flex: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  tdWeight: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  tdBonus: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
