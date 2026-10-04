import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { CropConfig } from '../../types/crop';
import {
  HarvestEntry,
  FlushSummary,
  ContractorGroupConfig,
} from '../../types/harvest';
import { PlantationWorker } from '../../types/worker';
import {
  getAllCrops,
  addCustomCrop,
  getHarvestEntries,
  saveHarvestEntry,
  updateHarvestEntry,
  deleteHarvestEntry,
  toggleFlushLock,
  calculateFlushSummary,
  getContractorGroups,
  addContractorGroup,
  updateContractorGroup,
  deleteContractorGroup,
  getCardamomFlushes,
  addCardamomFlush,
} from '../../services/harvestService';
import {
  getFarmAcreages,
  saveFarmAcreages,
  FarmAcreageConfig,
} from '../../services/farmService';
import { getAllActiveWorkers } from '../../services/workerService';
import { FlushMetricsBanner } from '../../components/harvest/FlushMetricsBanner';
import { DailyHarvestList } from '../../components/harvest/DailyHarvestList';
import { LogHarvestModal } from '../../components/harvest/LogHarvestModal';
import { AddCropModal } from '../../components/harvest/AddCropModal';
import { FarmAcreageModal } from '../../components/farm/FarmAcreageModal';
import { ManageLaborGroupsModal } from '../../components/harvest/ManageLaborGroupsModal';
import { ReportExportModal } from '../../components/export/ReportExportModal';
import { CuringScreen } from '../curing/CuringScreen';

interface HarvestScreenProps {
  route?: {
    params?: {
      subTab?: 'picking' | 'curing';
    };
  };
}

export const HarvestScreen: React.FC<HarvestScreenProps> = ({ route }) => {
  const { colors, isDark } = useTheme();
  const { selectedFarm, selectedFarmOption } = useFarm();
  const { orgId } = useAuth();
  const { t, translateUserText } = useLanguage();
  const effectiveOrgId = orgId || 'plantation_org_namari_adukidathan';

  const [subTab, setSubTab] = useState<'picking' | 'curing'>(route?.params?.subTab || 'picking');

  useEffect(() => {
    if (route?.params?.subTab) {
      setSubTab(route.params.subTab);
    }
  }, [route?.params?.subTab]);

  // Navigation & Crops
  const [crops, setCrops] = useState<CropConfig[]>([]);
  const [selectedCropId, setSelectedCropId] = useState('cardamom');
  const [currentFlush, setCurrentFlush] = useState('2nd Flush');
  const [cardamomFlushes, setCardamomFlushes] = useState<string[]>([
    '1st Flush',
    '2nd Flush',
    '3rd Flush',
    '4th Flush',
  ]);

  // Operational Data
  const [harvestEntries, setHarvestEntries] = useState<HarvestEntry[]>([]);
  const [workers, setWorkers] = useState<PlantationWorker[]>([]);
  const [contractorGroups, setContractorGroups] = useState<ContractorGroupConfig[]>([]);
  const [farmAcreages, setFarmAcreages] = useState<FarmAcreageConfig>({
    namari: 25.0,
    adukidathan: 30.0,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showLogHarvestModal, setShowLogHarvestModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HarvestEntry | null>(null);
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [showAcreageModal, setShowAcreageModal] = useState(false);
  const [showLaborGroupsModal, setShowLaborGroupsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const [cropsList, harvestList, activeWorkers, acreages, groups, fls] =
        await Promise.all([
          getAllCrops(effectiveOrgId),
          getHarvestEntries(effectiveOrgId, selectedFarm),
          getAllActiveWorkers(effectiveOrgId),
          getFarmAcreages(effectiveOrgId),
          getContractorGroups(effectiveOrgId),
          getCardamomFlushes(effectiveOrgId),
        ]);

      setCrops(cropsList);
      setHarvestEntries(harvestList);
      setWorkers(activeWorkers);
      setFarmAcreages(acreages);
      setContractorGroups(groups);
      setCardamomFlushes(fls);
    } catch {
      // Offline fallback
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

  // Add Custom Crop
  const handleAddCrop = async (newCrop: Omit<CropConfig, 'isCustom'>) => {
    const created = await addCustomCrop(effectiveOrgId, newCrop);
    setCrops((prev) => [...prev, created]);
    setSelectedCropId(created.id);
  };

  // Harvest Entry Operations (Create & Edit)
  const handleSaveHarvest = async (entry: Omit<HarvestEntry, 'id' | 'createdAt'>) => {
    const saved = await saveHarvestEntry(entry);
    setHarvestEntries((prev) => [saved, ...prev]);
  };

  const handleUpdateHarvest = async (entry: HarvestEntry) => {
    const updated = await updateHarvestEntry(entry);
    setHarvestEntries((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
    setEditingEntry(null);
  };

  const handleOpenEdit = (entry: HarvestEntry) => {
    setEditingEntry(entry);
    setShowLogHarvestModal(true);
  };

  const handleDeleteHarvest = async (id: string) => {
    await deleteHarvestEntry(effectiveOrgId, id);
    setHarvestEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Flush Locking
  const handleToggleFlushLock = async (flush: string, isLocked: boolean) => {
    await toggleFlushLock(effectiveOrgId, flush, isLocked);
    setHarvestEntries((prev) =>
      prev.map((e) => (e.flushNumber === flush ? { ...e, isFlushLocked: isLocked } : e))
    );
  };

  // Save Acreages
  const handleSaveAcreages = async (newAcreages: FarmAcreageConfig) => {
    await saveFarmAcreages(effectiveOrgId, newAcreages);
    setFarmAcreages(newAcreages);
  };

  // Contractor Groups Operations
  const handleAddLaborGroup = async (name: string) => {
    const created = await addContractorGroup(effectiveOrgId, name);
    setContractorGroups((prev) => [...prev, created]);
  };

  const handleUpdateLaborGroup = async (id: string, newName: string) => {
    await updateContractorGroup(effectiveOrgId, id, newName);
    setContractorGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, name: newName } : g))
    );
  };

  const handleDeleteLaborGroup = async (id: string) => {
    await deleteContractorGroup(effectiveOrgId, id);
    setContractorGroups((prev) => prev.filter((g) => g.id !== id));
  };

  // Active crop metadata
  const currentCrop = crops.find((c) => c.id === selectedCropId) || crops[0];
  const isCardamom = currentCrop?.id === 'cardamom';

  // Acreage calculation for yields
  const currentAcreage =
    selectedFarm === 'namari'
      ? farmAcreages.namari
      : selectedFarm === 'adukidathan'
      ? farmAcreages.adukidathan
      : farmAcreages.namari + farmAcreages.adukidathan;

  // Flush summary metrics for Cardamom (computed using configured acreage)
  const flushSummary: FlushSummary = calculateFlushSummary(
    harvestEntries,
    currentFlush,
    selectedFarm,
    currentAcreage
  );

  // Filtered harvest entries for current crop
  const filteredHarvestEntries = harvestEntries.filter(
    (e) => e.cropId === selectedCropId
  );

  return (
    <ScreenContainer header={<AppHeader />}>
      {/* Sub-tabs: Fresh & Dry Picking vs Curing & Processing */}
      <View
        style={[
          styles.subTabBarContainer,
          { backgroundColor: colors.card, borderBottomColor: colors.cardBorder },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.subTabBtn,
            subTab === 'picking' && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
          onPress={() => setSubTab('picking')}
        >
          <Ionicons
            name="basket-outline"
            size={16}
            color={subTab === 'picking' ? '#FFFFFF' : colors.textMuted}
          />
          <Text
            style={[
              styles.subTabText,
              { color: subTab === 'picking' ? '#FFFFFF' : colors.text },
              subTab === 'picking' && styles.subTabTextActive,
            ]}
          >
            {t('freshDryPicking')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.subTabBtn,
            subTab === 'curing' && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
          onPress={() => setSubTab('curing')}
        >
          <Ionicons
            name="flame-outline"
            size={16}
            color={subTab === 'curing' ? '#FFFFFF' : colors.textMuted}
          />
          <Text
            style={[
              styles.subTabText,
              { color: subTab === 'curing' ? '#FFFFFF' : colors.text },
              subTab === 'curing' && styles.subTabTextActive,
            ]}
          >
            {t('curingAndProcessing')}
          </Text>
        </TouchableOpacity>
      </View>

      {subTab === 'curing' ? (
        <CuringScreen hideHeader={true} />
      ) : (
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
        {/* Context & Config Action Bar */}
        <View style={styles.topContextBar}>
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={[styles.contextTitle, { color: colors.text }]}>
                {t('cropHarvestLedger')}
              </Text>
              <Text style={[styles.contextSubtitle, { color: isDark ? colors.primaryLight : colors.primary }]}>
                {translateUserText(selectedFarmOption.label)} ({selectedFarmOption.shortCode}) • {t('fieldPickings')}
              </Text>
            </View>

            {/* Quick config buttons */}
            <View style={styles.headerBtnGroup}>
              <TouchableOpacity
                onPress={() => setShowAcreageModal(true)}
                style={[styles.smallConfigBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <Ionicons name="map-outline" size={14} color={colors.primary} />
                <Text style={[styles.smallConfigBtnText, { color: colors.text }]}>
                  {currentAcreage} ac
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowLaborGroupsModal(true)}
                style={[styles.smallConfigBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <Ionicons name="people-outline" size={14} color={colors.primary} />
                <Text style={[styles.smallConfigBtnText, { color: colors.text }]}>
                  {t('teams')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowExportModal(true)}
                style={[styles.smallConfigBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
              >
                <Ionicons name="download-outline" size={14} color={colors.primary} />
                <Text style={[styles.smallConfigBtnText, { color: colors.primary }]}>
                  {t('exportBtn')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>



        {/* CROP TABS SELECTOR */}
        <View style={styles.tabsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {crops.map((crop) => {
              const isSelected = selectedCropId === crop.id;
              return (
                <TouchableOpacity
                  key={crop.id}
                  onPress={() => setSelectedCropId(crop.id)}
                  style={[
                    styles.cropTab,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.card,
                      borderColor: isSelected ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      crop.id === 'cardamom'
                        ? 'flower'
                        : crop.id === 'pepper'
                        ? 'nutrition'
                        : crop.id === 'coffee'
                        ? 'cafe'
                        : crop.id === 'arecanut'
                        ? 'grid'
                        : 'leaf'
                    }
                    size={15}
                    color={isSelected ? '#FFFFFF' : isDark ? colors.primaryLight : colors.primary}
                  />
                  <Text
                    style={[
                      styles.cropTabText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {translateUserText(crop.name)}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Add Crop Button */}
            <TouchableOpacity
              onPress={() => setShowAddCropModal(true)}
              style={[
                styles.addCropBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="add-circle" size={15} color={colors.primary} />
              <Text style={[styles.addCropText, { color: colors.primary }]}>{t('addCrop')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* CARDAMOM PER-FLUSH METRICS & LOCK BANNER */}
        {isCardamom && (
          <FlushMetricsBanner
            currentFlush={currentFlush}
            onSelectFlush={setCurrentFlush}
            summary={flushSummary}
            farmId={selectedFarm}
            onToggleLock={handleToggleFlushLock}
            flushes={cardamomFlushes}
            onAddNewFlush={() => setShowLogHarvestModal(true)}
          />
        )}

        {/* MAIN SECTION: CROP DAILY PICKINGS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="basket" size={18} color={isDark ? colors.primaryLight : colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {translateUserText(currentCrop ? currentCrop.name : 'Crop')} {t('dailyPickings')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setEditingEntry(null);
                setShowLogHarvestModal(true);
              }}
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add-circle" size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>{t('logWeighment')}</Text>
            </TouchableOpacity>
          </View>

          <DailyHarvestList
            entries={filteredHarvestEntries}
            onEditEntry={handleOpenEdit}
            onDeleteEntry={handleDeleteHarvest}
            onOpenLogModal={() => {
              setEditingEntry(null);
              setShowLogHarvestModal(true);
            }}
            cropName={currentCrop ? currentCrop.name : 'Crop'}
          />
        </View>
      </ScrollView>
      )}

      {/* Modals */}
      <LogHarvestModal
        visible={showLogHarvestModal}
        onClose={() => {
          setShowLogHarvestModal(false);
          setEditingEntry(null);
        }}
        crops={crops}
        defaultCropId={selectedCropId}
        defaultFarmId={selectedFarm}
        workers={workers}
        editingEntry={editingEntry}
        onSaveHarvest={handleSaveHarvest}
        onUpdateHarvest={handleUpdateHarvest}
      />

      <AddCropModal
        visible={showAddCropModal}
        onClose={() => setShowAddCropModal(false)}
        onAddCrop={handleAddCrop}
      />

      <FarmAcreageModal
        visible={showAcreageModal}
        onClose={() => setShowAcreageModal(false)}
        currentAcreages={farmAcreages}
        onSave={handleSaveAcreages}
      />

      <ManageLaborGroupsModal
        visible={showLaborGroupsModal}
        onClose={() => setShowLaborGroupsModal(false)}
        contractorGroups={contractorGroups}
        onAddGroup={handleAddLaborGroup}
        onUpdateGroup={handleUpdateLaborGroup}
        onDeleteGroup={handleDeleteLaborGroup}
      />

      {/* Harvest Records Export Modal */}
      <ReportExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultHead="harvest"
      />
    </ScreenContainer>
  );
};


const styles = StyleSheet.create({
  subTabBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  subTabTextActive: {
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 40,
    gap: 10,
  },
  topContextBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  smallConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  smallConfigBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
  tabsRow: {
    marginVertical: 4,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  cropTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  cropTabText: {
    fontSize: 12,
  },
  addCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addCropText: {
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    gap: 10,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
