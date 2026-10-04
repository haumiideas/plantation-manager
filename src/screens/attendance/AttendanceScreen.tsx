import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { useLanguage } from '../../context/LanguageContext';
import { ThemedConfirmModal } from '../../components/common/ThemedConfirmModal';
import { ThemedDatePickerModal } from '../../components/common/ThemedDatePickerModal';
import { HolidayReasonModal } from '../../components/attendance/HolidayReasonModal';
import { ReportExportModal } from '../../components/export/ReportExportModal';
import { getLocalizedFarmName } from '../../utils/localizationUtils';
import { AttendanceSummaryBar } from '../../components/attendance/AttendanceSummaryBar';
import { WorkerAttendanceCard } from '../../components/attendance/WorkerAttendanceCard';
import { AddWorkerModal } from '../../components/attendance/AddWorkerModal';
import { TaskSelectorModal } from '../../components/attendance/TaskSelectorModal';
import { WageEditModal } from '../../components/attendance/WageEditModal';
import { LeftWorkersModal } from '../../components/attendance/LeftWorkersModal';
import { FarmAcreageModal } from '../../components/farm/FarmAcreageModal';
import { PlantationWorker, WorkerCategory } from '../../types/worker';
import {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSummary,
  EstateDayType,
} from '../../types/attendance';
import {
  getAllActiveWorkers,
  getLeftWorkers,
  addWorker,
  markWorkerLeftFarm,
  reactivateWorker,
  updateWorkerWageRates,
} from '../../services/workerService';
import {
  getAttendanceForDateAndFarm,
  saveAttendanceRecord,
  markAllWorkersPresent,
  clearAllAttendance,
  overrideTodayWage,
  calculateAttendanceSummary,
  getDayStatus,
  saveDayStatus,
} from '../../services/attendanceService';
import { logAuditEvent } from '../../services/auditService';
import { formatDate, formatDateWithFullDay, getDayOfWeekKey } from '../../utils/date';

export const AttendanceScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { selectedFarm, selectedFarmOption, refreshFarms } = useFarm();
  const { user, role, orgId, isFirebaseReady } = useAuth();
  const { t, language } = useLanguage();
  const isAdmin = role === 'admin';

  // Date State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [dayType, setDayType] = useState<EstateDayType>('working_day');
  const [holidayReason, setHolidayReason] = useState<string>('');
  const [isHolidayModalVisible, setIsHolidayModalVisible] = useState<boolean>(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState<boolean>(false);

  // Workers & Attendance State
  const [activeWorkers, setActiveWorkers] = useState<PlantationWorker[]>([]);
  const [leftWorkers, setLeftWorkers] = useState<PlantationWorker[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<WorkerCategory | 'all'>('all');

  // Modal States
  const [isFarmModalVisible, setIsFarmModalVisible] = useState(false);
  const [isAddWorkerVisible, setIsAddWorkerVisible] = useState(false);
  const [isLeftWorkersVisible, setIsLeftWorkersVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [selectedWorkerForTask, setSelectedWorkerForTask] = useState<PlantationWorker | null>(null);
  const [selectedWorkerForWage, setSelectedWorkerForWage] = useState<PlantationWorker | null>(null);

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

  const dateIsoString = currentDate.toISOString().split('T')[0];
  const dayOfWeekKey = getDayOfWeekKey(currentDate);
  const localizedDayName = t(dayOfWeekKey) || dayOfWeekKey;
  const dateFormattedDisplay = `${localizedDayName}, ${formatDate(currentDate)}`;
  const isToday = new Date().toDateString() === currentDate.toDateString();

  const activeOrgId = orgId || 'plantation_org_namari_adukidathan';
  const recorderUid = user?.uid || 'user_local';
  const recorderName = user?.displayName || 'Supervisor';

  // Instant Local-First Data Loader
  const loadData = useCallback(async () => {
    try {
      // 1. Shared common worker pool loads instantly from local storage
      const workersList = await getAllActiveWorkers(activeOrgId);
      setActiveWorkers(workersList);

      const leftList = await getLeftWorkers(activeOrgId);
      setLeftWorkers(leftList);

      // 2. Attendance records load instantly from local storage (auto-merged for consolidated)
      const recordsMap = await getAttendanceForDateAndFarm(activeOrgId, selectedFarm, dateIsoString);
      setAttendanceRecords(recordsMap);

      // 3. Load specific day status and holiday reason for this date & farm
      const dayStatus = await getDayStatus(selectedFarm, dateIsoString);
      setDayType(dayStatus.status);
      setHolidayReason(dayStatus.holidayReason || '');
    } catch (err) {
      console.error('[AttendanceScreen] Error loading data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeOrgId, selectedFarm, dateIsoString]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-reload data whenever the screen tab gains focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Date Navigation
  const changeDateByDays = (days: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + days);
    setCurrentDate(nextDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Day Type Toggle (Working Day <--> Holiday with Reason Input)
  const handleToggleDayType = () => {
    if (dayType === 'working_day') {
      setIsHolidayModalVisible(true);
    } else {
      setDayType('working_day');
      setHolidayReason('');
      saveDayStatus(selectedFarm, dateIsoString, 'working_day');
      logAuditEvent({
        orgId: activeOrgId,
        performedByUid: recorderUid,
        performedByName: recorderName,
        action: 'update',
        entityType: 'day_status',
        title: 'Working Day Restored',
        details: `${selectedFarmOption.label} on ${dateFormattedDisplay} restored to Working Day`,
      });
    }
  };

  const handleConfirmHoliday = async (reason: string) => {
    setDayType('estate_holiday');
    setHolidayReason(reason);
    await saveDayStatus(selectedFarm, dateIsoString, 'estate_holiday', reason);
    logAuditEvent({
      orgId: activeOrgId,
      performedByUid: recorderUid,
      performedByName: recorderName,
      action: 'update',
      entityType: 'day_status',
      title: 'Estate Holiday Declared',
      details: `${selectedFarmOption.label} on ${dateFormattedDisplay} marked as Holiday (${reason})`,
    });
  };

  // Are all active workers marked present?
  const allPresent =
    activeWorkers.length > 0 &&
    activeWorkers.every((w) => attendanceRecords[w.id]?.status === 'present');

  // Bulk Action: Toggle "Mark All Present" <--> "Clear Selection"
  const handleToggleMarkAll = async () => {
    if (activeWorkers.length === 0) return;

    if (allPresent) {
      // Clear / Reset muster
      const cleared = await clearAllAttendance(selectedFarm, dateIsoString);
      setAttendanceRecords(cleared);
    } else {
      // Mark All Present
      const defaultTask =
        selectedFarm === 'namari' ? 'Cardamom Picking (2nd Flush)' : 'Pepper Harvest & Plucking';

      const updated = await markAllWorkersPresent(
        activeOrgId,
        selectedFarm,
        dateIsoString,
        activeWorkers,
        recorderUid,
        recorderName,
        defaultTask
      );
      setAttendanceRecords(updated);
    }
  };

  // Individual Worker Attendance Status Toggle
  const handleStatusChange = async (worker: PlantationWorker, newStatus: AttendanceStatus) => {
    const targetFarm = selectedFarm === 'consolidated' ? 'namari' : selectedFarm;
    const recordId = `${targetFarm}_${dateIsoString}_${worker.id}`;
    const existing = attendanceRecords[worker.id];

    if (newStatus === 'unmarked') {
      // Deselected back to unmarked
      const updated = { ...attendanceRecords };
      delete updated[worker.id];
      setAttendanceRecords(updated);
      await saveAttendanceRecord({
        id: recordId,
        orgId: activeOrgId,
        farmId: targetFarm,
        date: dateIsoString,
        workerId: worker.id,
        workerName: worker.name,
        category: worker.category,
        status: 'unmarked',
        overtimeHours: 0,
        dailyWageRate: worker.dailyWageRate,
        overtimeRatePerHour: worker.overtimeRatePerHour,
        allocatedTask: existing?.allocatedTask || 'General Farm Work',
        recordedByUid: recorderUid,
        recordedByName: recorderName,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    const updatedRecord: AttendanceRecord = {
      id: recordId,
      orgId: activeOrgId,
      farmId: targetFarm,
      date: dateIsoString,
      workerId: worker.id,
      workerName: worker.name,
      category: worker.category,
      status: newStatus,
      overtimeHours: newStatus === 'absent' ? 0 : (existing?.overtimeHours || 0),
      // Immutable point-in-time wage snapshot:
      dailyWageRate: existing?.dailyWageRate ?? worker.dailyWageRate,
      overtimeRatePerHour: existing?.overtimeRatePerHour ?? worker.overtimeRatePerHour,
      isWageOverriddenToday: existing?.isWageOverriddenToday,
      allocatedTask: existing?.allocatedTask || (worker.category === 'picker' ? 'Cardamom Picking' : 'Field Work'),
      block: existing?.block || (targetFarm === 'namari' ? 'Ridge Block A' : 'Block 1'),
      recordedByUid: recorderUid,
      recordedByName: recorderName,
      updatedAt: new Date().toISOString(),
    };

    setAttendanceRecords((prev) => ({
      ...prev,
      [worker.id]: updatedRecord,
    }));

    await saveAttendanceRecord(updatedRecord);
  };

  // Overtime (OT) Stepper Change
  const handleOvertimeChange = async (worker: PlantationWorker, hours: number) => {
    const targetFarm = selectedFarm === 'consolidated' ? 'namari' : selectedFarm;
    const recordId = `${targetFarm}_${dateIsoString}_${worker.id}`;
    const existing = attendanceRecords[worker.id];

    const updatedRecord: AttendanceRecord = {
      id: recordId,
      orgId: activeOrgId,
      farmId: targetFarm,
      date: dateIsoString,
      workerId: worker.id,
      workerName: worker.name,
      category: worker.category,
      status: existing?.status || 'present',
      overtimeHours: hours,
      dailyWageRate: existing?.dailyWageRate ?? worker.dailyWageRate,
      overtimeRatePerHour: existing?.overtimeRatePerHour ?? worker.overtimeRatePerHour,
      isWageOverriddenToday: existing?.isWageOverriddenToday,
      allocatedTask: existing?.allocatedTask || 'Cardamom Picking',
      block: existing?.block || 'Ridge Block A',
      recordedByUid: recorderUid,
      recordedByName: recorderName,
      updatedAt: new Date().toISOString(),
    };

    setAttendanceRecords((prev) => ({
      ...prev,
      [worker.id]: updatedRecord,
    }));

    await saveAttendanceRecord(updatedRecord);
  };

  // Dynamic Daily Task Allocation
  const handleSelectTask = async (task: string) => {
    if (!selectedWorkerForTask) return;
    const worker = selectedWorkerForTask;
    const targetFarm = selectedFarm === 'consolidated' ? 'namari' : selectedFarm;
    const recordId = `${targetFarm}_${dateIsoString}_${worker.id}`;
    const existing = attendanceRecords[worker.id];

    const updatedRecord: AttendanceRecord = {
      id: recordId,
      orgId: activeOrgId,
      farmId: targetFarm,
      date: dateIsoString,
      workerId: worker.id,
      workerName: worker.name,
      category: worker.category,
      status: existing?.status || 'present',
      overtimeHours: existing?.overtimeHours || 0,
      dailyWageRate: existing?.dailyWageRate ?? worker.dailyWageRate,
      overtimeRatePerHour: existing?.overtimeRatePerHour ?? worker.overtimeRatePerHour,
      isWageOverriddenToday: existing?.isWageOverriddenToday,
      allocatedTask: task,
      block: existing?.block || (targetFarm === 'namari' ? 'Ridge Block A' : 'Block 1'),
      recordedByUid: recorderUid,
      recordedByName: recorderName,
      updatedAt: new Date().toISOString(),
    };

    setAttendanceRecords((prev) => ({
      ...prev,
      [worker.id]: updatedRecord,
    }));

    await saveAttendanceRecord(updatedRecord);
  };

  // Admin Wage: Save Today's Override Only (e.g. Somnath's ₹550)
  const handleSaveTodayWageOverride = async (dailyWage: number, otRate: number) => {
    if (!selectedWorkerForWage) return;
    const worker = selectedWorkerForWage;
    const targetFarm = selectedFarm === 'consolidated' ? 'namari' : selectedFarm;
    const recordId = `${targetFarm}_${dateIsoString}_${worker.id}`;
    const existing = attendanceRecords[worker.id];

    const baseRecord: AttendanceRecord = existing || {
      id: recordId,
      orgId: activeOrgId,
      farmId: targetFarm,
      date: dateIsoString,
      workerId: worker.id,
      workerName: worker.name,
      category: worker.category,
      status: 'present',
      overtimeHours: 0,
      dailyWageRate: dailyWage,
      overtimeRatePerHour: otRate,
      allocatedTask: 'General Farm Work',
      recordedByUid: recorderUid,
      recordedByName: recorderName,
      updatedAt: new Date().toISOString(),
    };

    const overridden = await overrideTodayWage(baseRecord, dailyWage, otRate);
    setAttendanceRecords((prev) => ({
      ...prev,
      [worker.id]: overridden,
    }));
  };

  // Admin Wage: Update Future Standard Base Rate (Labor Dept Revision)
  const handleSavePermanentBase = async (dailyWage: number, otRate: number) => {
    if (!selectedWorkerForWage) return;
    await updateWorkerWageRates(selectedWorkerForWage.id, dailyWage, otRate);
    setActiveWorkers((prev) =>
      prev.map((w) =>
        w.id === selectedWorkerForWage.id
          ? { ...w, dailyWageRate: dailyWage, overtimeRatePerHour: otRate }
          : w
      )
    );
  };

  // Mark Worker as Left Farm
  const handleLeftFarmConfirm = (worker: PlantationWorker) => {
    setModalConfig({
      visible: true,
      title: t('markLeftFarmTitle') || 'Mark as Left Farm',
      message: `${worker.name}: ${t('markLeftFarmMessage') || 'Are you sure you want to mark this worker as having left the plantation? They will be removed from daily muster.'}`,
      type: 'delete',
      confirmText: t('markLeftFarmConfirmText') || 'Confirm Left',
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, visible: false }));
        await markWorkerLeftFarm(worker.id);
        setActiveWorkers((prev) => prev.filter((w) => w.id !== worker.id));
        setLeftWorkers((prev) => [...prev, { ...worker, status: 'left_farm' }]);
      },
    });
  };

  // Reactivate Worker
  const handleReactivateWorker = async (workerId: string) => {
    await reactivateWorker(workerId);
    const reactivated = leftWorkers.find((w) => w.id === workerId);
    if (reactivated) {
      setLeftWorkers((prev) => prev.filter((w) => w.id !== workerId));
      setActiveWorkers((prev) => [...prev, { ...reactivated, status: 'active' }]);
    }
  };

  // Filter Workers
  const filteredWorkers = activeWorkers.filter((worker) => {
    const matchesCategory = selectedCategory === 'all' || worker.category === selectedCategory;
    const matchesSearch =
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (worker.phone && worker.phone.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  // Calculate Real-Time Summary
  const summary: AttendanceSummary = calculateAttendanceSummary(
    attendanceRecords,
    activeWorkers,
    isAdmin
  );

  return (
    <ScreenContainer header={<AppHeader />}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Active Farm Header with Direct Edit Farm Name Button */}
        <View style={[styles.farmHeaderBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <Ionicons name="business" size={16} color={colors.primary} />
            <Text style={[styles.farmHeaderTitle, { color: colors.text }]} numberOfLines={1}>
              {getLocalizedFarmName(selectedFarmOption.label, language)}
            </Text>
            <View style={[styles.farmAcreagePill, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={[styles.farmAcreagePillText, { color: colors.primary }]}>
                {selectedFarmOption.description || 'Acreage not set'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setIsFarmModalVisible(true)}
            style={[styles.editFarmBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
          >
            <Ionicons name="pencil" size={12} color={colors.primary} />
            <Text style={[styles.editFarmBtnText, { color: colors.primary }]}>{t('editFarmName')}</Text>
          </TouchableOpacity>
        </View>

        {/* Top Control Bar: Date Navigator + Day Type Toggle */}
        <View style={[styles.dateBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[styles.dateNavBtn, { backgroundColor: colors.surfaceSubtle }]}
            onPress={() => changeDateByDays(-1)}
            accessibilityLabel="Previous Day"
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.dateDisplayCol}>
            <TouchableOpacity
              onPress={() => setIsDatePickerVisible(true)}
              style={{ alignItems: 'center' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                <Text style={[styles.dateText, { color: colors.text }]}>{dateFormattedDisplay}</Text>
              </View>
            </TouchableOpacity>

            {/* Day Type Toggle (Day of Week + Working Day vs Estate Holiday) */}
            <TouchableOpacity
              style={[
                styles.dayTypePill,
                {
                  backgroundColor:
                    dayType === 'working_day'
                      ? (isDark ? '#064E3B' : '#D1FAE5')
                      : (isDark ? '#451A03' : '#FEF3C7'),
                },
              ]}
              onPress={handleToggleDayType}
            >
              <Text
                style={[
                  styles.dayTypeText,
                  {
                    color:
                      dayType === 'working_day'
                        ? (isDark ? '#6EE7B7' : '#065F46')
                        : (isDark ? '#FCD34D' : '#92400E'),
                  },
                ]}
              >
                {dayType === 'working_day'
                  ? `● ${localizedDayName} (${t('workingDay')})`
                  : `★ ${localizedDayName} (${t('estateHoliday')})`}
              </Text>
              {dayType === 'estate_holiday' && Boolean(holidayReason) && (
                <Text
                  style={{
                    fontSize: 11,
                    color: isDark ? '#FCD34D' : '#92400E',
                    fontStyle: 'italic',
                    marginTop: 2,
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  "{holidayReason}"
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dateNavRight}>
            {!isToday && (
              <TouchableOpacity
                style={[styles.todayBtn, { backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }]}
                onPress={goToToday}
              >
                <Text style={[styles.todayBtnText, { color: colors.primary }]}>{t('today')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.dateNavBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={() => changeDateByDays(1)}
              accessibilityLabel="Next Day"
            >
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Attendance Summary Bar & Stateful "Mark All Present" / "Clear All" Toggle */}
        <AttendanceSummaryBar
          summary={summary}
          allPresent={allPresent}
          onToggleMarkAll={handleToggleMarkAll}
          onAddWorkerPress={() => setIsAddWorkerVisible(true)}
        />

        {/* Roster Controls: Category Filter + Inactive/Left Workers Button */}
        <View style={styles.rosterControlRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
            {(
              [
                { id: 'all', label: t('all') },
                { id: 'picker', label: t('pickers') },
                { id: 'sprayer', label: t('spraying') },
                { id: 'weeder', label: t('weeding') },
                { id: 'curing_crew', label: t('curing') },
              ] as { id: WorkerCategory | 'all'; label: string }[]
            ).map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                  selectedCategory === cat.id && [styles.categoryPillActive, { backgroundColor: colors.card, borderColor: colors.primary }],
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: selectedCategory === cat.id ? colors.primary : colors.textMuted },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Export Muster Roll Button */}
          <TouchableOpacity
            style={[styles.leftWorkersBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, marginRight: 6 }]}
            onPress={() => setIsExportModalVisible(true)}
            accessibilityLabel="Export Attendance Muster"
          >
            <Ionicons name="download-outline" size={15} color={colors.primary} />
          </TouchableOpacity>

          {/* Left Workers Roster button */}
          <TouchableOpacity
            style={[styles.leftWorkersBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
            onPress={() => setIsLeftWorkersVisible(true)}
            accessibilityLabel="View inactive or left workers"
          >
            <Ionicons name="archive-outline" size={14} color={colors.textMuted} />
            {leftWorkers.length > 0 && (
              <View style={[styles.leftBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.leftBadgeText}>{leftWorkers.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>


        {/* Search Worker Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('searchWorkers')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Workers Attendance Cards Roster */}
        {filteredWorkers.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="people-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noWorkersOnRoster') || 'No Workers on Roster'}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {searchQuery ? (t('noWorkersMatchSearch') || 'No laborers match your search.') : (t('noActiveWorkersInPool') || 'No active workers in the plantation pool.')}
            </Text>
            <TouchableOpacity
              style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
              onPress={() => setIsAddWorkerVisible(true)}
            >
              <Text style={styles.emptyAddBtnText}>{t('addFirstWorker') || '+ Add First Worker'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredWorkers.map((worker) => (
            <WorkerAttendanceCard
              key={worker.id}
              worker={worker}
              record={attendanceRecords[worker.id]}
              onStatusChange={(status) => handleStatusChange(worker, status)}
              onOvertimeChange={(otHours) => handleOvertimeChange(worker, otHours)}
              onTaskPress={() => setSelectedWorkerForTask(worker)}
              onWagePress={() => setSelectedWorkerForWage(worker)}
              onLeftFarmPress={() => handleLeftFarmConfirm(worker)}
            />
          ))
        )}

        {/* Offline Sync Status Footer */}
        <View style={styles.footerNote}>
          <Ionicons
            name={isFirebaseReady ? 'cloud-done-outline' : 'save-outline'}
            size={14}
            color={isFirebaseReady ? colors.primary : colors.accent}
          />
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            {isFirebaseReady
              ? (t('localFlashStorageActive') || 'Local Flash Storage Active (0ms) • Background Cloud Sync Enabled')
              : (t('offlineCacheActive') || 'Offline Cache Active (0ms) • Syncs automatically when online')}
          </Text>
        </View>
      </ScrollView>

      {/* Add Worker Modal */}
      <AddWorkerModal
        visible={isAddWorkerVisible}
        defaultFarmId={selectedFarm}
        onClose={() => setIsAddWorkerVisible(false)}
        onWorkerAdded={(newWorker) => {
          setActiveWorkers((prev) => [...prev, newWorker]);
          addWorker(newWorker);
        }}
      />

      {/* Daily Task Allocation Modal */}
      {selectedWorkerForTask && (
        <TaskSelectorModal
          visible={Boolean(selectedWorkerForTask)}
          workerName={selectedWorkerForTask.name}
          currentTask={
            attendanceRecords[selectedWorkerForTask.id]?.allocatedTask || 'Cardamom Picking'
          }
          onClose={() => setSelectedWorkerForTask(null)}
          onSelectTask={handleSelectTask}
        />
      )}

      {/* Wage & Overtime Adjustment Modal (Admin Only) */}
      {selectedWorkerForWage && (
        <WageEditModal
          visible={Boolean(selectedWorkerForWage)}
          worker={selectedWorkerForWage}
          record={attendanceRecords[selectedWorkerForWage.id]}
          selectedDateFormatted={dateFormattedDisplay}
          onClose={() => setSelectedWorkerForWage(null)}
          onSaveTodayOverride={handleSaveTodayWageOverride}
          onSavePermanentBase={handleSavePermanentBase}
        />
      )}

      {/* Inactive / Left Workers Management Modal */}
      <LeftWorkersModal
        visible={isLeftWorkersVisible}
        workers={leftWorkers}
        onClose={() => setIsLeftWorkersVisible(false)}
        onReactivate={handleReactivateWorker}
      />

      {/* Farm Name & Acreage Edit Modal */}
      <FarmAcreageModal
        visible={isFarmModalVisible}
        onClose={() => setIsFarmModalVisible(false)}
        onSave={async () => {
          await refreshFarms();
        }}
        orgId={activeOrgId}
      />

      <ThemedConfirmModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig((prev) => ({ ...prev, visible: false }))}
      />

      {/* Estate Holiday Reason Modal */}
      <HolidayReasonModal
        visible={isHolidayModalVisible}
        onClose={() => setIsHolidayModalVisible(false)}
        currentReason={holidayReason}
        onConfirm={handleConfirmHoliday}
        dateDisplay={dateFormattedDisplay}
      />

      {/* Universal Interactive Calendar Date Picker */}
      <ThemedDatePickerModal
        visible={isDatePickerVisible}
        onClose={() => setIsDatePickerVisible(false)}
        selectedDate={currentDate}
        onSelectDate={(_formatted, isoDate) => {
          const [y, m, d] = isoDate.split('-').map(Number);
          setCurrentDate(new Date(y, m - 1, d, 12, 0, 0));
        }}
      />

      {/* Labor Muster Export Modal */}
      <ReportExportModal
        visible={isExportModalVisible}
        onClose={() => setIsExportModalVisible(false)}
        defaultHead="attendance"
      />
    </ScreenContainer>
  );
};


const styles = StyleSheet.create({
  scrollContent: {
    padding: 14,
    gap: 12,
    paddingBottom: 40,
  },
  farmHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  farmHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  farmAcreagePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  farmAcreagePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  editFarmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  editFarmBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  dateNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDisplayCol: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dayTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 3,
  },
  dayTypeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  todayBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rosterControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryPillActive: {
    borderWidth: 1.5,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  leftWorkersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    position: 'relative',
  },
  leftBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  emptyBox: {
    padding: 30,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyAddBtn: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
