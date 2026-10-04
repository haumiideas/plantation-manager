import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { ThemedConfirmModal } from '../../components/common/ThemedConfirmModal';
import {
  FieldActivityEntry,
  StandardTaskType,
  TASK_TYPES,
} from '../../types/activity';
import {
  getActivityEntries,
  saveActivityEntry,
  deleteActivityEntry,
} from '../../services/activityService';
import { LogActivityModal } from '../../components/activity/LogActivityModal';
import { VisitorEntry } from '../../types/visitor';
import {
  getVisitorEntries,
  saveVisitorEntry,
  deleteVisitorEntry,
} from '../../services/visitorService';
import { LogVisitorModal } from '../../components/visitors/LogVisitorModal';
import { VisitorsList } from '../../components/visitors/VisitorsList';
import { ReportExportModal } from '../../components/export/ReportExportModal';

export const ActivityScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { selectedFarm, selectedFarmOption } = useFarm();
  const { orgId } = useAuth();
  const { t, translateUserText } = useLanguage();
  const effectiveOrgId = orgId || 'plantation_org_namari_adukidathan';

  const [activeTab, setActiveTab] = useState<'tasks' | 'visitors'>('tasks');
  const [activities, setActivities] = useState<FieldActivityEntry[]>([]);
  const [visitors, setVisitors] = useState<VisitorEntry[]>([]);
  const [selectedTaskType, setSelectedTaskType] = useState<StandardTaskType | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<FieldActivityEntry | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<FieldActivityEntry | null>(null);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<VisitorEntry | null>(null);

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

  const loadData = useCallback(async () => {
    try {
      const [actData, visData] = await Promise.all([
        getActivityEntries(effectiveOrgId, selectedFarm),
        getVisitorEntries(effectiveOrgId, selectedFarm),
      ]);
      setActivities(actData);
      setVisitors(visData);
    } catch {
      // ignore
    }
  }, [effectiveOrgId, selectedFarm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSaveActivity = async (
    entry: Omit<FieldActivityEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: string; editHistory?: any[] }
  ) => {
    const saved = await saveActivityEntry(entry);
    setActivities((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setEditingActivity(null);
  };

  const handleDelete = (entry: FieldActivityEntry) => {
    setModalConfig({
      visible: true,
      title: t('delete'),
      message: `Delete activity "${entry.activityName}" for ${entry.blockName}?`,
      type: 'delete',
      confirmText: t('delete'),
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, visible: false }));
        await deleteActivityEntry(effectiveOrgId, entry.id);
        setActivities((prev) => prev.filter((a) => a.id !== entry.id));
      },
    });
  };

  const handleSaveVisitor = async (
    entry: Omit<VisitorEntry, 'id' | 'createdAt'>
  ) => {
    await saveVisitorEntry(effectiveOrgId, {
      ...entry,
      id: editingVisitor?.id,
    });
    setEditingVisitor(null);
    setShowVisitorModal(false);
    loadData();
  };

  const handleDeleteVisitor = async (id: string) => {
    await deleteVisitorEntry(effectiveOrgId, id);
    loadData();
  };

  const filtered = activities.filter((a) => {
    if (selectedTaskType === 'all') return true;
    return a.taskType === selectedTaskType;
  });

  // Summary Metrics
  const totalActivities = activities.length;
  const totalWorkers = activities.reduce((s, a) => s + (a.workersAssigned || 0), 0);
  const totalHours = activities.reduce((s, a) => s + (a.hoursWorked || 0), 0);

  return (
    <ScreenContainer header={<AppHeader />}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Top Segmented Sub-Tab Switcher: Field Operations vs Visitors Log */}
        <View style={[styles.subTabContainer, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[
              styles.subTabBtn,
              activeTab === 'tasks' && { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 },
            ]}
            onPress={() => setActiveTab('tasks')}
          >
            <Ionicons
              name={activeTab === 'tasks' ? 'leaf' : 'leaf-outline'}
              size={15}
              color={activeTab === 'tasks' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.subTabText,
                { color: activeTab === 'tasks' ? colors.text : colors.textMuted, fontWeight: activeTab === 'tasks' ? '700' : '600' },
              ]}
            >
              {t('fieldOperationsTab') || 'Field Operations'} ({activities.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subTabBtn,
              activeTab === 'visitors' && { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 },
            ]}
            onPress={() => setActiveTab('visitors')}
          >
            <Ionicons
              name={activeTab === 'visitors' ? 'people' : 'people-outline'}
              size={15}
              color={activeTab === 'visitors' ? '#3B82F6' : colors.textMuted}
            />
            <Text
              style={[
                styles.subTabText,
                { color: activeTab === 'visitors' ? colors.text : colors.textMuted, fontWeight: activeTab === 'visitors' ? '700' : '600' },
              ]}
            >
              {t('visitorsLogTab') || 'Visitors Log'} ({visitors.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Header Row with Export Button */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, marginBottom: 10 }}>
          <TouchableOpacity
            onPress={() => setShowExportModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              backgroundColor: colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Ionicons name="download-outline" size={14} color={colors.primary} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
              {t('exportBtn')} {activeTab === 'visitors' ? t('visitorsLogTab') : t('fieldOperationsTab')}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'visitors' ? (

          <VisitorsList
            visitors={visitors}
            onAddVisitor={() => {
              setEditingVisitor(null);
              setShowVisitorModal(true);
            }}
            onEditVisitor={(vis) => {
              setEditingVisitor(vis);
              setShowVisitorModal(true);
            }}
            onDeleteVisitor={handleDeleteVisitor}
          />
        ) : (
          <>
            {/* Header Bar */}
            <View style={styles.headerBar}>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t('fieldActivityLog')}
                </Text>
                <Text style={[styles.subtitle, { color: isDark ? colors.primaryLight : colors.primary }]}>
                  {selectedFarmOption.label} ({selectedFarmOption.shortCode}) • Operations
                </Text>
              </View>

          <TouchableOpacity
            onPress={() => setShowLogModal(true)}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add-circle" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>{t('logActivity')}</Text>
          </TouchableOpacity>
        </View>

        {/* Metrics Overview Row */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="clipboard-outline" size={18} color={colors.primary} />
            <Text style={[styles.metricNum, { color: colors.text }]}>{totalActivities}</Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
              {t('activitiesLogged')}
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="people-outline" size={18} color="#3B82F6" />
            <Text style={[styles.metricNum, { color: colors.text }]}>{totalWorkers}</Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
              {t('workersAssigned')}
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="time-outline" size={18} color="#D97706" />
            <Text style={[styles.metricNum, { color: colors.text }]}>{totalHours}h</Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
              {t('hoursWorked')}
            </Text>
          </View>
        </View>

        {/* Task Type Filter Chips */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              onPress={() => setSelectedTaskType('all')}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedTaskType === 'all' ? colors.primary : colors.card,
                  borderColor: selectedTaskType === 'all' ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: selectedTaskType === 'all' ? '#FFFFFF' : colors.text,
                    fontWeight: selectedTaskType === 'all' ? '800' : '600',
                  },
                ]}
              >
                {t('all')}
              </Text>
            </TouchableOpacity>

            {TASK_TYPES.map((type) => {
              const isSelected = selectedTaskType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => setSelectedTaskType(type.id)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? type.color : colors.card,
                      borderColor: isSelected ? type.color : colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={13}
                    color={isSelected ? '#FFFFFF' : type.color}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
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
        </View>

        {/* Activity Log Cards */}
        <View style={styles.activityList}>
          {filtered.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Ionicons name="construct-outline" size={38} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t('noActivitiesLogged')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {t('recordActivitiesDesc')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowLogModal(true)}
                style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text style={styles.emptyActionBtnText}>{t('logActivity')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filtered.map((item) => {
              const typeConfig = TASK_TYPES.find((t) => t.id === item.taskType) || TASK_TYPES[0];

              return (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                >
                  {/* Card Top Row */}
                  <View style={styles.cardHeader}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '20', borderColor: typeConfig.color }]}>
                        <Ionicons name={typeConfig.icon as any} size={12} color={typeConfig.color} />
                        <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
                          {t(typeConfig.labelKey as any) || typeConfig.defaultLabel}
                        </Text>
                      </View>

                      <View style={[styles.farmBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={[styles.farmBadgeText, { color: colors.textMuted }]}>
                          {item.farmId === 'namari' ? 'NAM' : 'ADU'} • {item.blockName}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingActivity(item);
                          setShowLogModal(true);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="create-outline" size={17} color={colors.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={17} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Activity Name */}
                  <Text style={[styles.activityName, { color: colors.text }]}>
                    {translateUserText(item.activityName)}
                  </Text>

                  {/* Audit Trail Edited Badge */}
                  {item.editHistory && item.editHistory.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSelectedHistoryItem(item)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        alignSelf: 'flex-start',
                        backgroundColor: '#F59E0B15',
                        borderWidth: 1,
                        borderColor: '#F59E0B40',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        marginTop: 4,
                        marginBottom: 4,
                      }}
                    >
                      <Ionicons name="create" size={12} color="#D97706" />
                      <Text style={{ fontSize: 10.5, color: '#D97706', fontWeight: '700' }}>
                        ✏️ {t('editedOn')} {item.editHistory[item.editHistory.length - 1].editedAt.slice(0, 10)} ({item.editHistory.length} {t('fieldChanges')}) ➔
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Date & Crop */}
                  <View style={styles.metaLine}>
                    <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>
                      {item.date} • {item.cropId.toUpperCase()}
                    </Text>
                  </View>

                  {/* Metrics Pills Row */}
                  <View style={styles.pillsRow}>
                    <View style={[styles.pill, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Ionicons name="people-outline" size={12} color={colors.primary} />
                      <Text style={[styles.pillText, { color: colors.text }]}>
                        {item.workersAssigned} {t('workersAssigned')}
                      </Text>
                    </View>

                    <View style={[styles.pill, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Ionicons name="time-outline" size={12} color="#3B82F6" />
                      <Text style={[styles.pillText, { color: colors.text }]}>
                        {item.hoursWorked} {t('hoursWorked')}
                      </Text>
                    </View>

                    {item.costIncurred ? (
                      <View style={[styles.pill, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Ionicons name="cash-outline" size={12} color="#D97706" />
                        <Text style={[styles.pillText, { color: '#D97706', fontWeight: '700' }]}>
                          ₹ {item.costIncurred}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Chemical / Material Details */}
                  {item.chemicalUsed ? (
                    <View style={[styles.chemBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Ionicons name="flask-outline" size={13} color="#3B82F6" />
                      <Text style={[styles.chemText, { color: colors.text }]}>
                        {translateUserText(item.chemicalUsed)}{' '}
                        {item.dilutionLitres ? `(${item.dilutionLitres} Litres sprayed)` : ''}
                      </Text>
                    </View>
                  ) : null}

                  {/* Fertigation Process Details */}
                  {item.fertigation && (
                    <View
                      style={{
                        backgroundColor: '#0D948815',
                        borderWidth: 1,
                        borderColor: '#0D948835',
                        borderRadius: 8,
                        padding: 10,
                        marginTop: 8,
                        gap: 6,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="color-filter" size={14} color="#0D9488" />
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#0D9488' }}>
                            {item.fertigation.drumsCount} {t('drums')} ({item.fertigation.totalSolutionLitres} L Solution)
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#0D9488', textTransform: 'capitalize' }}>
                          {translateUserText(item.fertigation.method.replace('_', ' '))}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, color: colors.text }}>
                          ⚡ {t('applicationMode')}: <Text style={{ fontWeight: '700' }}>{translateUserText(item.fertigation.mode.replace('_', ' '))}</Text>
                        </Text>
                        {item.fertigation.fuelConsumedLitres ? (
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>
                            ⛽ {item.fertigation.fuelConsumedLitres} L {t('fuelLogged')}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  )}

                  {/* Notes */}
                  {item.notes ? (
                    <Text style={[styles.notesText, { color: colors.textMuted }]}>
                      "{translateUserText(item.notes)}"
                    </Text>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
        </>
      )}

        {/* Modals */}
        <LogActivityModal
          visible={showLogModal}
          onClose={() => {
            setShowLogModal(false);
            setEditingActivity(null);
          }}
          defaultFarmId={selectedFarm}
          orgId={effectiveOrgId}
          editingEntry={editingActivity}
          onSave={handleSaveActivity}
        />

        <LogVisitorModal
          visible={showVisitorModal}
          onClose={() => {
            setShowVisitorModal(false);
            setEditingVisitor(null);
          }}
          defaultFarmId={selectedFarm}
          orgId={effectiveOrgId}
          onSave={handleSaveVisitor}
          editingEntry={editingVisitor}
        />
      </ScrollView>

      <ThemedConfirmModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig((prev) => ({ ...prev, visible: false }))}
      />

      {/* Activity & Visitors Export Modal */}
      <ReportExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultHead={activeTab === 'visitors' ? 'visitors' : 'activity'}
      />

      {/* Audit Trail & Edit History Modal */}
      <Modal
        visible={selectedHistoryItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedHistoryItem(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, padding: 18, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="time" size={20} color="#F59E0B" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                  {t('editHistoryTitle')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedHistoryItem(null)}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                {selectedHistoryItem ? translateUserText(selectedHistoryItem.activityName) : ''}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 12 }}>
                {selectedHistoryItem?.blockName} • Created on {selectedHistoryItem?.date}
              </Text>

              <View style={{ gap: 10 }}>
                {selectedHistoryItem?.editHistory?.map((hist, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: colors.surfaceSubtle,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      borderRadius: 10,
                      padding: 10,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B' }}>
                        {t('editedOn')} #{idx + 1}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted }}>
                        {new Date(hist.editedAt).toLocaleString()}
                      </Text>
                    </View>
                    {hist.fieldChanges.map((change, cIdx) => (
                      <View key={cIdx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Ionicons name="arrow-forward" size={12} color={colors.primary} />
                        <Text style={{ fontSize: 11.5, color: colors.text }}>{change}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setSelectedHistoryItem(null)}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
                marginTop: 16,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};


const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
    gap: 12,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  metricCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricNum: {
    fontSize: 17,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  filterSection: {
    marginVertical: 2,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  activityList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  farmBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  farmBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activityName: {
    fontSize: 15,
    fontWeight: '700',
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
  },
  chemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chemText: {
    fontSize: 12,
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  subTabContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    marginBottom: 6,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  subTabText: {
    fontSize: 12,
  },
});
