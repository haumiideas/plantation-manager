import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { FarmEquipment, EquipmentCategory, EquipmentStatus, EquipmentMuster } from '../../types/equipment';
import { analyzeEquipmentLife } from '../../services/equipmentService';
import { formatDate } from '../../utils/date';
import { ThemedConfirmModal } from '../common/ThemedConfirmModal';

interface EquipmentRegistryCardProps {
  equipmentList: FarmEquipment[];
  onAddEquipment: (equipment: FarmEquipment) => void;
  onEditEquipment?: (equipment: FarmEquipment) => void;
  onDeleteEquipment?: (equipmentId: string) => void;
  onOpenMusterModal: () => void;
  onQuickLogFuel?: (machineId: string) => void;
  recentMusters?: EquipmentMuster[];
  orgId: string;
}

const CATEGORIES: { id: EquipmentCategory; label: string; icon: string }[] = [
  { id: 'generator', label: 'Generator', icon: 'power' },
  { id: 'dryerBlower', label: 'Dryer Blower', icon: 'flame' },
  { id: 'brushCutter', label: 'Brush Cutter / Weeder', icon: 'cut' },
  { id: 'sprayer', label: 'Power Sprayer', icon: 'flask' },
  { id: 'pump', label: 'Water Pump', icon: 'water' },
  { id: 'tractor', label: 'Tractor / Tiller', icon: 'car' },
  { id: 'chainsaw', label: 'Chainsaw', icon: 'build' },
  { id: 'other', label: 'Other Tool', icon: 'construct' },
];

export const EquipmentRegistryCard: React.FC<EquipmentRegistryCardProps> = ({
  equipmentList,
  onAddEquipment,
  onEditEquipment,
  onDeleteEquipment,
  onOpenMusterModal,
  onQuickLogFuel,
  recentMusters = [],
  orgId,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  // State
  const [showTooltipModal, setShowTooltipModal] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);

  // Themed Dialog states
  const [deleteTarget, setDeleteTarget] = useState<FarmEquipment | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [assetId, setAssetId] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('generator');
  const [makeModel, setMakeModel] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(formatDate());
  const [purchaseCost, setPurchaseCost] = useState('');
  const [expectedLife, setExpectedLife] = useState('8');
  const [status, setStatus] = useState<EquipmentStatus>('operational');
  const [notes, setNotes] = useState('');

  // Filter list
  const filteredList = equipmentList.filter((eq) => {
    if (selectedCategoryFilter === 'all') return true;
    return eq.category === selectedCategoryFilter;
  });

  const handleOpenAdd = () => {
    setEditingEquipmentId(null);
    setName('');
    setAssetId(`EQ-${Date.now().toString().slice(-4)}`);
    setCategory('generator');
    setMakeModel('');
    setPurchaseDate(formatDate());
    setPurchaseCost('');
    setExpectedLife('8');
    setStatus('operational');
    setNotes('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (eq: FarmEquipment) => {
    setEditingEquipmentId(eq.id);
    setName(eq.name);
    setAssetId(eq.assetId);
    setCategory(eq.category);
    setMakeModel(eq.makeModel || '');
    setPurchaseDate(eq.purchaseDate);
    setPurchaseCost(eq.purchaseCost ? String(eq.purchaseCost) : '');
    setExpectedLife(String(eq.expectedLifeYears || 5));
    setStatus(eq.status || 'operational');
    setNotes(eq.notes || '');
    setShowFormModal(true);
  };

  const handleSaveEquipment = () => {
    if (!name.trim()) {
      setValidationError('Please enter an equipment or machine name.');
      return;
    }

    if (editingEquipmentId) {
      const existing = equipmentList.find((e) => e.id === editingEquipmentId);
      const updated: FarmEquipment = {
        ...(existing || {}),
        id: editingEquipmentId,
        orgId,
        name: name.trim(),
        assetId: assetId.trim() || `EQ-${Date.now().toString().slice(-4)}`,
        category,
        makeModel: makeModel.trim() || undefined,
        purchaseDate: purchaseDate.trim() || formatDate(),
        purchaseCost: parseFloat(purchaseCost) || 0,
        expectedLifeYears: parseFloat(expectedLife) || 5,
        status,
        cumulativeFuelConsumed: existing?.cumulativeFuelConsumed || 0,
        runningHoursEstimate: existing?.runningHoursEstimate || 0,
        notes: notes.trim() || undefined,
      };

      if (onEditEquipment) {
        onEditEquipment(updated);
      } else {
        onAddEquipment(updated);
      }
    } else {
      const newEq: FarmEquipment = {
        id: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        orgId,
        name: name.trim(),
        assetId: assetId.trim() || `EQ-${Date.now().toString().slice(-4)}`,
        category,
        makeModel: makeModel.trim() || undefined,
        purchaseDate: purchaseDate.trim() || formatDate(),
        purchaseCost: parseFloat(purchaseCost) || 0,
        expectedLifeYears: parseFloat(expectedLife) || 5,
        status,
        cumulativeFuelConsumed: 0,
        runningHoursEstimate: 0,
        notes: notes.trim() || undefined,
      };
      onAddEquipment(newEq);
    }

    setShowFormModal(false);
  };

  return (
    <View style={styles.outerContainer}>
      {/* 1. Header Card with Title & Clean Tooltip Trigger */}
      <View style={[styles.mainHeaderCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.headerTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={[styles.mainIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="hardware-chip" size={24} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mainTitle, { color: colors.text }]}>
                {t('equipmentRegistry')}
              </Text>
              <Text style={[styles.mainSubtitle, { color: colors.textMuted }]}>
                {t('assetLifeSubtitle')}
              </Text>
            </View>
          </View>

          {/* Sleek Tooltip Button (Doesn't occupy screen) */}
          <TouchableOpacity
            onPress={() => setShowTooltipModal(true)}
            style={[styles.tooltipTriggerBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
            accessibilityLabel="Why track equipment?"
          >
            <Ionicons name="information-circle" size={16} color="#7C3AED" />
            <Text style={[styles.tooltipTriggerText, { color: '#7C3AED' }]}>{t('whyTrack')}</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Prominent Action Buttons */}
        <View style={styles.primaryActionRow}>
          <TouchableOpacity
            onPress={handleOpenAdd}
            style={[styles.primaryActionBtn, { backgroundColor: '#7C3AED' }]}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionBtnText}>{t('registerEquipment')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onOpenMusterModal}
            style={[styles.primaryActionBtn, { backgroundColor: '#059669' }]}
          >
            <Ionicons name="clipboard-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionBtnText}>📋 {t('musterAudit')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Category Filter Scroll */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            onPress={() => setSelectedCategoryFilter('all')}
            style={[
              styles.filterPill,
              {
                backgroundColor: selectedCategoryFilter === 'all' ? colors.primary : colors.card,
                borderColor: selectedCategoryFilter === 'all' ? colors.primary : colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.filterPillText, { color: selectedCategoryFilter === 'all' ? '#FFFFFF' : colors.text }]}>
              {t('allMachinery')} ({equipmentList.length})
            </Text>
          </TouchableOpacity>

          {CATEGORIES.map((c) => {
            const count = equipmentList.filter((eq) => eq.category === c.id).length;
            if (count === 0 && selectedCategoryFilter !== c.id) return null;
            const isSelected = selectedCategoryFilter === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedCategoryFilter(c.id)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name={c.icon as any}
                  size={13}
                  color={isSelected ? '#FFFFFF' : colors.textMuted}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.filterPillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                  {c.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Equipment Cards List */}
      <View style={styles.cardsList}>
        {filteredList.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="hardware-chip-outline" size={38} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Machinery Found</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Tap "+ Register Equipment" to add your generators, blowers, sprayers, and brush cutters.
            </Text>
            <TouchableOpacity
              onPress={handleOpenAdd}
              style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.emptyAddBtnText}>Add Farm Equipment Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredList.map((eq) => {
            const analysis = analyzeEquipmentLife(eq);
            const cat = CATEGORIES.find((c) => c.id === eq.category) || CATEGORIES[0];

            return (
              <View
                key={eq.id}
                style={[
                  styles.equipmentCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: analysis.isOverUsage ? '#F59E0B' : colors.cardBorder,
                  },
                ]}
              >
                {/* Header: Icon, Name, Tag & Status Badge */}
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <View style={[styles.catIconBox, { backgroundColor: colors.surfaceSubtle }]}>
                      <Ionicons name={cat.icon as any} size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                        {eq.name}
                      </Text>
                      <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                        {eq.assetId} • {eq.makeModel || cat.label}
                      </Text>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          eq.status === 'operational'
                            ? '#DCFCE7'
                            : eq.status === 'needsService'
                            ? '#FEF3C7'
                            : '#FEE2E2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            eq.status === 'operational'
                              ? '#15803D'
                              : eq.status === 'needsService'
                              ? '#B45309'
                              : '#DC2626',
                        },
                      ]}
                    >
                      {t(eq.status as any) || eq.status}
                    </Text>
                  </View>
                </View>

                {/* 3 Metric Columns: Purchase Cost, Age vs Life, Fuel Burn */}
                <View style={[styles.metricsGrid, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{t('purchase')}</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]}>{eq.purchaseDate}</Text>
                    {eq.purchaseCost ? (
                      <Text style={[styles.metricSub, { color: colors.textMuted }]}>
                        ₹{eq.purchaseCost.toLocaleString('en-IN')}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{t('serviceAge')}</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]}>
                      {analysis.ageYears} {t('years')}
                    </Text>
                    <Text style={[styles.metricSub, { color: colors.textMuted }]}>
                      {t('ofExpectedYears')} {eq.expectedLifeYears}y
                    </Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{t('fuelBurn')}</Text>
                    <Text style={[styles.metricValue, { color: '#D97706' }]}>
                      {eq.cumulativeFuelConsumed || 0} L
                    </Text>
                    <Text style={[styles.metricSub, { color: colors.textMuted }]}>
                      {t('cumulative')}
                    </Text>
                  </View>
                </View>

                {/* Over-Usage Warning Banner */}
                {analysis.overUsageWarning && (
                  <View
                    style={[
                      styles.warningBanner,
                      {
                        backgroundColor: isDark ? '#3E2404' : '#FEF3C7',
                        borderColor: '#F59E0B',
                      },
                    ]}
                  >
                    <Ionicons name="warning-outline" size={15} color="#D97706" />
                    <Text style={[styles.warningBannerText, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                      {analysis.overUsageWarning}
                    </Text>
                  </View>
                )}

                {/* Notes if available */}
                {eq.notes ? (
                  <Text style={[styles.notesText, { color: colors.textMuted }]}>
                    ℹ️ {eq.notes}
                  </Text>
                ) : null}

                {/* Interactive Action Buttons Row */}
                <View style={[styles.cardActionsRow, { borderTopColor: colors.cardBorder }]}>
                  <TouchableOpacity
                    onPress={() => handleOpenEdit(eq)}
                    style={[styles.actionBtn, { borderColor: colors.cardBorder }]}
                  >
                    <Ionicons name="pencil" size={13} color={colors.primary} />
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                      {t('editEquipment') || 'Edit'}
                    </Text>
                  </TouchableOpacity>

                  {onQuickLogFuel && (
                    <TouchableOpacity
                      onPress={() => onQuickLogFuel(eq.id)}
                      style={[styles.actionBtn, { borderColor: colors.cardBorder }]}
                    >
                      <Ionicons name="flame" size={13} color="#D97706" />
                      <Text style={[styles.actionBtnText, { color: '#D97706' }]}>
                        {t('quickLogFuel') || 'Log Fuel'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {onDeleteEquipment && (
                    <TouchableOpacity
                      onPress={() => setDeleteTarget(eq)}
                      style={[styles.actionBtn, { borderColor: colors.cardBorder }]}
                    >
                      <Ionicons name="trash-outline" size={13} color="#DC2626" />
                      <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>
                        {t('deleteEquipment') || 'Delete'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* 5. Accountability Muster Audits History Section */}
      <View style={[styles.musterHistoryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.musterHistoryHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="clipboard" size={18} color="#059669" />
            <Text style={[styles.musterHistoryTitle, { color: colors.text }]}>
              {t('pastMusterAudits') || 'Past Muster Audits'} ({recentMusters.length})
            </Text>
          </View>
          <TouchableOpacity
            onPress={onOpenMusterModal}
            style={[styles.miniMusterBtn, { backgroundColor: '#059669' }]}
          >
            <Ionicons name="add" size={12} color="#FFFFFF" />
            <Text style={styles.miniMusterBtnText}>New Audit</Text>
          </TouchableOpacity>
        </View>

        {recentMusters.length === 0 ? (
          <View style={styles.noMusterBox}>
            <Text style={[styles.noMusterText, { color: colors.textMuted }]}>
              {t('noMustersYet') || 'No physical audits recorded yet.'}
            </Text>
            <Text style={[styles.noMusterSub, { color: colors.textMuted }]}>
              Tap "📋 Run Muster Audit" above to verify all tools across estate sheds.
            </Text>
          </View>
        ) : (
          recentMusters.slice(0, 5).map((m) => (
            <View key={m.id} style={[styles.musterRow, { borderTopColor: colors.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.musterDate, { color: colors.text }]}>{m.auditDate}</Text>
                  <View style={[styles.freqPill, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[styles.freqPillText, { color: colors.primary }]}>{m.frequency}</Text>
                  </View>
                </View>
                <Text style={[styles.musterAuditor, { color: colors.textMuted }]}>
                  By {m.auditedBy} • {m.totalEquipmentCount} machinery audited
                </Text>
                {m.notes ? (
                  <Text style={[styles.musterNotes, { color: colors.textMuted }]} numberOfLines={1}>
                    "{m.notes}"
                  </Text>
                ) : null}
              </View>

              <View style={styles.musterCountsCol}>
                <View style={styles.countBadgeRow}>
                  <Text style={{ fontSize: 11, color: '#059669', fontWeight: '700' }}>
                    ● {m.operationalCount} OK
                  </Text>
                  {m.serviceNeededCount > 0 && (
                    <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '700' }}>
                      ● {m.serviceNeededCount} Svc
                    </Text>
                  )}
                  {m.missingCount > 0 && (
                    <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '800' }}>
                      ● {m.missingCount} Missing
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* 6. Unified Add / Edit Equipment Modal */}
      <Modal visible={showFormModal} transparent animationType="slide" onRequestClose={() => setShowFormModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingEquipmentId ? 'Edit Farm Equipment' : 'Register Farm Equipment'}
              </Text>
              <TouchableOpacity onPress={() => setShowFormModal(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={true}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Equipment / Machine Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. Kirloskar 10 kVA Generator"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Asset Tag / Serial ID</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. EQ-GEN-01"
                  placeholderTextColor={colors.textMuted}
                  value={assetId}
                  onChangeText={setAssetId}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                  {CATEGORIES.map((c) => {
                    const isSelected = category === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setCategory(c.id)}
                        style={[
                          styles.catPill,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                            borderColor: isSelected ? colors.primary : colors.cardBorder,
                          },
                        ]}
                      >
                        <Ionicons
                          name={c.icon as any}
                          size={12}
                          color={isSelected ? '#FFFFFF' : colors.textMuted}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.catPillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Make & Model</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. Stihl FS 120 2-Stroke"
                  placeholderTextColor={colors.textMuted}
                  value={makeModel}
                  onChangeText={setMakeModel}
                />
              </View>

              <View style={styles.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Purchase Date</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="DD-MMM-YYYY"
                    placeholderTextColor={colors.textMuted}
                    value={purchaseDate}
                    onChangeText={setPurchaseDate}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Purchase Price (₹)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 45000"
                    placeholderTextColor={colors.textMuted}
                    value={purchaseCost}
                    onChangeText={setPurchaseCost}
                  />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Expected Life (Years)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 8"
                    placeholderTextColor={colors.textMuted}
                    value={expectedLife}
                    onChangeText={setExpectedLife}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Operational Status</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {(['operational', 'needsService', 'breakdown'] as EquipmentStatus[]).map((st) => (
                      <TouchableOpacity
                        key={st}
                        onPress={() => setStatus(st)}
                        style={[
                          styles.statusTogglePill,
                          {
                            backgroundColor: status === st
                              ? st === 'operational' ? '#10B981' : st === 'needsService' ? '#F59E0B' : '#EF4444'
                              : colors.surfaceSubtle,
                          },
                        ]}
                      >
                        <Text style={[styles.statusToggleText, { color: status === st ? '#FFFFFF' : colors.textMuted }]}>
                          {st === 'operational' ? 'OK' : st === 'needsService' ? 'Service' : 'Down'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Notes / Storage Shed</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. Cardamom curing shed generator"
                  placeholderTextColor={colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              <TouchableOpacity
                onPress={handleSaveEquipment}
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>
                  {editingEquipmentId ? 'Save Changes' : 'Register Equipment'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 7. Tooltip Popover Modal: Why Track Farm Machinery & Muster? */}
      <Modal visible={showTooltipModal} transparent animationType="fade" onRequestClose={() => setShowTooltipModal(false)}>
        <View style={styles.tooltipOverlay}>
          <View style={[styles.tooltipCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.tooltipHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={[styles.tooltipIconBubble, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="bulb" size={20} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tooltipTitle, { color: colors.text }]}>
                    {t('whyTrackTitle') || 'Why Track Farm Machinery & Muster?'}
                  </Text>
                  <Text style={[styles.tooltipSub, { color: colors.textMuted }]}>
                    {t('whyTrackSubtitle') || 'Four essential operational pillars for estate efficiency'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowTooltipModal(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={styles.pillarList}>
                <View style={[styles.pillarItem, { backgroundColor: colors.surfaceSubtle }]}>
                  <Ionicons name="shield-checkmark" size={18} color="#059669" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pillarTitle, { color: '#059669' }]}>
                      {t('preventBreakdowns') || '1. Prevent Sudden Breakdowns'}
                    </Text>
                    <Text style={[styles.pillarDesc, { color: colors.text }]}>
                      {t('preventBreakdownsDesc') || 'Monitors engine age and fuel burn rates so you schedule maintenance before peak harvest flushes.'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.pillarItem, { backgroundColor: colors.surfaceSubtle }]}>
                  <Ionicons name="flame" size={18} color="#D97706" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pillarTitle, { color: '#D97706' }]}>
                      {t('detectTheft') || '2. Detect Fuel Theft & Leaks'}
                    </Text>
                    <Text style={[styles.pillarDesc, { color: colors.text }]}>
                      {t('detectTheftDesc') || 'Flags abnormal fuel burn rates (L/hr) to identify worn piston rings, carburetor issues, or fuel pilferage.'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.pillarItem, { backgroundColor: colors.surfaceSubtle }]}>
                  <Ionicons name="people" size={18} color="#3B82F6" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pillarTitle, { color: '#3B82F6' }]}>
                      {t('toolAccountability') || '3. Tool Accountability (Muster)'}
                    </Text>
                    <Text style={[styles.pillarDesc, { color: colors.text }]}>
                      {t('toolAccountabilityDesc') || 'Periodic physical audits verify tool location, assigned operator, and identify missing equipment across sheds.'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.pillarItem, { backgroundColor: colors.surfaceSubtle }]}>
                  <Ionicons name="trending-down" size={18} color="#8B5CF6" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pillarTitle, { color: '#8B5CF6' }]}>
                      {t('repairVsBuy') || '4. Repair vs Buy Decisions'}
                    </Text>
                    <Text style={[styles.pillarDesc, { color: colors.text }]}>
                      {t('repairVsBuyDesc') || 'Compares initial purchase cost with cumulative fuel and repair spend to know when replacement is cheaper.'}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowTooltipModal(false)}
              style={[styles.tooltipCloseBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.tooltipCloseBtnText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 8. Themed Confirmation Dialog for Delete */}
      <ThemedConfirmModal
        visible={!!deleteTarget}
        type="delete"
        title="Delete Farm Equipment"
        message={`Are you sure you want to remove "${deleteTarget?.name}" (${deleteTarget?.assetId}) from the Asset Registry?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          if (deleteTarget && onDeleteEquipment) {
            onDeleteEquipment(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* 9. Themed Validation Error Modal */}
      <ThemedConfirmModal
        visible={!!validationError}
        type="warning"
        title="Required Field"
        message={validationError || ''}
        confirmText="OK"
        isSingleButton
        onConfirm={() => setValidationError(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    gap: 12,
  },
  mainHeaderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  mainIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  mainSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  tooltipTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tooltipTriggerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterContainer: {
    marginVertical: 2,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardsList: {
    gap: 10,
  },
  emptyCard: {
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 6,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  equipmentCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 10,
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#9CA3AF30',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  warningBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  musterHistoryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  musterHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  musterHistoryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  miniMusterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  miniMusterBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  noMusterBox: {
    paddingVertical: 14,
    alignItems: 'center',
    gap: 2,
  },
  noMusterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noMusterSub: {
    fontSize: 12,
  },
  musterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  musterDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  freqPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freqPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  musterAuditor: {
    fontSize: 11,
    marginTop: 2,
  },
  musterNotes: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  musterCountsCol: {
    alignItems: 'flex-end',
  },
  countBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  catRow: {
    flexDirection: 'row',
    gap: 6,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusTogglePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 8,
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Tooltip Modal Styles
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  tooltipCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tooltipIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  tooltipSub: {
    fontSize: 11,
    marginTop: 1,
  },
  pillarList: {
    gap: 10,
    marginTop: 4,
  },
  pillarItem: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  pillarTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  pillarDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  tooltipCloseBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  tooltipCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
