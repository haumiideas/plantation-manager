import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { MainTabParamList } from '../../types/navigation';
import { formatDate, getDayOfWeekKey, formatDateLocalized } from '../../utils/date';

// Services
import { getAttendanceForDateAndFarm } from '../../services/attendanceService';
import { getHarvestEntries, getCuringBatches } from '../../services/harvestService';
import { getExpendableItems, getFarmEquipment } from '../../services/equipmentService';
import { getExpenses } from '../../services/expenseService';
import { getActivityEntries } from '../../services/activityService';

// Types
import { ExpendableItem, FarmEquipment } from '../../types/equipment';
import { AttendanceRecord } from '../../types/attendance';
import { HarvestEntry, CuringBatch } from '../../types/harvest';
import { FieldActivityEntry } from '../../types/activity';
import { ExpenseEntry } from '../../types/expense';

type NavigationProp = BottomTabNavigationProp<MainTabParamList>;

export const DashboardScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { selectedFarm, selectedFarmOption } = useFarm();
  const { orgId } = useAuth();
  const { t, language, translateUserText } = useLanguage();
  const navigation = useNavigation<NavigationProp>();
  const effectiveOrgId = orgId || 'plantation_org_namari_adukidathan';

  const [refreshing, setRefreshing] = useState(false);

  // Live Metrics State
  const [presentCount, setPresentCount] = useState<number>(0);
  const [totalWageCommitment, setTotalWageCommitment] = useState<number>(0);
  const [todayHarvestKg, setTodayHarvestKg] = useState<number>(0);
  const [activeFlushesCount, setActiveFlushesCount] = useState<number>(0);
  const [activeBatchesCount, setActiveBatchesCount] = useState<number>(0);
  const [expendableStock, setExpendableStock] = useState<ExpendableItem[]>([]);
  const [equipmentList, setEquipmentList] = useState<FarmEquipment[]>([]);
  const [todayActivityCount, setTodayActivityCount] = useState<number>(0);
  const [monthlyExpenseTotal, setMonthlyExpenseTotal] = useState<number>(0);

  const today = new Date();
  const dayKey = getDayOfWeekKey(today);
  const localizedDay = t(dayKey);
  const todayFormatted = formatDate(today);
  const todayIso = today.toISOString().split('T')[0];
  const displayDate = `${localizedDay}, ${formatDateLocalized(today, language)}`;

  const loadMetrics = useCallback(async () => {
    try {
      const [
        attendanceRecords,
        harvestList,
        curingList,
        expendables,
        machinery,
        expenses,
        activities,
      ] = await Promise.all([
        getAttendanceForDateAndFarm(effectiveOrgId, selectedFarm, todayIso),
        getHarvestEntries(effectiveOrgId, selectedFarm),
        getCuringBatches(effectiveOrgId, selectedFarm),
        getExpendableItems(effectiveOrgId),
        getFarmEquipment(effectiveOrgId),
        getExpenses(effectiveOrgId),
        getActivityEntries(effectiveOrgId, selectedFarm),
      ]);

      // 1. Attendance Metrics
      const records: AttendanceRecord[] = Object.values(attendanceRecords || {});
      const present = records.filter(
        (r: AttendanceRecord) => r.status === 'present' || r.status === 'half_day'
      );
      setPresentCount(present.length);
      const wages = present.reduce((acc: number, r: AttendanceRecord) => {
        const base = r.status === 'half_day' ? (r.dailyWageRate || 0) * 0.5 : (r.dailyWageRate || 0);
        const ot = (r.overtimeHours || 0) * (r.overtimeRatePerHour || 0);
        return acc + base + ot;
      }, 0);
      setTotalWageCommitment(wages);

      // 2. Harvest Metrics
      const todayHarvest = (harvestList as HarvestEntry[]).filter((e: HarvestEntry) => e.date === todayFormatted);
      const totalKg = todayHarvest.reduce(
        (acc: number, e: HarvestEntry) => acc + (Number(e.freshWeightNetKg) || Number(e.totalWeightKg) || 0),
        0
      );
      setTodayHarvestKg(totalKg);

      const flushesSet = new Set((harvestList as HarvestEntry[]).map((e: HarvestEntry) => e.flushNumber).filter(Boolean));
      setActiveFlushesCount(flushesSet.size);

      // 3. Curing Metrics
      const activeCuring = (curingList as CuringBatch[]).filter(
        (b: CuringBatch) => b.status === 'firing' || b.status === 'loading'
      );
      setActiveBatchesCount(activeCuring.length);

      // 4. Stock & Inventory
      setExpendableStock(expendables);

      // 5. Equipment
      setEquipmentList(machinery);

      // 6. Activities
      const todayActs = (activities as FieldActivityEntry[]).filter((a: FieldActivityEntry) => a.date === todayFormatted);
      setTodayActivityCount(todayActs.length > 0 ? todayActs.length : activities.length);

      // 7. Monthly Expenses
      const totalExp = (expenses as ExpenseEntry[]).reduce((acc: number, e: ExpenseEntry) => acc + (Number(e.amount) || 0), 0);
      setMonthlyExpenseTotal(totalExp);
    } catch {
      // Offline fallback
    }
  }, [effectiveOrgId, selectedFarm, todayIso, todayFormatted]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Automatically refresh dashboard whenever returning to this tab
  useFocusEffect(
    useCallback(() => {
      loadMetrics();
    }, [loadMetrics])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMetrics();
    setRefreshing(false);
  };

  // Stock items of interest
  const petrolItem = expendableStock.find((i) => i.id === 'exp_petrol' || i.name.toLowerCase().includes('petrol'));
  const dieselItem = expendableStock.find((i) => i.id === 'exp_diesel' || i.name.toLowerCase().includes('diesel'));
  const oilItem = expendableStock.find((i) => i.id === 'exp_engine_oil' || i.name.toLowerCase().includes('oil'));

  const operationalEquipmentCount = equipmentList.filter((e) => e.status === 'operational').length;
  const inRepairEquipmentCount = equipmentList.filter(
    (e) => e.status === 'breakdown' || e.status === 'needsService'
  ).length;

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
        {/* EXECUTIVE HEADER & ESTATE PULSE */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? colors.card : '#F0FDF4',
              borderColor: isDark ? colors.cardBorder : '#BBF7D0',
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroSubtitle, { color: isDark ? colors.primaryLight : colors.primary }]}>
                {t('plantationMIS')}
              </Text>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                {translateUserText(selectedFarmOption.label)}
              </Text>
            </View>
            <View
              style={[
                styles.liveStatusPill,
                { backgroundColor: isDark ? '#14532D' : '#DCFCE7', borderColor: '#22C55E' },
              ]}
            >
              <View style={styles.greenPulseDot} />
              <Text style={[styles.liveStatusText, { color: isDark ? '#4ADE80' : '#15803D' }]}>
                {displayDate}
              </Text>
            </View>
          </View>
          <Text style={[styles.heroDescription, { color: colors.textMuted }]}>
            {selectedFarm === 'consolidated'
              ? (t('multiEstateSummary') || 'Multi-estate intelligence summary across all division blocks & facilities.')
              : (translateUserText(selectedFarmOption.description) || t('estateDivisionsMuster') || 'Estate divisions, muster audits & inventory.')}
          </Text>
        </View>

        {/* QUICK ACTION BUTTONS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('quickActions')}
          </Text>
        </View>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Attendance')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#14532D' : '#DCFCE7' }]}>
              <Ionicons name="people" size={18} color="#16A34A" />
            </View>
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              {t('markAttendance')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Harvest', { subTab: 'picking' })}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#78350F' : '#FEF3C7' }]}>
              <Ionicons name="basket" size={18} color="#D97706" />
            </View>
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              {t('logHarvest')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Expenses', { subTab: 'inventory' })}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE' }]}>
              <Ionicons name="funnel" size={18} color="#2563EB" />
            </View>
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              {t('logFuel')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Expenses', { subTab: 'expenses' })}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#4C1D95' : '#F3E8FF' }]}>
              <Ionicons name="wallet" size={18} color="#9333EA" />
            </View>
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              {t('logExpense')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* MIS EXECUTIVE CARDS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('todayOverview')}
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {/* CARD 1: ATTENDANCE */}
          <TouchableOpacity
            style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Attendance')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconBox, { backgroundColor: isDark ? '#14532D' : '#DCFCE7' }]}>
                  <Ionicons name="people-outline" size={20} color="#16A34A" />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('attendancePulse')}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                    {t('dailyLaborMustering') || 'Daily Labor Mustering'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>

            <View style={styles.metricsGrid}>
              <View style={[styles.metricTile, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]}>
                <Text style={[styles.metricValue, { color: colors.primary }]}>
                  {presentCount}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  {t('workersPresent')}
                </Text>
              </View>

              <View style={[styles.metricTile, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  ₹{totalWageCommitment.toLocaleString()}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  {t('dailyWageCommitment')}
                </Text>
              </View>
            </View>

            <Text style={[styles.cardFooterHint, { color: colors.primary }]}>
              {t('tapToView')}
            </Text>
          </TouchableOpacity>

          {/* CARD 2: HARVEST PICKING */}
          <TouchableOpacity
            style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Harvest', { subTab: 'picking' })}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconBox, { backgroundColor: isDark ? '#78350F' : '#FEF3C7' }]}>
                  <Ionicons name="basket-outline" size={20} color="#D97706" />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('harvestPulse')}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                    {t('freshGreenPickings') || 'Fresh Green Pickings & Tare'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>

            <View style={styles.metricsGrid}>
              <View style={[styles.metricTile, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]}>
                <Text style={[styles.metricValue, { color: '#D97706' }]}>
                  {todayHarvestKg > 0 ? `${todayHarvestKg.toFixed(1)} kg` : '0 kg'}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  {t('pickedTodayNet') || 'Picked Today (Net)'}
                </Text>
              </View>

              <View style={[styles.metricTile, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {activeFlushesCount}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  {t('flushesRecorded') || 'Flushes Recorded'}
                </Text>
              </View>
            </View>

            <Text style={[styles.cardFooterHint, { color: colors.primary }]}>
              {t('tapToView')}
            </Text>
          </TouchableOpacity>

          {/* CARD 3: CURING & DRYING */}
          <TouchableOpacity
            style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Harvest', { subTab: 'curing' })}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconBox, { backgroundColor: isDark ? '#831843' : '#FCE7F3' }]}>
                  <Ionicons name="flame-outline" size={20} color="#DB2777" />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('curingPulse')}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                    {t('dryerRunsPepperSolar') || 'Dryer Runs & Pepper Solar Yard'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>

            <View style={styles.metricsGrid}>
              <View style={[styles.metricTile, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]}>
                <Text style={[styles.metricValue, { color: '#DB2777' }]}>
                  {activeBatchesCount}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  {t('activeBatches')}
                </Text>
              </View>

              <View style={[styles.metricTile, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  20.5%
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  {t('avgOutturnBenchmark') || 'Avg Outturn Benchmark'}
                </Text>
              </View>
            </View>

            <Text style={[styles.cardFooterHint, { color: colors.primary }]}>
              {t('tapToView')}
            </Text>
          </TouchableOpacity>

          {/* CARD 4: FUEL & STOCK INVENTORY */}
          <TouchableOpacity
            style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Expenses', { subTab: 'inventory' })}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconBox, { backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE' }]}>
                  <Ionicons name="funnel-outline" size={20} color="#2563EB" />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('fuelStockPulse')}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                    {t('fuelTanksChemicalDrums') || 'Fuel Tanks & Chemical Drums'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>

            <View style={styles.stockChipsRow}>
              <View style={[styles.stockChip, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
                <Text style={[styles.stockChipLabel, { color: colors.textMuted }]}>{t('petrol') || 'Petrol'}</Text>
                <Text style={[styles.stockChipVal, { color: colors.text }]}>
                  {petrolItem?.currentStock || 0} L
                </Text>
              </View>

              <View style={[styles.stockChip, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
                <Text style={[styles.stockChipLabel, { color: colors.textMuted }]}>{t('diesel') || 'Diesel'}</Text>
                <Text style={[styles.stockChipVal, { color: colors.text }]}>
                  {dieselItem?.currentStock || 0} L
                </Text>
              </View>

              <View style={[styles.stockChip, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
                <Text style={[styles.stockChipLabel, { color: colors.textMuted }]}>{t('engineOil') || 'Engine Oil'}</Text>
                <Text style={[styles.stockChipVal, { color: colors.text }]}>
                  {oilItem?.currentStock || 0} L
                </Text>
              </View>
            </View>

            <Text style={[styles.cardFooterHint, { color: colors.primary }]}>
              {t('tapToView')}
            </Text>
          </TouchableOpacity>

          {/* CARD 5: MACHINERY & MUSTER */}
          <TouchableOpacity
            style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Expenses', { subTab: 'equipment' })}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconBox, { backgroundColor: isDark ? '#312E81' : '#E0E7FF' }]}>
                  <Ionicons name="hardware-chip-outline" size={20} color="#4F46E5" />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('equipmentHealthPulse')}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                    {t('assetRegistryMuster') || 'Asset Registry & Physical Muster'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>

            <View style={styles.metricsGrid}>
              <View style={[styles.metricTile, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]}>
                <Text style={[styles.metricValue, { color: '#16A34A' }]}>
                  {operationalEquipmentCount}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  {t('operational') || 'Operational'}
                </Text>
              </View>

              <View style={[styles.metricTile, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]}>
                <Text
                  style={[
                    styles.metricValue,
                    { color: inRepairEquipmentCount > 0 ? '#DC2626' : colors.text },
                  ]}
                >
                  {inRepairEquipmentCount}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  {t('needsService') || 'Needs Service / Repair'}
                </Text>
              </View>
            </View>

            <Text style={[styles.cardFooterHint, { color: colors.primary }]}>
              {t('tapToView')}
            </Text>
          </TouchableOpacity>

          {/* CARD 6: FIELD ACTIVITIES */}
          <TouchableOpacity
            style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Activity')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconBox, { backgroundColor: isDark ? '#064E3B' : '#CCFBF1' }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#0D9488" />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('fieldActivitiesPulse')}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                    {t('weedingSprayingShade') || 'Weeding, Spraying, Shade & Pruning'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>

            <View style={styles.metricsGrid}>
              <View style={[styles.metricTile, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]}>
                <Text style={[styles.metricValue, { color: '#0D9488' }]}>
                  {todayActivityCount}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  {t('tasksLogged') || 'Tasks Logged'}
                </Text>
              </View>

              <View style={[styles.metricTile, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {t('active') || 'Active'}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  {t('estateCompliance') || 'Estate Compliance'}
                </Text>
              </View>
            </View>

            <Text style={[styles.cardFooterHint, { color: colors.primary }]}>
              {t('tapToView')}
            </Text>
          </TouchableOpacity>

          {/* CARD 7: EXPENSES & CASH FLOW */}
          <TouchableOpacity
            style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Expenses', { subTab: 'expenses' })}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconBox, { backgroundColor: isDark ? '#4C1D95' : '#F3E8FF' }]}>
                  <Ionicons name="wallet-outline" size={20} color="#9333EA" />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('expensePulse')}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                    {t('operationalLedgerCostPerAcre') || 'Operational Ledger & Cost per Acre'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>

            <View style={styles.metricsGrid}>
              <View style={[styles.metricTile, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]}>
                <Text style={[styles.metricValue, { color: '#9333EA' }]}>
                  ₹{monthlyExpenseTotal.toLocaleString()}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  {t('recordedExpenditure') || 'Recorded Expenditure'}
                </Text>
              </View>

              <View style={[styles.metricTile, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]}>
                <Text style={[styles.metricValue, { color: '#16A34A' }]}>
                  {t('allModes') || 'All Modes'}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  {t('upiCashBank') || 'UPI, Cash & Bank'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Expenses', { subTab: 'income' })}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  paddingVertical: 7,
                  borderRadius: 8,
                  backgroundColor: '#05966915',
                  borderWidth: 1,
                  borderColor: '#05966940',
                }}
              >
                <Ionicons name="wallet-outline" size={13} color="#059669" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>
                  {t('incomeAndReceiptsBtn') || 'Income & Receipts'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Expenses', { subTab: 'pnl' })}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  paddingVertical: 7,
                  borderRadius: 8,
                  backgroundColor: '#3B82F615',
                  borderWidth: 1,
                  borderColor: '#3B82F640',
                }}
              >
                <Ionicons name="stats-chart-outline" size={13} color="#3B82F6" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#3B82F6' }}>
                  {t('pnlAnalysis') || 'P&L Statement'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.cardFooterHint, { color: colors.primary, marginTop: 6 }]}>
              {t('tapToView')}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  liveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  liveStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeader: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardsContainer: {
    paddingHorizontal: 16,
    gap: 14,
  },
  kpiCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricTile: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    gap: 4,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  stockChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stockChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    gap: 2,
  },
  stockChipLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  stockChipVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardFooterHint: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});
