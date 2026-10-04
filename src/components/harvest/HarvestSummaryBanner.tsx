import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { HarvestSummary } from '../../types/harvest';
import { BenchmarkConfigModal } from './BenchmarkConfigModal';

interface HarvestSummaryBannerProps {
  summary: HarvestSummary;
  onUpdateBenchmarks: (cardamom: number, pepper: number) => void;
}

export const HarvestSummaryBanner: React.FC<HarvestSummaryBannerProps> = ({
  summary,
  onUpdateBenchmarks,
}) => {
  const { colors, isDark } = useTheme();
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);

  const { ownBatches, rentedBatches, outturnAdvantage, rentedDryerBreakdown } =
    summary.dryerComparison;

  const hasCuringData = ownBatches.batchesCount > 0 || rentedBatches.batchesCount > 0;

  return (
    <View style={styles.container}>
      {/* 4-Stat Grid */}
      <View style={styles.grid}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            Cardamom Picked
          </Text>
          <View style={styles.valueRow}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {summary.totalCardamomGreenKg.toLocaleString()}
            </Text>
            <Text style={[styles.unit, { color: isDark ? colors.primaryLight : colors.primary }]}>
              kg
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            Pepper Harvested
          </Text>
          <View style={styles.valueRow}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {summary.totalPepperFreshKg.toLocaleString()}
            </Text>
            <Text style={[styles.unit, { color: '#0D9488' }]}>kg</Text>
          </View>
        </View>

        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            Curing Batches
          </Text>
          <View style={styles.valueRow}>
            <Text style={[styles.statValue, { color: '#D97706' }]}>
              {summary.activeCuringBatchesCount}
            </Text>
            <Text style={[styles.unit, { color: colors.textMuted }]}>
              act / {summary.completedCuringBatchesCount} done
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.labelWithIcon}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Avg Outturn</Text>
            <TouchableOpacity onPress={() => setShowBenchmarkModal(true)}>
              <Ionicons name="settings-outline" size={13} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.valueRow}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {summary.averageCuringOutturn > 0 ? `${summary.averageCuringOutturn}%` : '—'}
            </Text>
            <Text style={[styles.unit, { color: colors.textMuted }]}>
              (Target {summary.estateBenchmarkOutturn}%)
            </Text>
          </View>
        </View>
      </View>

      {/* OWN vs RENTED DRYER COMPARATIVE ANALYTICS CARD */}
      {hasCuringData && (
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
                Dryer Performance: Own vs. Rented
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowBenchmarkModal(true)}
              style={styles.benchmarkBadge}
            >
              <Text style={[styles.benchmarkText, { color: colors.primary }]}>
                Target: {summary.estateBenchmarkOutturn}%
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
                <Text style={[styles.dryerTagText, { color: colors.primary }]}>Own Dryer</Text>
              </View>
              <Text style={[styles.columnRecovery, { color: colors.text }]}>
                {ownBatches.averageOutturn > 0 ? `${ownBatches.averageOutturn}%` : '—'}
              </Text>
              <Text style={[styles.columnSub, { color: colors.textMuted }]}>
                {ownBatches.dryKg.toFixed(0)}kg dry / {ownBatches.greenKg.toFixed(0)}kg green
              </Text>
              <Text style={[styles.batchCount, { color: colors.textMuted }]}>
                {ownBatches.batchesCount} batch{ownBatches.batchesCount !== 1 ? 'es' : ''}
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
                <Text style={[styles.dryerTagText, { color: '#D97706' }]}>Rented Dryer</Text>
              </View>
              <Text style={[styles.columnRecovery, { color: colors.text }]}>
                {rentedBatches.averageOutturn > 0 ? `${rentedBatches.averageOutturn}%` : '—'}
              </Text>
              <Text style={[styles.columnSub, { color: colors.textMuted }]}>
                {rentedBatches.dryKg.toFixed(0)}kg dry / {rentedBatches.greenKg.toFixed(0)}kg green
              </Text>
              <Text style={[styles.batchCount, { color: colors.textMuted }]}>
                {rentedBatches.batchesCount} batch{rentedBatches.batchesCount !== 1 ? 'es' : ''}
              </Text>
            </View>
          </View>

          {/* Individual Rented Facility Breakdown */}
          {Object.keys(rentedDryerBreakdown).length > 0 && (
            <View style={styles.rentedList}>
              <Text style={[styles.rentedTitle, { color: colors.textMuted }]}>
                Rented Facilities Logged:
              </Text>
              <View style={styles.facilityChipsRow}>
                {Object.entries(rentedDryerBreakdown).map(([name, data]) => (
                  <View
                    key={name}
                    style={[
                      styles.facilityChip,
                      { backgroundColor: colors.background, borderColor: colors.border },
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

      {/* Benchmark modal */}
      <BenchmarkConfigModal
        visible={showBenchmarkModal}
        onClose={() => setShowBenchmarkModal(false)}
        currentCardamomBenchmark={summary.estateBenchmarkOutturn}
        currentPepperBenchmark={34.0}
        onSave={onUpdateBenchmarks}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  labelWithIcon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  unit: {
    fontSize: 12,
    fontWeight: '700',
  },
  comparisonCard: {
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
});
