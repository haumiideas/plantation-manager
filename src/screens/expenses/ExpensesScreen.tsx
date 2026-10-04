import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import {
  PeriodType,
  FULL_MONTH_NAMES,
  parseEstateDate,
  isDateInPeriod,
} from '../../utils/date';
import { ExpenseEntry, ExpenseCategory } from '../../types/expense';
import { IncomeEntry, IncomeCategory } from '../../types/income';
import {
  ExpendableItem,
  ConsumptionEntry,
  FarmEquipment,
  EquipmentMuster,
} from '../../types/equipment';
import {
  getExpenses,
  saveExpense,
  deleteExpense,
  filterExpenses,
  calculateExpenseMetrics,
} from '../../services/expenseService';
import {
  getIncomeEntries,
  saveIncomeEntry,
  deleteIncomeEntry,
  calculateTotalIncome,
} from '../../services/incomeService';
import {
  getExpendableItems,
  saveExpendableItem,
  getConsumptionEntries,
  logConsumption,
  getFarmEquipment,
  saveEquipment,
  deleteEquipment,
  getEquipmentMusters,
  saveEquipmentMuster,
} from '../../services/equipmentService';
import { getAcreageForFarm } from '../../services/farmService';
import { PeriodSelectorBar } from '../../components/expenses/PeriodSelectorBar';
import { ExpenseSummaryBar } from '../../components/expenses/ExpenseSummaryBar';
import { ExpenseCard } from '../../components/expenses/ExpenseCard';
import { LogExpenseModal } from '../../components/expenses/LogExpenseModal';
import { LogIncomeModal } from '../../components/income/LogIncomeModal';
import { BuyerReceiptModal } from '../../components/income/BuyerReceiptModal';
import { ReportExportModal } from '../../components/export/ReportExportModal';
import { ExpendablesInventoryCard } from '../../components/equipment/ExpendablesInventoryCard';
import { LogConsumptionModal } from '../../components/equipment/LogConsumptionModal';
import { EquipmentRegistryCard } from '../../components/equipment/EquipmentRegistryCard';
import { EquipmentMusterModal } from '../../components/equipment/EquipmentMusterModal';
import { ThemedConfirmModal } from '../../components/common/ThemedConfirmModal';

type SubTab = 'expenses' | 'income' | 'pnl' | 'inventory' | 'equipment';

interface ExpensesScreenProps {
  route?: { params?: { subTab?: SubTab } };
}

const CATEGORIES: { id: string; labelKey: string }[] = [
  { id: 'all', labelKey: 'all' },
  { id: 'fuel', labelKey: 'fuel' },
  { id: 'labor', labelKey: 'labor' },
  { id: 'fertilizer', labelKey: 'fertilizer' },
  { id: 'chemicals', labelKey: 'chemicals' },
  { id: 'maintenance', labelKey: 'maintenance' },
  { id: 'packaging', labelKey: 'packaging' },
  { id: 'curingRental', labelKey: 'curingRental' },
  { id: 'infrastructure', labelKey: 'infrastructure' },
  { id: 'adminMisc', labelKey: 'adminMisc' },
];

const INCOME_CAT_META: Record<
  IncomeCategory,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  produce_sale: { label: 'Produce Sale', icon: 'cart', color: '#10B981' },
  farm_tour: { label: 'Farm Tour Fee', icon: 'camera', color: '#14B8A6' },
  educational_visit: { label: 'Educational Program', icon: 'school', color: '#8B5CF6' },
  scrap_sale: { label: 'Scrap & Waste Sale', icon: 'trash', color: '#F59E0B' },
  curing_rental: { label: 'Curing Service Fee', icon: 'business', color: '#3B82F6' },
  consulting_honorarium: { label: 'Advisory Fee', icon: 'ribbon', color: '#6366F1' },
  other_income: { label: 'Miscellaneous', icon: 'cash', color: '#64748B' },
};

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({ route }) => {
  const { colors, isDark } = useTheme();
  const { selectedFarm, selectedFarmOption } = useFarm();
  const { orgId } = useAuth();
  const { t, translateUserText } = useLanguage();
  const effectiveOrgId = orgId || 'plantation_org_namari_adukidathan';

  // Sub-tabs: 'expenses' | 'income' | 'pnl' | 'inventory' | 'equipment'
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(
    route?.params?.subTab || 'expenses'
  );

  useEffect(() => {
    if (route?.params?.subTab) {
      setActiveSubTab(route.params.subTab);
    }
  }, [route?.params?.subTab]);

  // Period state
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('monthly');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [expendables, setExpendables] = useState<ExpendableItem[]>([]);
  const [consumptionLogs, setConsumptionLogs] = useState<ConsumptionEntry[]>([]);
  const [equipmentList, setEquipmentList] = useState<FarmEquipment[]>([]);
  const [musters, setMusters] = useState<EquipmentMuster[]>([]);
  const [farmAcreage, setFarmAcreage] = useState(25);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProfitMasked, setIsProfitMasked] = useState(true);

  // Modals state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDefaultHead, setExportDefaultHead] = useState<'expenses' | 'income' | 'consolidated'>('expenses');
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [preselectedConsumeItemId, setPreselectedConsumeItemId] = useState<string | undefined>(undefined);
  const [showMusterModal, setShowMusterModal] = useState(false);
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<ExpenseEntry | null>(null);
  const [deleteIncomeTarget, setDeleteIncomeTarget] = useState<IncomeEntry | null>(null);
  const [selectedReceiptEntry, setSelectedReceiptEntry] = useState<IncomeEntry | null>(null);

  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [expList, incList, invList, cnsList, eqList, mstList, acreage] = await Promise.all([
        getExpenses(effectiveOrgId),
        getIncomeEntries(effectiveOrgId, selectedFarm),
        getExpendableItems(effectiveOrgId),
        getConsumptionEntries(effectiveOrgId),
        getFarmEquipment(effectiveOrgId),
        getEquipmentMusters(effectiveOrgId),
        getAcreageForFarm(effectiveOrgId, selectedFarm),
      ]);

      setExpenses(expList);
      setIncomes(incList);
      setExpendables(invList);
      setConsumptionLogs(cnsList);
      setEquipmentList(eqList);
      setMusters(mstList);
      setFarmAcreage(acreage || 25);
    } finally {
      setIsRefreshing(false);
    }
  }, [effectiveOrgId, selectedFarm]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return filterExpenses(expenses, {
      farmId: selectedFarm,
      cropId: selectedCrop,
      category: selectedCategory,
      search: searchQuery,
      period: selectedPeriod,
      referenceDate,
    });
  }, [expenses, selectedFarm, selectedCrop, selectedCategory, searchQuery, selectedPeriod, referenceDate]);

  // Grouped expenses by Month & Year
  const groupedExpenses = useMemo(() => {
    const map: Record<string, { monthYear: string; total: number; entries: ExpenseEntry[] }> = {};
    const order: string[] = [];

    filteredExpenses.forEach((entry) => {
      const d = parseEstateDate(entry.date) || new Date();
      const my = `${FULL_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      if (!map[my]) {
        map[my] = { monthYear: my, total: 0, entries: [] };
        order.push(my);
      }
      map[my].entries.push(entry);
      map[my].total += Number(entry.amount) || 0;
    });

    return order.map((key) => map[key]);
  }, [filteredExpenses]);

  // Filtered incomes
  const filteredIncomes = useMemo(() => {
    return incomes.filter((i) => {
      const inPeriod = isDateInPeriod(i.date, selectedPeriod, referenceDate);
      if (!inPeriod) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = i.title.toLowerCase().includes(q);
        const matchPayer = i.payerName.toLowerCase().includes(q);
        const matchRec = i.receiptNumber ? i.receiptNumber.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchPayer && !matchRec) return false;
      }
      return true;
    });
  }, [incomes, selectedPeriod, referenceDate, searchQuery]);

  // Grouped incomes by Month & Year
  const groupedIncomes = useMemo(() => {
    const map: Record<string, { monthYear: string; total: number; entries: IncomeEntry[] }> = {};
    const order: string[] = [];

    filteredIncomes.forEach((entry) => {
      const d = parseEstateDate(entry.date) || new Date();
      const my = `${FULL_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      if (!map[my]) {
        map[my] = { monthYear: my, total: 0, entries: [] };
        order.push(my);
      }
      map[my].entries.push(entry);
      map[my].total += Number(entry.amount) || 0;
    });

    return order.map((key) => map[key]);
  }, [filteredIncomes]);

  // Financial totals for active period
  const totalPeriodSpend = useMemo(() => {
    return filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalPeriodIncome = useMemo(() => {
    return calculateTotalIncome(filteredIncomes);
  }, [filteredIncomes]);

  const netPeriodProfit = totalPeriodIncome - totalPeriodSpend;
  const isPeriodProfitable = netPeriodProfit >= 0;

  // Expense metrics
  const metrics = useMemo(() => {
    return calculateExpenseMetrics(filteredExpenses, farmAcreage);
  }, [filteredExpenses, farmAcreage]);

  // Handlers
  const handleSaveExpense = async (entry: ExpenseEntry, replenishStock: boolean) => {
    const updated = await saveExpense(effectiveOrgId, entry, replenishStock);
    setExpenses(updated);
    const updatedInv = await getExpendableItems(effectiveOrgId);
    setExpendables(updatedInv);
    setEditingExpense(null);
  };

  const handleSaveMultipleExpenses = async (entries: ExpenseEntry[], replenishStock: boolean) => {
    let currentExp: ExpenseEntry[] = [];
    for (const entry of entries) {
      currentExp = await saveExpense(effectiveOrgId, entry, replenishStock);
    }
    setExpenses(currentExp);
    const updatedInv = await getExpendableItems(effectiveOrgId);
    setExpendables(updatedInv);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (id: string) => {
    const updated = await deleteExpense(effectiveOrgId, id);
    setExpenses(updated);
  };

  const handleSaveIncome = async (entry: Omit<IncomeEntry, 'id' | 'createdAt'> & { id?: string }) => {
    await saveIncomeEntry(effectiveOrgId, entry);
    const updated = await getIncomeEntries(effectiveOrgId, selectedFarm);
    setIncomes(updated);
    setEditingIncome(null);
  };

  const handleDeleteIncome = async (id: string) => {
    await deleteIncomeEntry(effectiveOrgId, id);
    setIncomes((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddExpendable = async (item: ExpendableItem) => {
    const updated = await saveExpendableItem(effectiveOrgId, item);
    setExpendables(updated);
  };

  const handleSaveConsumption = async (entryData: {
    date: string;
    itemId: string;
    machineId: string;
    quantityConsumed: number;
    operatorName?: string;
    purpose?: string;
  }) => {
    await logConsumption(effectiveOrgId, entryData);
    const [inv, cns, eq] = await Promise.all([
      getExpendableItems(effectiveOrgId),
      getConsumptionEntries(effectiveOrgId),
      getFarmEquipment(effectiveOrgId),
    ]);
    setExpendables(inv);
    setConsumptionLogs(cns);
    setEquipmentList(eq);
  };

  const handleAddEquipment = async (eq: FarmEquipment) => {
    const updated = await saveEquipment(effectiveOrgId, eq);
    setEquipmentList(updated);
  };

  const handleEditEquipment = async (eq: FarmEquipment) => {
    const updated = await saveEquipment(effectiveOrgId, eq);
    setEquipmentList(updated);
  };

  const handleDeleteEquipment = async (id: string) => {
    const updated = await deleteEquipment(effectiveOrgId, id);
    setEquipmentList(updated);
  };

  const handleSaveMuster = async (muster: EquipmentMuster) => {
    const updated = await saveEquipmentMuster(effectiveOrgId, muster);
    setMusters(updated);
  };

  return (
    <ScreenContainer header={<AppHeader />}>
      {/* 5-SubTab Segmented Top Navigation Bar */}
      <View
        style={[
          styles.subTabBarWrapper,
          { backgroundColor: colors.card, borderBottomColor: colors.cardBorder },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subTabBarScroll}
        >
          {/* SubTab 1: Expense Ledger */}
          <TouchableOpacity
            onPress={() => setActiveSubTab('expenses')}
            style={[
              styles.subTabPill,
              {
                backgroundColor: activeSubTab === 'expenses' ? colors.primary : colors.surfaceSubtle,
                borderColor: activeSubTab === 'expenses' ? colors.primary : colors.cardBorder,
              },
            ]}
          >
            <Ionicons
              name="receipt-outline"
              size={14}
              color={activeSubTab === 'expenses' ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              style={[
                styles.subTabPillText,
                {
                  color: activeSubTab === 'expenses' ? '#FFFFFF' : colors.text,
                  fontWeight: activeSubTab === 'expenses' ? '800' : '600',
                },
              ]}
            >
              {t('expenseLedgerTab')}
            </Text>
          </TouchableOpacity>

          {/* SubTab 2: Income & Receipts */}
          <TouchableOpacity
            onPress={() => setActiveSubTab('income')}
            style={[
              styles.subTabPill,
              {
                backgroundColor: activeSubTab === 'income' ? colors.primary : colors.surfaceSubtle,
                borderColor: activeSubTab === 'income' ? colors.primary : colors.cardBorder,
              },
            ]}
          >
            <Ionicons
              name="wallet-outline"
              size={14}
              color={activeSubTab === 'income' ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              style={[
                styles.subTabPillText,
                {
                  color: activeSubTab === 'income' ? '#FFFFFF' : colors.text,
                  fontWeight: activeSubTab === 'income' ? '800' : '600',
                },
              ]}
            >
              {t('incomeAndReceipts')}
            </Text>
          </TouchableOpacity>

          {/* SubTab 3: P&L Statement */}
          <TouchableOpacity
            onPress={() => setActiveSubTab('pnl')}
            style={[
              styles.subTabPill,
              {
                backgroundColor: activeSubTab === 'pnl' ? colors.primary : colors.surfaceSubtle,
                borderColor: activeSubTab === 'pnl' ? colors.primary : colors.cardBorder,
              },
            ]}
          >
            <Ionicons
              name="stats-chart-outline"
              size={14}
              color={activeSubTab === 'pnl' ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              style={[
                styles.subTabPillText,
                {
                  color: activeSubTab === 'pnl' ? '#FFFFFF' : colors.text,
                  fontWeight: activeSubTab === 'pnl' ? '800' : '600',
                },
              ]}
            >
              {t('pnlStatementTab')}
            </Text>
          </TouchableOpacity>

          {/* SubTab 4: Fuel & Stock */}
          <TouchableOpacity
            onPress={() => setActiveSubTab('inventory')}
            style={[
              styles.subTabPill,
              {
                backgroundColor: activeSubTab === 'inventory' ? colors.primary : colors.surfaceSubtle,
                borderColor: activeSubTab === 'inventory' ? colors.primary : colors.cardBorder,
              },
            ]}
          >
            <Ionicons
              name="speedometer-outline"
              size={14}
              color={activeSubTab === 'inventory' ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              style={[
                styles.subTabPillText,
                {
                  color: activeSubTab === 'inventory' ? '#FFFFFF' : colors.text,
                  fontWeight: activeSubTab === 'inventory' ? '800' : '600',
                },
              ]}
            >
              {t('fuelAndStock')}
            </Text>
          </TouchableOpacity>

          {/* SubTab 5: Assets & Muster */}
          <TouchableOpacity
            onPress={() => setActiveSubTab('equipment')}
            style={[
              styles.subTabPill,
              {
                backgroundColor: activeSubTab === 'equipment' ? colors.primary : colors.surfaceSubtle,
                borderColor: activeSubTab === 'equipment' ? colors.primary : colors.cardBorder,
              },
            ]}
          >
            <Ionicons
              name="hardware-chip-outline"
              size={14}
              color={activeSubTab === 'equipment' ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              style={[
                styles.subTabPillText,
                {
                  color: activeSubTab === 'equipment' ? '#FFFFFF' : colors.text,
                  fontWeight: activeSubTab === 'equipment' ? '800' : '600',
                },
              ]}
            >
              {t('assetsAndMuster')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={loadAllData} />}
      >
        {/* ================= SUBTAB 1: EXPENSE LEDGER ================= */}
        {activeSubTab === 'expenses' && (
          <View style={styles.tabContent}>
            {/* Period Selector Bar */}
            <PeriodSelectorBar
              selectedPeriod={selectedPeriod}
              referenceDate={referenceDate}
              onSelectPeriod={setSelectedPeriod}
              onChangeReferenceDate={setReferenceDate}
            />

            {/* Expense Summary KPI Bar */}
            <ExpenseSummaryBar metrics={metrics} farmLabel={selectedFarmOption.label} />

            {/* Action Bar: Add Expense + Export */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => {
                  setEditingExpense(null);
                  setShowExpenseModal(true);
                }}
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>{t('addExpense')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setExportDefaultHead('expenses');
                  setShowExportModal(true);
                }}
                style={[
                  styles.exportHeadBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                ]}
              >
                <Ionicons name="download-outline" size={15} color={colors.primary} />
                <Text style={[styles.exportHeadBtnText, { color: colors.primary }]}>
                  {t('exportExcelPdf')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View
              style={[
                styles.searchBox,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Ionicons name="search" size={15} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t('searchExpensesPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={15} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Category Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                {CATEGORIES.map((cat) => {
                  const isSel = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.id)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isSel ? colors.primary : colors.surfaceSubtle,
                          borderColor: isSel ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: isSel ? '#FFFFFF' : colors.text,
                            fontWeight: isSel ? '700' : '500',
                          },
                        ]}
                      >
                        {t(cat.labelKey as any) || cat.id}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Month & Year Grouped Expenses List */}
            {groupedExpenses.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {t('noExpensesRecorded')}
                </Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  {t('tapLogExpenseDesc')}
                </Text>
              </View>
            ) : (
              groupedExpenses.map((group) => (
                <View key={group.monthYear} style={{ marginBottom: 14 }}>
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
                          {group.entries.length} {t('itemsCount')}
                        </Text>
                      </View>
                      <Text style={[styles.monthTotalSpend, { color: colors.danger }]}>
                        ₹{group.total.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Expense Items in Month */}
                  {group.entries.map((entry) => (
                    <ExpenseCard
                      key={entry.id}
                      entry={entry}
                      onEdit={(e) => {
                        setEditingExpense(e);
                        setShowExpenseModal(true);
                      }}
                      onDelete={() => setDeleteExpenseTarget(entry)}
                    />
                  ))}
                </View>
              ))
            )}
          </View>
        )}

        {/* ================= SUBTAB 2: INCOME & RECEIPTS ================= */}
        {activeSubTab === 'income' && (
          <View style={styles.tabContent}>
            {/* Period Selector Bar */}
            <PeriodSelectorBar
              selectedPeriod={selectedPeriod}
              referenceDate={referenceDate}
              onSelectPeriod={setSelectedPeriod}
              onChangeReferenceDate={setReferenceDate}
            />

            {/* Income Pulse Summary Card */}
            <View
              style={[
                styles.incomePulseCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={[styles.incomePulseLabel, { color: colors.textMuted }]}>
                    {t('totalRealizedRevenue')}
                  </Text>
                  <Text style={[styles.incomePulseTotal, { color: '#059669' }]}>
                    ₹{totalPeriodIncome.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.incomePulseBadge, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
                  <Ionicons name="trending-up" size={14} color="#059669" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>
                    {filteredIncomes.length} {t('receiptsCount')}
                  </Text>
                </View>
              </View>

              {/* Category Mini Pulse Breakdown */}
              <View style={styles.incomeCatGrid}>
                {(['produce_sale', 'curing_rental', 'farm_tour', 'scrap_sale'] as IncomeCategory[]).map((cat) => {
                  const meta = INCOME_CAT_META[cat];
                  const catTotal = filteredIncomes
                    .filter((i) => i.category === cat)
                    .reduce((s, i) => s + (Number(i.amount) || 0), 0);
                  return (
                    <View
                      key={cat}
                      style={[
                        styles.incomeCatMiniCard,
                        { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name={meta.icon} size={11} color={meta.color} />
                        <Text style={[styles.incomeCatMiniTitle, { color: colors.textMuted }]} numberOfLines={1}>
                          {translateUserText(meta.label)}
                        </Text>
                      </View>
                      <Text style={[styles.incomeCatMiniAmt, { color: colors.text }]}>
                        ₹{catTotal.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Action Bar: Log Income + Export */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => {
                  setEditingIncome(null);
                  setShowIncomeModal(true);
                }}
                style={[styles.addBtn, { backgroundColor: '#059669' }]}
              >
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>{t('logFarmIncome')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setExportDefaultHead('income');
                  setShowExportModal(true);
                }}
                style={[
                  styles.exportHeadBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                ]}
              >
                <Ionicons name="download-outline" size={15} color={colors.primary} />
                <Text style={[styles.exportHeadBtnText, { color: colors.primary }]}>
                  {t('exportExcelPdf')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View
              style={[
                styles.searchBox,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Ionicons name="search" size={15} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t('searchIncomePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={15} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Month & Year Grouped Incomes List */}
            {groupedIncomes.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Ionicons name="wallet-outline" size={36} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {t('noIncomeReceiptsPeriod')}
                </Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  {t('tapLogIncomeDesc')}
                </Text>
              </View>
            ) : (
              groupedIncomes.map((group) => (
                <View key={group.monthYear} style={{ marginBottom: 14 }}>
                  {/* Month Header Banner */}
                  <View
                    style={[
                      styles.monthHeaderRow,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="calendar" size={14} color="#059669" />
                      <Text style={[styles.monthHeaderText, { color: colors.text }]}>
                        {group.monthYear}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <View style={[styles.countPill, { backgroundColor: colors.card }]}>
                        <Text style={[styles.countPillText, { color: colors.textMuted }]}>
                          {group.entries.length} {t('receiptsCount')}
                        </Text>
                      </View>
                      <Text style={[styles.monthTotalSpend, { color: '#059669' }]}>
                        +₹{group.total.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Income Cards in Month */}
                  {group.entries.map((income) => {
                    const catMeta = INCOME_CAT_META[income.category] || INCOME_CAT_META.other_income;
                    return (
                      <View
                        key={income.id}
                        style={[
                          styles.incomeCard,
                          { backgroundColor: colors.card, borderColor: colors.cardBorder },
                        ]}
                      >
                        {/* Top Line: Cat Icon (26x26) + Title + Category Badge + Amount */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                            <View style={[styles.catIconWrap, { backgroundColor: `${catMeta.color}15` }]}>
                              <Ionicons name={catMeta.icon} size={14} color={catMeta.color} />
                            </View>
                            <Text style={[styles.incomeCardTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                              {translateUserText(income.title)}
                            </Text>
                            <View
                              style={[
                                styles.catBadge,
                                { backgroundColor: `${catMeta.color}15`, borderColor: `${catMeta.color}30` },
                              ]}
                            >
                              <Text style={[styles.catBadgeText, { color: catMeta.color }]}>
                                {translateUserText(catMeta.label)}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.incomeCardAmount, { color: Number(income.amount || 0) === 0 ? colors.textMuted : '#059669' }]}>
                            {Number(income.amount || 0) === 0
                              ? t('freeComplimentaryShort')
                              : `+₹${Number(income.amount || 0).toLocaleString('en-IN')}`}
                          </Text>
                        </View>

                        {/* Mid Section: Payer & Produce Particulars */}
                        <View style={{ marginTop: 6, gap: 3 }}>
                          <Text style={[styles.incomePayerText, { color: colors.textMuted }]}>
                            👤 {income.payerName} {income.payerPhone ? `(${income.payerPhone})` : ''}
                          </Text>
                          {(income.produceCrop || income.produceWeightKg) ? (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                🌱 {translateUserText(income.produceCrop || 'Cardamom')}
                                {income.produceGrade ? ` • ${income.produceGrade}` : ''}
                              </Text>
                              {income.produceWeightKg ? (
                                <Text style={{ fontSize: 11, color: colors.textMuted }}>
                                  ⚖️ {income.produceWeightKg} kg
                                  {income.produceRatePerKg ? ` @ ₹${income.produceRatePerKg}/kg` : ''}
                                </Text>
                              ) : null}
                            </View>
                          ) : null}
                        </View>

                        {/* Bottom Row: Metadata & Actions */}
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 8,
                            paddingTop: 8,
                            borderTopWidth: 1,
                            borderTopColor: colors.border,
                          }}
                        >
                          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                            <Text style={[styles.incomeDateText, { color: colors.textMuted }]}>
                              📅 {income.date}
                            </Text>
                            <Text style={[styles.incomeDateText, { color: colors.textMuted }]}>
                              💳 {income.paymentMode.toUpperCase()}
                            </Text>
                            {income.receiptNumber && (
                              <Text style={[styles.incomeDateText, { color: colors.primary, fontWeight: '700' }]}>
                                #{income.receiptNumber}
                              </Text>
                            )}
                          </View>

                          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                            <TouchableOpacity
                              onPress={() => setSelectedReceiptEntry(income)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                backgroundColor: '#10B98115',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: '#10B98130',
                              }}
                            >
                              <Ionicons name="receipt-outline" size={13} color="#059669" />
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>
                                {t('receiptBtn')}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => {
                                setEditingIncome(income);
                                setShowIncomeModal(true);
                              }}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                backgroundColor: colors.surfaceSubtle,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: colors.cardBorder,
                              }}
                            >
                              <Ionicons name="pencil-outline" size={13} color={colors.text} />
                              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>
                                {t('edit')}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => setDeleteIncomeTarget(income)}
                              style={{
                                paddingHorizontal: 6,
                                paddingVertical: 4,
                                borderRadius: 6,
                                backgroundColor: '#EF444415',
                                borderWidth: 1,
                                borderColor: '#EF444430',
                              }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="trash-outline" size={13} color={colors.danger} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </View>
        )}

        {/* ================= SUBTAB 3: P&L STATEMENT ================= */}
        {activeSubTab === 'pnl' && (
          <View style={styles.tabContent}>
            {/* Period Selector Bar */}
            <PeriodSelectorBar
              selectedPeriod={selectedPeriod}
              referenceDate={referenceDate}
              onSelectPeriod={setSelectedPeriod}
              onChangeReferenceDate={setReferenceDate}
            />

            {/* Executive Profit & Loss Card */}
            <View
              style={[
                styles.pnlExecutiveCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.pnlHeaderTitle, { color: colors.text }]}>
                {t('executivePnlTitle')}
              </Text>
              <Text style={[styles.pnlHeaderSubtitle, { color: colors.textMuted }]}>
                {selectedFarmOption.label} • {t('consolidatedOperatingPerformance')}
              </Text>

              {/* Net Margin Highlight Box */}
              <View
                style={[
                  styles.netMarginBox,
                  {
                    backgroundColor: isPeriodProfitable ? '#05966915' : '#DC262615',
                    borderColor: isPeriodProfitable ? '#05966940' : '#DC262640',
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.netMarginLabel, { color: colors.textMuted }]}>
                      {t(isPeriodProfitable ? 'netOperatingProfit' : 'netOperatingDeficit')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setIsProfitMasked(!isProfitMasked)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={isProfitMasked ? 'eye-off-outline' : 'eye-outline'}
                        size={15}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setIsProfitMasked(!isProfitMasked)}
                  >
                    <Text
                      style={[
                        styles.netMarginAmount,
                        { color: isPeriodProfitable ? '#059669' : '#DC2626' },
                      ]}
                    >
                      {isProfitMasked
                        ? '****'
                        : `${isPeriodProfitable ? '+' : '-'}₹${Math.abs(netPeriodProfit).toLocaleString('en-IN')}`}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isPeriodProfitable ? '#059669' : '#DC2626',
                    },
                  ]}
                >
                  <Ionicons
                    name={isPeriodProfitable ? 'arrow-up' : 'arrow-down'}
                    size={13}
                    color="#FFFFFF"
                  />
                  <Text style={styles.statusBadgeText}>
                    {t(isPeriodProfitable ? 'profitBadge' : 'deficitBadge')}
                  </Text>
                </View>
              </View>

              {/* Inflow vs Outflow Mini Cards */}
              <View style={styles.pnlInflowOutflowRow}>
                <View
                  style={[
                    styles.pnlInflowCard,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="arrow-down-circle" size={16} color="#059669" />
                    <Text style={[styles.pnlMiniLabel, { color: colors.textMuted }]}>
                      {t('totalRevenueInflow')}
                    </Text>
                  </View>
                  <Text style={[styles.pnlMiniValue, { color: '#059669' }]}>
                    ₹{totalPeriodIncome.toLocaleString('en-IN')}
                  </Text>
                  <Text style={[styles.pnlMiniSub, { color: colors.textMuted }]}>
                    {filteredIncomes.length} {t('salesAndReceipts')}
                  </Text>
                </View>

                <View
                  style={[
                    styles.pnlInflowCard,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="arrow-up-circle" size={16} color="#DC2626" />
                    <Text style={[styles.pnlMiniLabel, { color: colors.textMuted }]}>
                      {t('operatingExpenses')}
                    </Text>
                  </View>
                  <Text style={[styles.pnlMiniValue, { color: '#DC2626' }]}>
                    ₹{totalPeriodSpend.toLocaleString('en-IN')}
                  </Text>
                  <Text style={[styles.pnlMiniSub, { color: colors.textMuted }]}>
                    {filteredExpenses.length} {t('vouchers')}
                  </Text>
                </View>
              </View>

              {/* Export Full Financial Report Button */}
              <TouchableOpacity
                onPress={() => {
                  setExportDefaultHead('consolidated');
                  setShowExportModal(true);
                }}
                style={[styles.exportPnlBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="document-text" size={16} color="#FFFFFF" />
                <Text style={styles.exportPnlBtnText}>
                  {t('exportConsolidatedPnlBtn')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category Breakdown Comparison Bars */}
            <View
              style={[
                styles.breakdownCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.breakdownTitle, { color: colors.text }]}>
                {t('operatingSpendByCategory')}
              </Text>
              {metrics.categoryBreakdown.map((item) => (
                <View key={item.category} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={[styles.catNameText, { color: colors.text }]}>
                      {t(item.category as any) || item.category}
                    </Text>
                    <Text style={[styles.catAmtText, { color: colors.textMuted }]}>
                      ₹{item.amount.toLocaleString('en-IN')} ({item.percentage}%)
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(item.percentage, 100)}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ================= SUBTAB 4: INVENTORY & FUEL ================= */}
        {activeSubTab === 'inventory' && (
          <View style={styles.tabContent}>
            {/* Expendables Inventory Stock Cards */}
            <ExpendablesInventoryCard
              items={expendables}
              onAddItem={handleAddExpendable}
              onOpenLogConsumption={(itemId?: string) => {
                setPreselectedConsumeItemId(itemId);
                setShowConsumptionModal(true);
              }}
              orgId={effectiveOrgId}
            />

            {/* Quick Action: Log Consumption */}
            <TouchableOpacity
              onPress={() => {
                setPreselectedConsumeItemId(undefined);
                setShowConsumptionModal(true);
              }}
              style={[styles.consumeActionBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="flame" size={18} color="#FFFFFF" />
              <Text style={styles.consumeActionBtnText}>{t('logConsumption')}</Text>
            </TouchableOpacity>

            {/* Consumption History List */}
            {consumptionLogs.length > 0 && (
              <View
                style={[
                  styles.historyCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.historyHeader}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                  <Text style={[styles.historyTitle, { color: colors.text }]}>
                    {t('recentFuelConsumption' as any) || 'Recent Fuel Consumption'}
                  </Text>
                </View>
                {consumptionLogs.slice(0, 10).map((log) => {
                  const item = expendables.find((i) => i.id === log.itemId);
                  const equip = equipmentList.find((e) => e.id === log.machineId);
                  return (
                    <View
                      key={log.id}
                      style={[styles.logRow, { borderTopColor: colors.cardBorder }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.logMachine, { color: colors.text }]}>
                          {equip?.name || log.machineId}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <View
                            style={[
                              styles.itemPill,
                              { backgroundColor: isDark ? '#1C2D22' : '#DCFCE7' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.itemPillText,
                                { color: isDark ? colors.primaryLight : colors.primary },
                              ]}
                            >
                              {item?.name || log.itemId}
                            </Text>
                          </View>
                          {log.purpose && (
                            <Text style={[styles.logPurpose, { color: colors.textMuted }]} numberOfLines={1}>
                              {log.purpose}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.logAmount, { color: colors.danger }]}>
                          -{log.quantityConsumed} {item?.unit || 'L'}
                        </Text>
                        <Text style={[styles.logDate, { color: colors.textMuted }]}>
                          {log.date}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ================= SUBTAB 5: EQUIPMENT & ASSETS ================= */}
        {activeSubTab === 'equipment' && (
          <View style={styles.tabContent}>
            {/* Farm Equipment Registry Card */}
            <EquipmentRegistryCard
              equipmentList={equipmentList}
              onAddEquipment={handleAddEquipment}
              onEditEquipment={handleEditEquipment}
              onDeleteEquipment={handleDeleteEquipment}
              onOpenMusterModal={() => setShowMusterModal(true)}
              orgId={effectiveOrgId}
            />
          </View>
        )}
      </ScrollView>

      {/* MODALS */}
      {/* 1. Log / Edit Expense Modal */}
      <LogExpenseModal
        visible={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        onSaveMultiple={handleSaveMultipleExpenses}
        editingEntry={editingExpense}
        orgId={effectiveOrgId}
      />

      {/* 2. Log / Edit Income Modal */}
      <LogIncomeModal
        visible={showIncomeModal}
        onClose={() => {
          setShowIncomeModal(false);
          setEditingIncome(null);
        }}
        onSave={handleSaveIncome}
        orgId={effectiveOrgId}
        editingEntry={editingIncome}
      />

      {/* 2b. Buyer Receipt & WhatsApp Sharing Modal */}
      <BuyerReceiptModal
        visible={selectedReceiptEntry !== null}
        onClose={() => setSelectedReceiptEntry(null)}
        entry={selectedReceiptEntry}
        estateName={selectedFarmOption?.label ? `${selectedFarmOption.label} • Farmag App` : 'Namari & Adukidathan Estates • Farmag App'}
      />

      {/* 3. Export Modal */}
      <ReportExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultHead={exportDefaultHead}
        defaultPeriod={selectedPeriod === 'annual' ? 'yearly' : selectedPeriod === 'quarterly' ? 'quarterly' : 'monthly'}
      />

      {/* 4. Log Consumption Modal */}
      <LogConsumptionModal
        visible={showConsumptionModal}
        onClose={() => setShowConsumptionModal(false)}
        onSave={handleSaveConsumption}
        items={expendables}
        equipmentList={equipmentList}
        preselectedItemId={preselectedConsumeItemId}
      />

      {/* 5. Equipment Muster Modal */}
      <EquipmentMusterModal
        visible={showMusterModal}
        onClose={() => setShowMusterModal(false)}
        equipmentList={equipmentList}
        onSaveMuster={handleSaveMuster}
        orgId={effectiveOrgId}
      />

      {/* 6. Confirm Delete Expense */}
      <ThemedConfirmModal
        visible={deleteExpenseTarget !== null}
        type="delete"
        title={t('deleteExpenseTitle')}
        message={deleteExpenseTarget ? `${deleteExpenseTarget.title} • ${t('deleteExpenseConfirm')}` : t('deleteExpenseConfirm')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        onConfirm={async () => {
          if (deleteExpenseTarget) {
            await handleDeleteExpense(deleteExpenseTarget.id);
            setDeleteExpenseTarget(null);
          }
        }}
        onCancel={() => setDeleteExpenseTarget(null)}
      />

      {/* 7. Confirm Delete Income */}
      <ThemedConfirmModal
        visible={deleteIncomeTarget !== null}
        type="delete"
        title={t('deleteIncomeTitle')}
        message={deleteIncomeTarget ? `${deleteIncomeTarget.title} • ${t('deleteIncomeConfirm')}` : t('deleteIncomeConfirm')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        onConfirm={async () => {
          if (deleteIncomeTarget) {
            await handleDeleteIncome(deleteIncomeTarget.id);
            setDeleteIncomeTarget(null);
          }
        }}
        onCancel={() => setDeleteIncomeTarget(null)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  subTabBarWrapper: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  subTabBarScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  subTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  subTabPillText: {
    fontSize: 12,
  },
  scrollContent: {
    padding: 14,
  },
  tabContent: {
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  exportHeadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  exportHeadBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 2,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  monthHeaderText: {
    fontSize: 13,
    fontWeight: '800',
  },
  monthTotalSpend: {
    fontSize: 13,
    fontWeight: '800',
  },
  countPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyBox: {
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
  },
  incomePulseCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  incomePulseLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  incomePulseTotal: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  incomePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  incomeCatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  incomeCatMiniCard: {
    flex: 1,
    minWidth: '47%',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  incomeCatMiniTitle: {
    fontSize: 10,
    fontWeight: '600',
  },
  incomeCatMiniAmt: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  incomeCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  catIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomeCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  incomePayerText: {
    fontSize: 11,
    marginTop: 2,
  },
  incomeDateText: {
    fontSize: 10,
  },
  incomeCardAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
  pnlExecutiveCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  pnlHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  pnlHeaderSubtitle: {
    fontSize: 11,
    marginTop: -8,
  },
  netMarginBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  netMarginLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  netMarginAmount: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  pnlInflowOutflowRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pnlInflowCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  pnlMiniLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  pnlMiniValue: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 4,
  },
  pnlMiniSub: {
    fontSize: 10,
    marginTop: 2,
  },
  exportPnlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  exportPnlBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  breakdownCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 12,
  },
  catNameText: {
    fontSize: 12,
    fontWeight: '600',
  },
  catAmtText: {
    fontSize: 11,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  consumeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  consumeActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  historyCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  logMachine: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  itemPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  logPurpose: {
    fontSize: 10,
    marginTop: 2,
  },
  logAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  logDate: {
    fontSize: 10,
  },
});
