import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ConsolidatedSeasonIntelligence } from '../../types/harvest';

interface ConsolidatedIntelligenceCardProps {
  intelligence: ConsolidatedSeasonIntelligence;
  onConfigureAcreage?: () => void;
}

export const ConsolidatedIntelligenceCard: React.FC<ConsolidatedIntelligenceCardProps> = ({
  intelligence,
  onConfigureAcreage,
}) => {
  const { colors, isDark } = useTheme();

  const {
    seasonYear,
    asOfDate,
    totalWorkersDeployed,
    totalFreshNetKg,
    totalDryNetKg,
    averageOutturnPercentage,
    farmBreakdown,
    contractorBreakdown,
    dryerIntelligence,
    totalFuelConsumed,
    flushesBreakdown,
  } = intelligence;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#111A14' : '#F0FDF4',
          borderColor: isDark ? '#233F2E' : '#BBF7D0',
        },
      ]}
    >
      {/* Header with Live Timestamp */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Ionicons name="analytics" size={18} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>
              Consolidated Plantation Intelligence
            </Text>
          </View>
          <View style={styles.timestampRow}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.timestampText, { color: colors.textMuted }]}>
              As of: <Text style={{ fontWeight: '700', color: colors.text }}>{asOfDate}</Text> • Season {seasonYear}
            </Text>
          </View>
        </View>

        {onConfigureAcreage && (
          <TouchableOpacity
            onPress={onConfigureAcreage}
            style={[styles.acreageBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="map-outline" size={13} color={colors.primary} />
            <Text style={[styles.acreageBtnText, { color: colors.primary }]}>Acreage</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Top 4 Key Metric Tiles */}
      <View style={styles.metricTilesRow}>
        <View style={[styles.metricTile, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.tileLabel, { color: colors.textMuted }]}>WORKERS</Text>
          <Text style={[styles.tileValue, { color: colors.text }]}>{totalWorkersDeployed}</Text>
          <Text style={[styles.tileSub, { color: colors.textMuted }]}>Pickers Deployed</Text>
        </View>

        <View style={[styles.metricTile, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.tileLabel, { color: colors.primary }]}>FRESH NET</Text>
          <Text style={[styles.tileValue, { color: colors.primary }]}>
            {totalFreshNetKg.toLocaleString()}
          </Text>
          <Text style={[styles.tileSub, { color: colors.textMuted }]}>kg harvested</Text>
        </View>

        <View style={[styles.metricTile, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.tileLabel, { color: '#D97706' }]}>DRY PRODUCE</Text>
          <Text style={[styles.tileValue, { color: '#D97706' }]}>
            {totalDryNetKg.toLocaleString()}
          </Text>
          <Text style={[styles.tileSub, { color: colors.textMuted }]}>kg cured</Text>
        </View>

        <View style={[styles.metricTile, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.tileLabel, { color: '#16A34A' }]}>OUTTURN</Text>
          <Text style={[styles.tileValue, { color: '#16A34A' }]}>
            {averageOutturnPercentage}%
          </Text>
          <Text style={[styles.tileSub, { color: colors.textMuted }]}>Dry recovery</Text>
        </View>
      </View>

      {/* Farm Acreage & Yield Performance (Namari vs Adukidathan) */}
      <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.sectionBoxHeader}>
          <Text style={[styles.sectionBoxTitle, { color: colors.text }]}>
            Per-Farm Harvest & Land Yield (Per Acre)
          </Text>
        </View>

        <View style={styles.farmsRow}>
          {/* Namari */}
          <View style={[styles.farmCard, { borderColor: colors.border }]}>
            <View style={styles.farmTitleCluster}>
              <Text style={[styles.farmName, { color: colors.text }]}>Namari Farm</Text>
              <View style={[styles.farmAcreBadge, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                <Text style={[styles.farmAcreText, { color: colors.primary }]}>
                  {farmBreakdown.namari.acreage} Acres
                </Text>
              </View>
            </View>

            <View style={styles.farmStatsGrid}>
              <View style={styles.farmStatItem}>
                <Text style={[styles.farmStatNum, { color: colors.primary }]}>
                  {farmBreakdown.namari.totalFreshKg.toFixed(0)} kg
                </Text>
                <Text style={[styles.farmStatDesc, { color: colors.textMuted }]}>
                  Fresh ({farmBreakdown.namari.freshKgPerAcre} kg/ac)
                </Text>
              </View>

              <View style={styles.farmStatItem}>
                <Text style={[styles.farmStatNum, { color: '#D97706' }]}>
                  {farmBreakdown.namari.totalDryKg.toFixed(0)} kg
                </Text>
                <Text style={[styles.farmStatDesc, { color: colors.textMuted }]}>
                  Dry ({farmBreakdown.namari.dryKgPerAcre} kg/ac)
                </Text>
              </View>

              <View style={styles.farmStatItem}>
                <Text style={[styles.farmStatNum, { color: colors.text }]}>
                  {farmBreakdown.namari.totalWorkers}
                </Text>
                <Text style={[styles.farmStatDesc, { color: colors.textMuted }]}>Workers</Text>
              </View>
            </View>
          </View>

          {/* Adukidathan */}
          <View style={[styles.farmCard, { borderColor: colors.border }]}>
            <View style={styles.farmTitleCluster}>
              <Text style={[styles.farmName, { color: colors.text }]}>Adukidathan Farm</Text>
              <View style={[styles.farmAcreBadge, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <Text style={[styles.farmAcreText, { color: '#3B82F6' }]}>
                  {farmBreakdown.adukidathan.acreage} Acres
                </Text>
              </View>
            </View>

            <View style={styles.farmStatsGrid}>
              <View style={styles.farmStatItem}>
                <Text style={[styles.farmStatNum, { color: colors.primary }]}>
                  {farmBreakdown.adukidathan.totalFreshKg.toFixed(0)} kg
                </Text>
                <Text style={[styles.farmStatDesc, { color: colors.textMuted }]}>
                  Fresh ({farmBreakdown.adukidathan.freshKgPerAcre} kg/ac)
                </Text>
              </View>

              <View style={styles.farmStatItem}>
                <Text style={[styles.farmStatNum, { color: '#D97706' }]}>
                  {farmBreakdown.adukidathan.totalDryKg.toFixed(0)} kg
                </Text>
                <Text style={[styles.farmStatDesc, { color: colors.textMuted }]}>
                  Dry ({farmBreakdown.adukidathan.dryKgPerAcre} kg/ac)
                </Text>
              </View>

              <View style={styles.farmStatItem}>
                <Text style={[styles.farmStatNum, { color: colors.text }]}>
                  {farmBreakdown.adukidathan.totalWorkers}
                </Text>
                <Text style={[styles.farmStatDesc, { color: colors.textMuted }]}>Workers</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Cardamom Flushes Breakdown per Farm */}
      {Object.keys(flushesBreakdown).length > 0 && (
        <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionBoxTitle, { color: colors.text }]}>
            Cardamom Flush Yields & Headcount per Farm
          </Text>

          <View style={styles.flushTable}>
            <View style={[styles.flushTableRow, styles.flushTableHead, { borderBottomColor: colors.border }]}>
              <Text style={[styles.thCell, { flex: 1.5, color: colors.textMuted }]}>Flush</Text>
              <Text style={[styles.thCell, { flex: 1.5, color: colors.textMuted }]}>Namari</Text>
              <Text style={[styles.thCell, { flex: 1.5, color: colors.textMuted }]}>Adukidathan</Text>
              <Text style={[styles.thCell, { flex: 1.5, color: colors.textMuted }]}>Total Fresh</Text>
              <Text style={[styles.thCell, { flex: 1.2, color: colors.textMuted }]}>Workers</Text>
            </View>

            {Object.entries(flushesBreakdown).map(([fl, data]) => (
              <View key={fl} style={[styles.flushTableRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '700', color: colors.text }]}>
                  {fl}
                </Text>
                <Text style={[styles.tdCell, { flex: 1.5, color: colors.primary }]}>
                  {data.namariFreshKg.toFixed(0)} kg
                </Text>
                <Text style={[styles.tdCell, { flex: 1.5, color: '#3B82F6' }]}>
                  {data.adukidathanFreshKg.toFixed(0)} kg
                </Text>
                <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '700', color: colors.text }]}>
                  {data.totalFreshKg.toFixed(0)} kg
                </Text>
                <Text style={[styles.tdCell, { flex: 1.2, color: colors.textMuted }]}>
                  {data.totalWorkers}p
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Labor Contractor Group Breakdown */}
      {Object.keys(contractorBreakdown).length > 0 && (
        <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionBoxTitle, { color: colors.text }]}>
            Contractor Team Productivity (Per Person Daily Output)
          </Text>

          <View style={styles.contractorCardsRow}>
            {Object.entries(contractorBreakdown).map(([key, cg]) => (
              <View
                key={key}
                style={[
                  styles.contractorCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: cg.isOwnEstate ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={styles.contractorCardHeader}>
                  <Text
                    style={[
                      styles.contractorName,
                      { color: cg.isOwnEstate ? colors.primary : colors.text },
                    ]}
                  >
                    {cg.groupName}
                  </Text>
                  <Text style={[styles.contractorHeadcount, { color: colors.textMuted }]}>
                    {cg.totalWorkers} workers
                  </Text>
                </View>

                <View style={styles.contractorYieldRow}>
                  <Text style={[styles.contractorYieldText, { color: colors.text }]}>
                    {cg.totalFreshKg.toFixed(0)}kg fresh • {cg.totalDryKg.toFixed(0)}kg dry
                  </Text>
                  <View style={[styles.ratePill, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                    <Text style={[styles.ratePillText, { color: colors.primary }]}>
                      ⚡ {cg.freshKgPerWorker.toFixed(1)} kg / person
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Dryer Performance & Fuel Consumption Dual Grid */}
      <View style={styles.dualGrid}>
        {/* Dryer Operations: Own vs Rented */}
        <View
          style={[
            styles.halfSectionBox,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.boxTitleRow}>
            <Ionicons name="flame" size={15} color="#D97706" />
            <Text style={[styles.sectionBoxTitle, { color: colors.text }]}>
              Dryer Running Days
            </Text>
          </View>

          <View style={styles.dryerRunRow}>
            <View style={styles.dryerRunItem}>
              <Text style={[styles.dryerRunDays, { color: colors.primary }]}>
                {dryerIntelligence.ownRunningDays.toFixed(1)}
              </Text>
              <Text style={[styles.dryerRunLabel, { color: colors.textMuted }]}>
                Own Dryer Days ({dryerIntelligence.ownBatchesCount} b.)
              </Text>
              <Text style={[styles.dryerRunOutturn, { color: colors.primary }]}>
                {dryerIntelligence.ownAvgOutturn}% outturn
              </Text>
            </View>

            <View style={styles.dryerRunDivider} />

            <View style={styles.dryerRunItem}>
              <Text style={[styles.dryerRunDays, { color: '#D97706' }]}>
                {dryerIntelligence.rentedRunningDays.toFixed(1)}
              </Text>
              <Text style={[styles.dryerRunLabel, { color: colors.textMuted }]}>
                Rented Days ({dryerIntelligence.rentedBatchesCount} b.)
              </Text>
              <Text style={[styles.dryerRunOutturn, { color: '#D97706' }]}>
                {dryerIntelligence.rentedAvgOutturn}% outturn
              </Text>
            </View>
          </View>
        </View>

        {/* Fuel Consumption Totals */}
        <View
          style={[
            styles.halfSectionBox,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.boxTitleRow}>
            <Ionicons name="speedometer-outline" size={15} color="#EF4444" />
            <Text style={[styles.sectionBoxTitle, { color: colors.text }]}>
              Fuel Consumed Total
            </Text>
          </View>

          <View style={styles.fuelGrid}>
            <View style={styles.fuelItem}>
              <Text style={[styles.fuelValue, { color: colors.text }]}>
                {totalFuelConsumed.firewoodBundles}
              </Text>
              <Text style={[styles.fuelLabel, { color: colors.textMuted }]}>🪵 Firewood (bundles)</Text>
            </View>

            <View style={styles.fuelItem}>
              <Text style={[styles.fuelValue, { color: colors.text }]}>
                {totalFuelConsumed.dieselLiters.toFixed(1)}
              </Text>
              <Text style={[styles.fuelLabel, { color: colors.textMuted }]}>⛽ Diesel (L)</Text>
            </View>

            <View style={styles.fuelItem}>
              <Text style={[styles.fuelValue, { color: colors.text }]}>
                {totalFuelConsumed.petrolLiters.toFixed(1)}
              </Text>
              <Text style={[styles.fuelLabel, { color: colors.textMuted }]}>⛽ Petrol (L)</Text>
            </View>

            <View style={styles.fuelItem}>
              <Text style={[styles.fuelValue, { color: colors.text }]}>
                {totalFuelConsumed.engineOilLiters.toFixed(1)}
              </Text>
              <Text style={[styles.fuelLabel, { color: colors.textMuted }]}>🛢️ Engine Oil (L)</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestampText: {
    fontSize: 11,
  },
  acreageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  acreageBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricTilesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tileValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  tileSub: {
    fontSize: 9,
    marginTop: 1,
  },
  sectionBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  sectionBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  farmsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  farmCard: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  farmTitleCluster: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  farmName: {
    fontSize: 12,
    fontWeight: '700',
  },
  farmAcreBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  farmAcreText: {
    fontSize: 10,
    fontWeight: '800',
  },
  farmStatsGrid: {
    gap: 2,
  },
  farmStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  farmStatNum: {
    fontSize: 12,
    fontWeight: '800',
  },
  farmStatDesc: {
    fontSize: 10,
  },
  flushTable: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  flushTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
  },
  flushTableHead: {
    paddingBottom: 4,
  },
  thCell: {
    fontSize: 10,
    fontWeight: '700',
  },
  tdCell: {
    fontSize: 11,
  },
  contractorCardsRow: {
    gap: 6,
  },
  contractorCard: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  contractorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contractorName: {
    fontSize: 12,
    fontWeight: '700',
  },
  contractorHeadcount: {
    fontSize: 11,
  },
  contractorYieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contractorYieldText: {
    fontSize: 11,
  },
  ratePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  dualGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  halfSectionBox: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  boxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dryerRunRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  dryerRunItem: {
    alignItems: 'center',
  },
  dryerRunDays: {
    fontSize: 16,
    fontWeight: '900',
  },
  dryerRunLabel: {
    fontSize: 9,
    marginTop: 1,
    textAlign: 'center',
  },
  dryerRunOutturn: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  dryerRunDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  fuelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  fuelItem: {
    width: '46%',
  },
  fuelValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  fuelLabel: {
    fontSize: 9,
    marginTop: 1,
  },
});
