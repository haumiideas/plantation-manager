import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { formatDate, parseEstateDate, FULL_MONTH_NAMES } from '../../utils/date';
import { useLanguage } from '../../context/LanguageContext';
import { IncomeEntry, IncomeCategory } from '../../types/income';
import {
  getIncomeEntries,
  calculateTotalIncome,
  deleteIncomeEntry,
  saveIncomeEntry,
} from '../../services/incomeService';
import { getExpenses } from '../../services/expenseService';
import { ThemedConfirmModal } from '../../components/common/ThemedConfirmModal';
import { LogIncomeModal } from '../../components/income/LogIncomeModal';
import { BuyerReceiptModal } from '../../components/income/BuyerReceiptModal';
import { ReportExportModal } from '../../components/export/ReportExportModal';

type PnLSubTab = 'pnl' | 'income';

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

export const PnLScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { selectedFarm, selectedFarmOption } = useFarm();
  const { role, orgId } = useAuth();
  const { t } = useLanguage();
  const effectiveOrgId = orgId || 'plantation_org_namari_adukidathan';
  const todayFormatted = formatDate();

  const [activeSubTab, setActiveSubTab] = useState<PnLSubTab>('pnl');
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfitMasked, setIsProfitMasked] = useState(true);

  // Modals
  const [showLogIncomeModal, setShowLogIncomeModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportHead, setExportHead] = useState<'consolidated' | 'income'>('consolidated');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedReceiptEntry, setSelectedReceiptEntry] = useState<IncomeEntry | null>(null);

  const loadFinancials = useCallback(async () => {
    try {
      const [incomeList, expList] = await Promise.all([
        getIncomeEntries(effectiveOrgId, selectedFarm),
        getExpenses(effectiveOrgId),
      ]);
      setIncomes(incomeList);
      const filteredExp =
        selectedFarm && selectedFarm !== 'consolidated'
          ? expList.filter((e) => e.farmId === selectedFarm)
          : expList;
      const totalExp = filteredExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      setTotalExpenses(totalExp);
    } catch {
      // ignore
    }
  }, [effectiveOrgId, selectedFarm]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFinancials();
    setRefreshing(false);
  };

  const totalIncome = calculateTotalIncome(incomes);
  const netMargin = totalIncome - totalExpenses;
  const isProfitable = netMargin >= 0;

  // Filtered Incomes
  const filteredIncomes = useMemo(() => {
    if (!searchQuery.trim()) return incomes;
    const q = searchQuery.toLowerCase();
    return incomes.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.payerName.toLowerCase().includes(q) ||
        (i.receiptNumber && i.receiptNumber.toLowerCase().includes(q))
    );
  }, [incomes, searchQuery]);

  // Grouped by Month & Year
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

  const handleSaveIncome = async (entry: Omit<IncomeEntry, 'id' | 'createdAt'>) => {
    const created = await saveIncomeEntry(effectiveOrgId, entry);
    setIncomes((prev) => [created, ...prev]);
  };

  const handleDeleteIncome = async (id: string) => {
    await deleteIncomeEntry(effectiveOrgId, id);
    setIncomes((prev) => prev.filter((i) => i.id !== id));
    setDeleteTargetId(null);
  };

  return (
    <ScreenContainer header={<AppHeader />}>
      {/* SubTab Switcher Bar */}
      <View
        style={[
          styles.subTabBar,
          { backgroundColor: colors.card, borderBottomColor: colors.cardBorder },
        ]}
      >
        <TouchableOpacity
          onPress={() => setActiveSubTab('pnl')}
          style={[
            styles.subTabBtn,
            {
              backgroundColor: activeSubTab === 'pnl' ? colors.primary : colors.surfaceSubtle,
              borderColor: activeSubTab === 'pnl' ? colors.primary : colors.cardBorder,
            },
          ]}
        >
          <Ionicons
            name="stats-chart"
            size={14}
            color={activeSubTab === 'pnl' ? '#FFFFFF' : colors.textMuted}
          />
          <Text
            style={[
              styles.subTabText,
              { color: activeSubTab === 'pnl' ? '#FFFFFF' : colors.text, fontWeight: activeSubTab === 'pnl' ? '800' : '600' },
            ]}
          >
            P&L Statement
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSubTab('income')}
          style={[
            styles.subTabBtn,
            {
              backgroundColor: activeSubTab === 'income' ? colors.primary : colors.surfaceSubtle,
              borderColor: activeSubTab === 'income' ? colors.primary : colors.cardBorder,
            },
          ]}
        >
          <Ionicons
            name="wallet"
            size={14}
            color={activeSubTab === 'income' ? '#FFFFFF' : colors.textMuted}
          />
          <Text
            style={[
              styles.subTabText,
              { color: activeSubTab === 'income' ? '#FFFFFF' : colors.text, fontWeight: activeSubTab === 'income' ? '800' : '600' },
            ]}
          >
            Income & Receipts ({incomes.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ================= TAB 1: P&L STATEMENT ================= */}
        {activeSubTab === 'pnl' && (
          <View style={{ gap: 12 }}>
            {/* Live Net Margin Financial Pulse Cards */}
            <View style={styles.pulseRow}>
              {/* Total Realized Income */}
              <View
                style={[
                  styles.pulseCard,
                  { backgroundColor: colors.card, borderColor: '#10B981' },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="arrow-up-circle" size={16} color="#10B981" />
                  <Text style={[styles.pulseLabel, { color: '#10B981' }]}>
                    Realized Income
                  </Text>
                </View>
                <Text style={[styles.pulseNum, { color: '#10B981' }]}>
                  ₹{totalIncome.toLocaleString()}
                </Text>
                <Text style={[styles.pulseSub, { color: colors.textMuted }]}>
                  {incomes.length} receipts logged
                </Text>
              </View>

              {/* Total Operating Expenses */}
              <View
                style={[
                  styles.pulseCard,
                  { backgroundColor: colors.card, borderColor: '#EF4444' },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="arrow-down-circle" size={16} color="#EF4444" />
                  <Text style={[styles.pulseLabel, { color: '#EF4444' }]}>
                    Total Expenses
                  </Text>
                </View>
                <Text style={[styles.pulseNum, { color: '#EF4444' }]}>
                  ₹{totalExpenses.toLocaleString()}
                </Text>
                <Text style={[styles.pulseSub, { color: colors.textMuted }]}>
                  Operating ledger
                </Text>
              </View>
            </View>

            {/* Net Farm Operating Profit / Margin Card */}
            <View
              style={[
                styles.marginCard,
                {
                  backgroundColor: isProfitable
                    ? isDark
                      ? '#064E3B'
                      : '#ECFDF5'
                    : isDark
                    ? '#7F1D1D'
                    : '#FEF2F2',
                  borderColor: isProfitable ? '#10B981' : '#EF4444',
                },
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: isProfitable ? '#059669' : '#DC2626',
                        textTransform: 'uppercase',
                      }}
                    >
                      {isProfitable ? 'Net Operating Profit' : 'Operating Deficit'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setIsProfitMasked(!isProfitMasked)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={isProfitMasked ? 'eye-off-outline' : 'eye-outline'}
                        size={15}
                        color={isProfitable ? '#059669' : '#DC2626'}
                      />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setIsProfitMasked(!isProfitMasked)}>
                    <Text
                      style={{
                        fontSize: 26,
                        fontWeight: '900',
                        color: isProfitable ? '#059669' : '#DC2626',
                        marginTop: 2,
                      }}
                    >
                      {isProfitMasked ? '****' : `${isProfitable ? '+' : ''}₹${netMargin.toLocaleString('en-IN')}`}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: isProfitable ? '#10B98125' : '#EF444425',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={isProfitable ? 'trending-up' : 'trending-down'}
                    size={24}
                    color={isProfitable ? '#059669' : '#DC2626'}
                  />
                </View>
              </View>
            </View>

            {/* Export P&L Button */}
            <TouchableOpacity
              onPress={() => {
                setExportHead('consolidated');
                setShowExportModal(true);
              }}
              style={[styles.exportBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="document-text" size={16} color="#FFFFFF" />
              <Text style={styles.exportBtnText}>
                Export Consolidated P&L Report (Excel / PDF)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= TAB 2: INCOME & RECEIPTS LEDGER ================= */}
        {activeSubTab === 'income' && (
          <View style={{ gap: 12 }}>
            {/* Action Bar */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setShowLogIncomeModal(true)}
                style={[styles.actionBtn, { backgroundColor: '#059669' }]}
              >
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>+ Log Farm Income</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setExportHead('income');
                  setShowExportModal(true);
                }}
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.cardBorder },
                ]}
              >
                <Ionicons name="download-outline" size={15} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                  Export (Excel / PDF)
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
                placeholder="Search payer, produce trader, receipt number..."
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

            {/* Grouped Incomes */}
            {groupedIncomes.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <Ionicons name="wallet-outline" size={36} color={colors.textMuted} />
                <Text style={[styles.emptyCardTitle, { color: colors.text }]}>
                  No income entries recorded
                </Text>
                <Text style={[styles.emptyCardSub, { color: colors.textMuted }]}>
                  Tap '+ Log Farm Income' to record cash advances, produce sales, or tour fees.
                </Text>
              </View>
            ) : (
              groupedIncomes.map((group) => (
                <View key={group.monthYear} style={{ marginBottom: 12 }}>
                  <View
                    style={[
                      styles.monthHeader,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                    ]}
                  >
                    <Text style={[styles.monthHeaderText, { color: colors.text }]}>
                      📅 {group.monthYear}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#059669' }}>
                      +₹{group.total.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {group.entries.map((inc) => {
                    const meta = INCOME_CAT_META[inc.category] || INCOME_CAT_META.other_income;
                    return (
                      <View
                        key={inc.id}
                        style={[
                          styles.incomeItem,
                          { backgroundColor: colors.card, borderColor: colors.cardBorder },
                        ]}
                      >
                        <View style={[styles.incomeIcon, { backgroundColor: meta.color + '20' }]}>
                          <Ionicons name={meta.icon} size={18} color={meta.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.incomeTitle, { color: colors.text }]}>
                              {inc.title}
                            </Text>
                            <View
                              style={[
                                styles.catBadge,
                                { backgroundColor: meta.color + '15', borderColor: meta.color + '30' },
                              ]}
                            >
                              <Text style={[styles.catBadgeText, { color: meta.color }]}>
                                {meta.label}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.incomePayer, { color: colors.textMuted }]}>
                            👤 {inc.payerName} {inc.payerPhone ? `(${inc.payerPhone})` : ''}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                            <Text style={[styles.incomeMeta, { color: colors.textMuted }]}>
                              📅 {inc.date}
                            </Text>
                            <Text style={[styles.incomeMeta, { color: colors.textMuted }]}>
                              💳 {inc.paymentMode.toUpperCase()}
                            </Text>
                            {inc.receiptNumber ? (
                              <Text style={[styles.incomeMeta, { color: colors.primary }]}>
                                #{inc.receiptNumber}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 6 }}>
                          <Text style={[styles.incomeAmount, { color: '#059669' }]}>
                            +₹{inc.amount.toLocaleString()}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                            <TouchableOpacity
                              onPress={() => setSelectedReceiptEntry(inc)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 3,
                                backgroundColor: '#10B98115',
                                paddingHorizontal: 7,
                                paddingVertical: 3,
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: '#10B98130',
                              }}
                            >
                              <Ionicons name="receipt-outline" size={12} color="#059669" />
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#059669' }}>Receipt</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => setDeleteTargetId(inc.id)}
                              style={{ padding: 4 }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="trash-outline" size={15} color={colors.danger} />
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
      </ScrollView>

      {/* Log Income Modal */}
      <LogIncomeModal
        visible={showLogIncomeModal}
        onClose={() => setShowLogIncomeModal(false)}
        onSave={handleSaveIncome}
        orgId={effectiveOrgId}
      />

      {/* Buyer Receipt & WhatsApp Sharing Modal */}
      <BuyerReceiptModal
        visible={selectedReceiptEntry !== null}
        onClose={() => setSelectedReceiptEntry(null)}
        entry={selectedReceiptEntry}
        estateName={selectedFarmOption?.label ? `${selectedFarmOption.label} • Farmag App` : 'Namari & Adukidathan Estates'}
      />

      {/* Report Export Modal */}
      <ReportExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultHead={exportHead}
      />

      {/* Delete Confirmation Modal */}
      <ThemedConfirmModal
        visible={deleteTargetId !== null}
        type="delete"
        title="Delete Income Record?"
        message="Are you sure you want to delete this income entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          if (deleteTargetId) handleDeleteIncome(deleteTargetId);
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  subTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  subTabText: {
    fontSize: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  pulseRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pulseCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  pulseLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pulseNum: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  pulseSub: {
    fontSize: 10,
    marginTop: 2,
  },
  marginCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
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
  emptyCard: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyCardSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  monthHeaderText: {
    fontSize: 13,
    fontWeight: '800',
  },
  incomeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  incomeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  incomePayer: {
    fontSize: 11,
    marginTop: 2,
  },
  incomeMeta: {
    fontSize: 10,
  },
  incomeAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
});
