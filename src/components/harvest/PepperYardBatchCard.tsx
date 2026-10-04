import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { PepperDryingBatch } from '../../types/harvest';
import { FARM_OPTIONS } from '../../types/farm';

interface PepperYardBatchCardProps {
  batch: PepperDryingBatch;
  onCompleteBatch: (batch: PepperDryingBatch) => void;
}

export const PepperYardBatchCard: React.FC<PepperYardBatchCardProps> = ({
  batch,
  onCompleteBatch,
}) => {
  const { colors, isDark } = useTheme();
  const farmMeta = FARM_OPTIONS.find((f) => f.id === batch.farmId);
  const isDrying = batch.status === 'drying';
  const isCompleted = batch.status === 'completed';

  const variance = batch.varianceFromBenchmark ?? 0;
  const isGain = variance >= 0;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
    >
      {/* Top Meta Row */}
      <View style={styles.topRow}>
        <View style={styles.badgesRow}>
          {farmMeta && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    batch.farmId === 'namari'
                      ? 'rgba(34, 197, 94, 0.15)'
                      : 'rgba(59, 130, 246, 0.15)',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color:
                      batch.farmId === 'namari'
                        ? isDark
                          ? colors.primaryLight
                          : colors.primary
                        : '#3B82F6',
                  },
                ]}
              >
                {farmMeta.shortCode}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.badge,
              {
                backgroundColor: isDrying ? '#0D948825' : '#10B98125',
              },
            ]}
          >
            <Ionicons
              name={isDrying ? 'sunny' : 'checkmark-done'}
              size={12}
              color={isDrying ? '#0D9488' : '#10B981'}
            />
            <Text
              style={[
                styles.badgeText,
                { color: isDrying ? '#0D9488' : '#10B981' },
              ]}
            >
              {isDrying ? `DAY ${batch.dryingDays} IN SOLAR YARD` : 'COMPLETED'}
            </Text>
          </View>
        </View>

        <Text style={[styles.batchCode, { color: colors.textMuted }]}>{batch.id}</Text>
      </View>

      {/* Weights Box */}
      <View
        style={[
          styles.weightsBox,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <View style={styles.weightItem}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Fresh Spikes</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {batch.freshSpikesWeightKg}
            <Text style={styles.metricUnit}> kg</Text>
          </Text>
          <Text style={[styles.metricDate, { color: colors.textMuted }]}>
            {batch.startDate}
          </Text>
        </View>

        <View style={styles.arrowCol}>
          <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
        </View>

        <View style={styles.weightItem}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Threshed Berries</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {batch.threshedBerriesWeightKg}
            <Text style={styles.metricUnit}> kg</Text>
          </Text>
          <Text style={[styles.metricDate, { color: colors.textMuted }]}>
            Green berry
          </Text>
        </View>

        <View style={styles.arrowCol}>
          <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
        </View>

        <View style={styles.weightItem}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Black Dry Pepper</Text>
          <Text
            style={[
              styles.metricValue,
              { color: isCompleted ? '#10B981' : colors.textMuted },
            ]}
          >
            {batch.dryBlackPepperKg ? `${batch.dryBlackPepperKg}` : '—'}
            {batch.dryBlackPepperKg && <Text style={styles.metricUnit}> kg</Text>}
          </Text>
          <Text style={[styles.metricDate, { color: colors.textMuted }]}>
            {batch.completedDate || 'In Yard'}
          </Text>
        </View>
      </View>

      {/* Recovery Outturn Pill */}
      {isCompleted && (
        <View style={styles.outturnRow}>
          <Text style={[styles.outturnLabel, { color: colors.textMuted }]}>
            Drying Outturn Recovery:
          </Text>
          <View style={styles.outturnPill}>
            <Text style={[styles.outturnValue, { color: isGain ? '#16A34A' : '#D97706' }]}>
              {batch.recoveryPercentage}%
            </Text>
            <Text style={[styles.varianceText, { color: colors.textMuted }]}>
              ({isGain ? `+${variance}%` : `${variance}%`} vs {batch.benchmarkOutturnPercentage}% benchmark)
            </Text>
          </View>
        </View>
      )}

      {batch.notes && (
        <Text style={[styles.notesText, { color: colors.textMuted }]}>
          {batch.notes}
        </Text>
      )}

      {/* Action Button */}
      {isDrying && (
        <TouchableOpacity
          onPress={() => onCompleteBatch(batch)}
          style={[styles.completeBtn, { backgroundColor: '#0D9488' }]}
        >
          <Ionicons name="checkmark-done-circle" size={16} color="#FFFFFF" />
          <Text style={styles.completeBtnText}>Record Dried Black Pepper Weight</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  batchCode: {
    fontSize: 11,
    fontWeight: '600',
  },
  weightsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  weightItem: {
    flex: 2,
    alignItems: 'center',
  },
  arrowCol: {
    paddingHorizontal: 2,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricDate: {
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  outturnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outturnLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  outturnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  outturnValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  varianceText: {
    fontSize: 11,
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
