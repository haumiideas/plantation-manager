import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import {
  CuringBatch,
  PepperDryingBatch,
  HarvestEntry,
  CardamomGrading,
  FiringLogEntry,
  DEFAULT_ESTATE_BENCHMARKS,
  DryerComparisonSummary,
  ConsolidatedSeasonIntelligence,
  FuelConsumption,
} from '../../types/harvest';
import {
  getCuringBatches,
  createCuringBatch,
  updateCuringBatch,
  addFiringLog,
  completeCuringBatch,
  getPepperBatches,
  createPepperBatch,
  completePepperBatch,
  getHarvestEntries,
  getEstateBenchmarks,
  saveEstateBenchmarks,
  getAvailableSeasons,
  calculateYearlyDryerComparison,
  calculateConsolidatedIntelligence,
} from '../../services/harvestService';
import {
  getFarmAcreages,
  saveFarmAcreages,
  FarmAcreageConfig,
} from '../../services/farmService';
import { CuringBatchCard } from '../../components/harvest/CuringBatchCard';
import { NewCuringBatchModal } from '../../components/harvest/NewCuringBatchModal';
import { AddFiringLogModal } from '../../components/harvest/AddFiringLogModal';
import { CompleteCuringModal } from '../../components/harvest/CompleteCuringModal';
import { BenchmarkConfigModal } from '../../components/harvest/BenchmarkConfigModal';
import { PepperYardBatchCard } from '../../components/harvest/PepperYardBatchCard';
import { NewPepperBatchModal } from '../../components/harvest/NewPepperBatchModal';
import { CompletePepperModal } from '../../components/harvest/CompletePepperModal';
import { FarmAcreageModal } from '../../components/farm/FarmAcreageModal';
import { ConsolidatedIntelligenceCard } from '../../components/curing/ConsolidatedIntelligenceCard';
import { ReportExportModal } from '../../components/export/ReportExportModal';
import { useLanguage } from '../../context/LanguageContext';

interface CuringScreenProps {
  hideHeader?: boolean;
}

export const CuringScreen: React.FC<CuringScreenProps> = ({ hideHeader = false }) => {
  const { colors, isDark } = useTheme();
  const { selectedFarm, selectedFarmOption } = useFarm();
  const { orgId } = useAuth();
  const { t, translateUserText } = useLanguage();
  const effectiveOrgId = orgId || 'plantation_org_namari_adukidathan';

  // Sub-tabs: Cardamom Dryer vs Pepper Solar Yard vs Consolidated View
  const [activeTab, setActiveTab] = useState<'cardamom_dryer' | 'pepper_solar_yard'>('cardamom_dryer');
  const [showExecutiveAnalytics, setShowExecutiveAnalytics] = useState(
    selectedFarm === 'consolidated'
  );

  // Data state
  const [curingBatches, setCuringBatches] = useState<CuringBatch[]>([]);
  const [pepperBatches, setPepperBatches] = useState<PepperDryingBatch[]>([]);
  const [harvestEntries, setHarvestEntries] = useState<HarvestEntry[]>([]);
  const [farmAcreages, setFarmAcreages] = useState<FarmAcreageConfig>({
    namari: 25.0,
    adukidathan: 30.0,
  });

  const [cardamomBenchmark, setCardamomBenchmark] = useState(
    DEFAULT_ESTATE_BENCHMARKS.cardamomOutturnPercentage
  );
  const [pepperBenchmark, setPepperBenchmark] = useState(
    DEFAULT_ESTATE_BENCHMARKS.pepperOutturnPercentage
  );
  const [selectedSeason, setSelectedSeason] = useState('2026-27');
  const [curingFilter, setCuringFilter] = useState<'all' | 'firing' | 'completed'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showNewCuringModal, setShowNewCuringModal] = useState(false);
  const [batchToEditForCuring, setBatchToEditForCuring] = useState<CuringBatch | null>(null);
  const [showFiringModal, setShowFiringModal] = useState(false);
  const [activeBatchForFiring, setActiveBatchForFiring] = useState<CuringBatch | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [activeBatchForCompletion, setActiveBatchForCompletion] = useState<CuringBatch | null>(null);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);

  // Pepper Modals
  const [showNewPepperModal, setShowNewPepperModal] = useState(false);
  const [showCompletePepperModal, setShowCompletePepperModal] = useState(false);
  const [activePepperBatch, setActivePepperBatch] = useState<PepperDryingBatch | null>(null);

  // Farm Acreage Modal
  const [showAcreageModal, setShowAcreageModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [batchesList, pBatches, entriesList, acreages, bm] = await Promise.all([
        getCuringBatches(effectiveOrgId, selectedFarm),
        getPepperBatches(effectiveOrgId, selectedFarm),
        getHarvestEntries(effectiveOrgId, selectedFarm),
        getFarmAcreages(effectiveOrgId),
        getEstateBenchmarks(effectiveOrgId),
      ]);
      setCuringBatches(batchesList);
      setPepperBatches(pBatches);
      setHarvestEntries(entriesList);
      setFarmAcreages(acreages);
      setCardamomBenchmark(bm.cardamomOutturnPercentage);
      setPepperBenchmark(bm.pepperOutturnPercentage);
    } catch {
      // Offline fallback
    }
  }, [effectiveOrgId, selectedFarm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh when tab gains focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (selectedFarm === 'consolidated') {
      setShowExecutiveAnalytics(true);
    }
  }, [selectedFarm]);

  const handleEditBatch = (batch: CuringBatch) => {
    setBatchToEditForCuring(batch);
    setShowNewCuringModal(true);
  };

  const handleUpdateCuringBatch = async (updated: CuringBatch) => {
    await updateCuringBatch(updated);
    setCuringBatches((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
    setBatchToEditForCuring(null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Seasons list
  const availableSeasons = getAvailableSeasons(curingBatches);

  // Filter batches by season and status
  const seasonBatches = curingBatches.filter((b) => {
    if (selectedSeason !== 'all' && b.seasonYear && b.seasonYear !== selectedSeason) {
      return false;
    }
    return true;
  });

  const filteredBatches = seasonBatches.filter((b) => {
    if (curingFilter === 'firing') return b.status === 'firing' || b.status === 'loading';
    if (curingFilter === 'completed') return b.status === 'completed' || b.status === 'graded';
    return true;
  });

  // Yearly comparison metrics
  const yearlyComparison: DryerComparisonSummary = calculateYearlyDryerComparison(
    curingBatches,
    selectedSeason
  );

  // Consolidated Intelligence Calculations
  const consolidatedIntelligence: ConsolidatedSeasonIntelligence = calculateConsolidatedIntelligence(
    harvestEntries,
    curingBatches,
    {
      namari: farmAcreages.namari,
      adukidathan: farmAcreages.adukidathan,
      consolidated: farmAcreages.namari + farmAcreages.adukidathan,
    },
    selectedSeason
  );

  // Handlers for Cardamom Curing
  const handleCreateCuringBatch = async (
    batchData: Omit<
      CuringBatch,
      'id' | 'createdAt' | 'status' | 'firingLogs' | 'totalFirewoodConsumed' | 'runningDays' | 'fuelConsumed'
    > & {
      runningDays?: number;
      fuelConsumed?: FuelConsumption;
    }
  ) => {
    const created = await createCuringBatch(batchData);
    setCuringBatches((prev) => [created, ...prev]);
  };

  const handleOpenFiringModal = (batch: CuringBatch) => {
    setActiveBatchForFiring(batch);
    setShowFiringModal(true);
  };

  const handleSaveFiringLog = async (batchId: string, log: Omit<FiringLogEntry, 'id'>) => {
    const updated = await addFiringLog(effectiveOrgId, batchId, log);
    if (updated) {
      setCuringBatches((prev) =>
        prev.map((b) => (b.id === batchId ? updated : b))
      );
    }
  };

  const handleOpenCompleteModal = (batch: CuringBatch) => {
    setActiveBatchForCompletion(batch);
    setShowCompleteModal(true);
  };

  const handleCompleteCuringBatch = async (
    batchId: string,
    dryWeightKg: number,
    unloadDate: string,
    grades?: CardamomGrading,
    dryStorageSacksCount?: number,
    dryStoragePlasticBagsCount?: number,
    ripenedFruitDryKg?: number
  ) => {
    const updated = await completeCuringBatch(
      effectiveOrgId,
      batchId,
      dryWeightKg,
      unloadDate,
      grades,
      dryStorageSacksCount,
      dryStoragePlasticBagsCount,
      undefined,
      undefined,
      undefined,
      ripenedFruitDryKg
    );
    if (updated) {
      setCuringBatches((prev) =>
        prev.map((b) => (b.id === batchId ? updated : b))
      );
    }
  };

  // Handlers for Pepper Solar Yard
  const handleCreatePepperBatch = async (
    batchData: Omit<PepperDryingBatch, 'id' | 'createdAt' | 'status'>
  ) => {
    const created = await createPepperBatch(batchData);
    setPepperBatches((prev) => [created, ...prev]);
  };

  const handleOpenCompletePepper = (batch: PepperDryingBatch) => {
    setActivePepperBatch(batch);
    setShowCompletePepperModal(true);
  };

  const handleCompletePepper = async (
    batchId: string,
    dryBlackPepperKg: number,
    completedDate: string
  ) => {
    const updated = await completePepperBatch(
      effectiveOrgId,
      batchId,
      dryBlackPepperKg,
      completedDate
    );
    if (updated) {
      setPepperBatches((prev) =>
        prev.map((b) => (b.id === batchId ? updated : b))
      );
    }
  };

  const handleUpdateBenchmarks = async (cardamom: number, pepper: number) => {
    setCardamomBenchmark(cardamom);
    setPepperBenchmark(pepper);
    await saveEstateBenchmarks(effectiveOrgId, {
      cardamomOutturnPercentage: cardamom,
      pepperOutturnPercentage: pepper,
    });
  };

  const handleSaveFarmAcreages = async (acreages: FarmAcreageConfig) => {
    setFarmAcreages(acreages);
    await saveFarmAcreages(effectiveOrgId, acreages);
  };

  const { ownBatches, rentedBatches, outturnAdvantage, rentedDryerBreakdown } =
    yearlyComparison;
  const hasYearlyData = ownBatches.batchesCount > 0 || rentedBatches.batchesCount > 0;

  const mainContent = (
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
        {/* Context Bar */}
        <View style={styles.topContextBar}>
          <View>
            <Text style={[styles.contextTitle, { color: colors.text }]}>
              {t('cardamomCuringLedger')}
            </Text>
            <Text style={[styles.contextSubtitle, { color: isDark ? colors.primaryLight : colors.primary }]}>
              {translateUserText(selectedFarmOption.label)} ({selectedFarmOption.shortCode}) • {t('dryerOperations')}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              onPress={() => setShowExportModal(true)}
              style={[
                styles.analyticsToggleBtn,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Ionicons name="download-outline" size={14} color={colors.primary} />
              <Text style={[styles.analyticsToggleText, { color: colors.primary }]}>
                {t('exportBtn')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowExecutiveAnalytics((prev) => !prev)}
              style={[
                styles.analyticsToggleBtn,
                {
                  backgroundColor: showExecutiveAnalytics ? colors.primary : colors.card,
                  borderColor: showExecutiveAnalytics ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <Ionicons
                name="pie-chart"
                size={14}
                color={showExecutiveAnalytics ? '#FFFFFF' : colors.primary}
              />
              <Text
                style={[
                  styles.analyticsToggleText,
                  { color: showExecutiveAnalytics ? '#FFFFFF' : colors.text },
                ]}
              >
                {showExecutiveAnalytics ? t('hide') : t('seasonIntelligence')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* CONSOLIDATED INTELLIGENCE CARD (Executive Overview) */}
        {showExecutiveAnalytics && (
          <ConsolidatedIntelligenceCard
            intelligence={consolidatedIntelligence}
            onConfigureAcreage={() => setShowAcreageModal(true)}
          />
        )}

        {/* CURING SUB-TABS: CARDAMOM DRYER vs PEPPER SOLAR YARD */}
        <View style={styles.subTabsContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('cardamom_dryer')}
            style={[
              styles.subTabButton,
              {
                backgroundColor:
                  activeTab === 'cardamom_dryer' ? '#D97706' : colors.card,
                borderColor:
                  activeTab === 'cardamom_dryer' ? '#D97706' : colors.cardBorder,
              },
            ]}
          >
            <Ionicons
              name="flame"
              size={16}
              color={activeTab === 'cardamom_dryer' ? '#FFFFFF' : '#D97706'}
            />
            <Text
              style={[
                styles.subTabText,
                {
                  color: activeTab === 'cardamom_dryer' ? '#FFFFFF' : colors.text,
                  fontWeight: activeTab === 'cardamom_dryer' ? '800' : '600',
                },
              ]}
            >
              {t('curingChamber')} ({curingBatches.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('pepper_solar_yard')}
            style={[
              styles.subTabButton,
              {
                backgroundColor:
                  activeTab === 'pepper_solar_yard' ? '#0D9488' : colors.card,
                borderColor:
                  activeTab === 'pepper_solar_yard' ? '#0D9488' : colors.cardBorder,
              },
            ]}
          >
            <Ionicons
              name="sunny"
              size={16}
              color={activeTab === 'pepper_solar_yard' ? '#FFFFFF' : '#0D9488'}
            />
            <Text
              style={[
                styles.subTabText,
                {
                  color: activeTab === 'pepper_solar_yard' ? '#FFFFFF' : colors.text,
                  fontWeight: activeTab === 'pepper_solar_yard' ? '800' : '600',
                },
              ]}
            >
              {t('pepperSolarYard')} ({pepperBatches.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: CARDAMOM DRYER CHAMBERS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'cardamom_dryer' && (
          <>
            {/* YEAR / SEASON SELECTOR */}
            <View style={styles.seasonSelectorRow}>
              <Text style={[styles.seasonLabel, { color: colors.textMuted }]}>
                {t('dryingSeason')}:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonChips}>
                {availableSeasons.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSelectedSeason(s)}
                    style={[
                      styles.seasonChip,
                      {
                        backgroundColor:
                          selectedSeason === s ? colors.primary : colors.card,
                        borderColor:
                          selectedSeason === s ? colors.primary : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.seasonChipText,
                        {
                          color: selectedSeason === s ? '#FFFFFF' : colors.text,
                          fontWeight: selectedSeason === s ? '800' : '600',
                        },
                      ]}
                    >
                      Season {s}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setSelectedSeason('all')}
                  style={[
                    styles.seasonChip,
                    {
                      backgroundColor:
                        selectedSeason === 'all' ? colors.primary : colors.card,
                      borderColor:
                        selectedSeason === 'all' ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.seasonChipText,
                      {
                        color: selectedSeason === 'all' ? '#FFFFFF' : colors.text,
                        fontWeight: selectedSeason === 'all' ? '800' : '600',
                      },
                    ]}
                  >
                    {t('allSeasons')}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* YEARLY DRYER COMPARISON: OWN vs RENTED DRYER */}
            {hasYearlyData && (
              <View
                style={[
                  styles.comparisonCard,
                  {
                    backgroundColor: isDark ? '#141E17' : '#F0FDF4',
                    borderColor: isDark ? '#26422F' : '#BBF7D0',
                  },
                ]}
              >
                <View style={styles.comparisonHeader}>
                  <View style={styles.comparisonTitleRow}>
                    <Ionicons
                      name="git-compare"
                      size={18}
                      color={isDark ? colors.primaryLight : colors.primary}
                    />
                    <Text style={[styles.comparisonTitle, { color: colors.text }]}>
                      {selectedSeason === 'all' ? 'All-Time' : `Season ${selectedSeason}`} Dryer Comparison
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowBenchmarkModal(true)}
                    style={styles.benchmarkBadge}
                  >
                    <Text style={[styles.benchmarkText, { color: colors.primary }]}>
                      Target: {cardamomBenchmark}%
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.comparisonRow}>
                  {/* Own Dryer Box */}
                  <View
                    style={[
                      styles.dryerColumn,
                      { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    ]}
                  >
                    <View style={styles.dryerTag}>
                      <Ionicons name="home" size={13} color={colors.primary} />
                      <Text style={[styles.dryerTagText, { color: colors.primary }]}>{t('ownDryer')}</Text>
                    </View>
                    <Text style={[styles.columnRecovery, { color: colors.text }]}>
                      {ownBatches.averageOutturn > 0 ? `${ownBatches.averageOutturn}%` : '—'}
                    </Text>
                    <Text style={[styles.columnSub, { color: colors.textMuted }]}>
                      {ownBatches.dryKg.toFixed(0)}kg dry / {ownBatches.greenKg.toFixed(0)}kg green
                    </Text>
                    <Text style={[styles.batchCount, { color: colors.textMuted }]}>
                      {ownBatches.batchesCount} batches • {ownBatches.runningDays.toFixed(1)} days
                    </Text>
                  </View>

                  {/* VS Divider with Advantage Pill */}
                  <View style={styles.vsContainer}>
                    <Text style={[styles.vsText, { color: colors.textMuted }]}>VS</Text>
                    {ownBatches.averageOutturn > 0 && rentedBatches.averageOutturn > 0 && (
                      <View
                        style={[
                          styles.advantagePill,
                          {
                            backgroundColor:
                              outturnAdvantage >= 0
                                ? isDark
                                  ? '#14532D'
                                  : '#DCFCE7'
                                : isDark
                                ? '#7F1D1D'
                                : '#FEE2E2',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.advantageText,
                            { color: outturnAdvantage >= 0 ? '#16A34A' : '#DC2626' },
                          ]}
                        >
                          {outturnAdvantage >= 0 ? `+${outturnAdvantage}%` : `${outturnAdvantage}%`}
                        </Text>
                        <Text style={[styles.advantageLabel, { color: colors.textMuted }]}>
                          {outturnAdvantage >= 0 ? 'Own Gain' : 'Variance'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Rented Dryer Box */}
                  <View
                    style={[
                      styles.dryerColumn,
                      { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    ]}
                  >
                    <View style={styles.dryerTag}>
                      <Ionicons name="business" size={13} color="#D97706" />
                      <Text style={[styles.dryerTagText, { color: '#D97706' }]}>{t('rentedDryer')}</Text>
                    </View>
                    <Text style={[styles.columnRecovery, { color: colors.text }]}>
                      {rentedBatches.averageOutturn > 0 ? `${rentedBatches.averageOutturn}%` : '—'}
                    </Text>
                    <Text style={[styles.columnSub, { color: colors.textMuted }]}>
                      {rentedBatches.dryKg.toFixed(0)}kg dry / {rentedBatches.greenKg.toFixed(0)}kg green
                    </Text>
                    <Text style={[styles.batchCount, { color: colors.textMuted }]}>
                      {rentedBatches.batchesCount} batches • {rentedBatches.runningDays.toFixed(1)} days
                    </Text>
                  </View>
                </View>

                {/* Individual Rented Facility Breakdown */}
                {Object.keys(rentedDryerBreakdown).length > 0 && (
                  <View style={styles.rentedList}>
                    <Text style={[styles.rentedTitle, { color: colors.textMuted }]}>
                      Rented Facilities Tracked:
                    </Text>
                    <View style={styles.facilityChipsRow}>
                      {Object.entries(rentedDryerBreakdown).map(([name, data]) => (
                        <View
                          key={name}
                          style={[
                            styles.facilityChip,
                            { backgroundColor: colors.card, borderColor: colors.cardBorder },
                          ]}
                        >
                          <Text style={[styles.facilityName, { color: colors.text }]}>{name}</Text>
                          <Text style={[styles.facilityRecovery, { color: '#D97706' }]}>
                            {data.averageOutturn}% outturn ({data.batchesCount} b.)
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Action Header: Start Curing Batch */}
            <View style={styles.actionHeaderRow}>
              <View style={styles.filterPillsRow}>
                {(['all', 'firing', 'completed'] as const).map((fil) => (
                  <TouchableOpacity
                    key={fil}
                    onPress={() => setCuringFilter(fil)}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor:
                          curingFilter === fil ? '#D97706' : colors.card,
                        borderColor:
                          curingFilter === fil ? '#D97706' : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        {
                          color: curingFilter === fil ? '#FFFFFF' : colors.textMuted,
                          fontWeight: curingFilter === fil ? '700' : '500',
                        },
                      ]}
                    >
                      {fil === 'all'
                        ? `All (${seasonBatches.length})`
                        : fil === 'firing'
                        ? `Firing (${seasonBatches.filter((b) => b.status === 'firing' || b.status === 'loading').length})`
                        : `Completed (${seasonBatches.filter((b) => b.status === 'completed' || b.status === 'graded').length})`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setShowNewCuringModal(true)}
                style={[styles.startBatchBtn, { backgroundColor: '#D97706' }]}
              >
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text style={styles.startBatchText}>+ {t('newBatch')}</Text>
              </TouchableOpacity>
            </View>

            {/* Batches List */}
            <View style={styles.batchesListContainer}>
              {filteredBatches.length === 0 ? (
                <View
                  style={[
                    styles.emptyBox,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                >
                  <Ionicons name="flame-outline" size={40} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No Dryer Batches in {selectedSeason}
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    Load green cardamom capsules into an Own or Rented dryer to begin firing.
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowNewCuringModal(true)}
                    style={[styles.emptyBtn, { backgroundColor: '#D97706' }]}
                  >
                    <Ionicons name="flame" size={16} color="#FFFFFF" />
                    <Text style={styles.emptyBtnText}>Start New Curing Cycle</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredBatches.map((batch) => (
                  <CuringBatchCard
                    key={batch.id}
                    batch={batch}
                    onAddFiringLog={handleOpenFiringModal}
                    onCompleteBatch={handleOpenCompleteModal}
                    onGradeBatch={handleOpenCompleteModal}
                    onEditBatch={handleEditBatch}
                  />
                ))
              )}
            </View>
          </>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: PEPPER SOLAR YARD */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'pepper_solar_yard' && (
          <View style={styles.pepperSection}>
            <View style={styles.pepperSectionHeader}>
              <View style={styles.pepperTitleCluster}>
                <Ionicons name="sunny" size={20} color="#0D9488" />
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Black Pepper Solar Yard Drying
                  </Text>
                  <Text style={[styles.pepperSub, { color: colors.textMuted }]}>
                    Target Recovery: {pepperBenchmark}% outturn • Direct concrete yard raking
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowNewPepperModal(true)}
                style={[styles.startBatchBtn, { backgroundColor: '#0D9488' }]}
              >
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text style={styles.startBatchText}>+ New Batch</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.batchesListContainer}>
              {pepperBatches.length === 0 ? (
                <View
                  style={[
                    styles.emptyBox,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                >
                  <Ionicons name="sunny-outline" size={40} color="#0D9488" />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No Pepper Drying Batches Logged
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    Record fresh spikes, thresh berries, and track solar drying recovery percentage.
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowNewPepperModal(true)}
                    style={[styles.emptyBtn, { backgroundColor: '#0D9488' }]}
                  >
                    <Ionicons name="sunny" size={16} color="#FFFFFF" />
                    <Text style={styles.emptyBtnText}>Start Pepper Solar Drying</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                pepperBatches.map((batch) => (
                  <PepperYardBatchCard
                    key={batch.id}
                    batch={batch}
                    onCompleteBatch={handleOpenCompletePepper}
                  />
                ))
              )}
            </View>
          </View>
        )}

        {/* Modals */}
        <NewCuringBatchModal
          visible={showNewCuringModal}
          onClose={() => {
            setShowNewCuringModal(false);
            setBatchToEditForCuring(null);
          }}
          defaultFarmId={selectedFarm}
          defaultBenchmark={cardamomBenchmark}
          batchToEdit={batchToEditForCuring}
          onCreateBatch={handleCreateCuringBatch}
          onUpdateBatch={handleUpdateCuringBatch}
        />

        <AddFiringLogModal
          visible={showFiringModal}
          onClose={() => {
            setShowFiringModal(false);
            setActiveBatchForFiring(null);
          }}
          batch={activeBatchForFiring}
          onSaveLog={handleSaveFiringLog}
        />

        <CompleteCuringModal
          visible={showCompleteModal}
          onClose={() => {
            setShowCompleteModal(false);
            setActiveBatchForCompletion(null);
          }}
          batch={activeBatchForCompletion}
          onCompleteBatch={handleCompleteCuringBatch}
        />

        <BenchmarkConfigModal
          visible={showBenchmarkModal}
          onClose={() => setShowBenchmarkModal(false)}
          currentCardamomBenchmark={cardamomBenchmark}
          currentPepperBenchmark={pepperBenchmark}
          onSave={handleUpdateBenchmarks}
        />

        <NewPepperBatchModal
          visible={showNewPepperModal}
          onClose={() => setShowNewPepperModal(false)}
          defaultFarmId={selectedFarm}
          defaultBenchmark={pepperBenchmark}
          onCreateBatch={handleCreatePepperBatch}
        />

        <CompletePepperModal
          visible={showCompletePepperModal}
          onClose={() => {
            setShowCompletePepperModal(false);
            setActivePepperBatch(null);
          }}
          batch={activePepperBatch}
          onCompleteBatch={handleCompletePepper}
        />

        <FarmAcreageModal
          visible={showAcreageModal}
          onClose={() => setShowAcreageModal(false)}
          currentAcreages={farmAcreages}
          onSave={handleSaveFarmAcreages}
        />

        {/* Curing Batches Export Modal */}
        <ReportExportModal
          visible={showExportModal}
          onClose={() => setShowExportModal(false)}
          defaultHead="curing"
        />
      </ScrollView>
  );


  if (hideHeader) {
    return <View style={{ flex: 1, backgroundColor: colors.background }}>{mainContent}</View>;
  }

  return (
    <ScreenContainer header={<AppHeader />}>
      {mainContent}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
    gap: 12,
  },
  topContextBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contextTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  contextSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  analyticsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  analyticsToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  subTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  subTabText: {
    fontSize: 12,
  },
  seasonSelectorRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seasonLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  seasonChips: {
    gap: 6,
  },
  seasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  seasonChipText: {
    fontSize: 12,
  },
  comparisonCard: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  benchmarkBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  benchmarkText: {
    fontSize: 11,
    fontWeight: '700',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dryerColumn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  dryerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  dryerTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  columnRecovery: {
    fontSize: 18,
    fontWeight: '800',
  },
  columnSub: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  batchCount: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  vsText: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  advantagePill: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  advantageText: {
    fontSize: 11,
    fontWeight: '800',
  },
  advantageLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  rentedList: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 8,
  },
  rentedTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  facilityChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  facilityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  facilityName: {
    fontSize: 11,
    fontWeight: '600',
  },
  facilityRecovery: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
  },
  startBatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  startBatchText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  batchesListContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyBox: {
    padding: 28,
    borderRadius: 14,
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
    marginTop: 10,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pepperSection: {
    gap: 12,
  },
  pepperSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  pepperTitleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  pepperSub: {
    fontSize: 11,
    marginTop: 1,
  },
});
