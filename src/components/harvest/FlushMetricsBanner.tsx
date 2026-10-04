import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FlushSummary } from '../../types/harvest';
import { FarmId, FARM_OPTIONS } from '../../types/farm';

interface FlushMetricsBannerProps {
  currentFlush: string;
  onSelectFlush: (flush: string) => void;
  summary: FlushSummary;
  farmId: FarmId;
  onToggleLock: (flush: string, lock: boolean) => void;
  flushes?: string[];
  onAddNewFlush?: () => void;
}

export const FlushMetricsBanner: React.FC<FlushMetricsBannerProps> = ({
  currentFlush,
  onSelectFlush,
  summary,
  farmId,
  onToggleLock,
  flushes,
  onAddNewFlush,
}) => {
  const { colors, isDark } = useTheme();
  const farmMeta = FARM_OPTIONS.find((f) => f.id === farmId);
  const flushList = flushes && flushes.length > 0 ? flushes : ['1st Flush', '2nd Flush', '3rd Flush', '4th Flush'];

  const confirmToggleLock = () => {
    if (summary.isLocked) {
      Alert.alert(
        'Unlock Flush',
        `Unlock ${currentFlush}? This will re-enable editing and deleting for all harvest records in this flush.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unlock Flush', onPress: () => onToggleLock(currentFlush, false) },
        ]
      );
    } else {
      Alert.alert(
        'Complete & Lock Flush',
        `Lock ${currentFlush}? Once locked, all harvest entries for this flush are frozen against changes to protect audit records.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Lock Flush',
            style: 'destructive',
            onPress: () => onToggleLock(currentFlush, true),
          },
        ]
      );
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#141E17' : '#F0FDF4',
          borderColor: summary.isLocked
            ? isDark
              ? '#B45309'
              : '#FCD34D'
            : isDark
            ? '#26422F'
            : '#BBF7D0',
        },
      ]}
    >
      {/* Top Row: Flush Selector & Lock Button */}
      <View style={styles.topRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: 'center' }} style={{ flex: 1, marginRight: 8 }}>
          {flushList.map((fl) => {
            const isSelected = currentFlush === fl;
            return (
              <TouchableOpacity
                key={fl}
                onPress={() => onSelectFlush(fl)}
                style={[
                  styles.flushChip,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? colors.primary
                        : colors.primary
                      : colors.card,
                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.flushChipText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textMuted,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {fl}
                </Text>
              </TouchableOpacity>
            );
          })}
          {onAddNewFlush && (
            <TouchableOpacity
              onPress={onAddNewFlush}
              style={[styles.flushChip, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderStyle: 'dashed' }]}
            >
              <Ionicons name="add" size={13} color={colors.primary} />
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Lock / Unlock Action Button */}
        <TouchableOpacity
          onPress={confirmToggleLock}
          style={[
            styles.lockBtn,
            {
              backgroundColor: summary.isLocked
                ? '#F59E0B25'
                : 'rgba(34, 197, 94, 0.15)',
              borderColor: summary.isLocked ? '#D97706' : colors.primary,
            },
          ]}
        >
          <Ionicons
            name={summary.isLocked ? 'lock-closed' : 'lock-open-outline'}
            size={13}
            color={summary.isLocked ? '#D97706' : colors.primary}
          />
          <Text
            style={[
              styles.lockBtnText,
              { color: summary.isLocked ? '#D97706' : colors.primary },
            ]}
          >
            {summary.isLocked ? 'Locked' : 'Lock Flush'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Header Info */}
      <View style={styles.headerInfo}>
        <View style={styles.titleWithBadge}>
          <Text style={[styles.flushTitle, { color: colors.text }]}>
            {currentFlush} Performance Metrics
          </Text>
          <Text style={[styles.acreageBadge, { color: colors.textMuted }]}>
            ({farmMeta?.label || 'Estate'} • {summary.acreage} Acres)
          </Text>
        </View>
        <Text style={[styles.statusIndicator, { color: summary.isLocked ? '#D97706' : '#16A34A' }]}>
          {summary.isLocked ? '🔒 Flush Done & Locked' : '🟢 Picking in Progress'}
        </Text>
      </View>

      {/* 4-Stat Grid: Fresh, Dry, Fresh/Acre, Dry/Acre */}
      <View style={styles.statsGrid}>
        {/* Fresh Net */}
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Flush Fresh (Net)</Text>
          <View style={styles.statValueRow}>
            <Text style={[styles.statNum, { color: colors.text }]}>
              {summary.totalFreshNetKg.toLocaleString()}
            </Text>
            <Text style={[styles.statUnit, { color: isDark ? colors.primaryLight : colors.primary }]}>
              kg
            </Text>
          </View>
          <Text style={[styles.statSub, { color: colors.textMuted }]}>
            Gross: {summary.totalFreshGrossKg.toLocaleString()} kg
          </Text>
        </View>

        {/* Dry Net */}
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Flush Dry Produce</Text>
          <View style={styles.statValueRow}>
            <Text style={[styles.statNum, { color: colors.text }]}>
              {summary.totalDryNetKg.toLocaleString()}
            </Text>
            <Text style={[styles.statUnit, { color: '#D97706' }]}>kg</Text>
          </View>
          <Text style={[styles.statSub, { color: colors.textMuted }]}>
            {summary.totalFreshNetKg > 0
              ? `${((summary.totalDryNetKg / summary.totalFreshNetKg) * 100).toFixed(1)}% recovery`
              : '—'}
          </Text>
        </View>

        {/* Per Acre Fresh */}
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Fresh Yield / Acre</Text>
          <View style={styles.statValueRow}>
            <Text style={[styles.statNum, { color: isDark ? colors.primaryLight : colors.primary }]}>
              {summary.freshKgPerAcre}
            </Text>
            <Text style={[styles.statUnit, { color: colors.textMuted }]}>kg/ac</Text>
          </View>
          <Text style={[styles.statSub, { color: colors.textMuted }]}>
            On {summary.acreage} acres
          </Text>
        </View>

        {/* Per Acre Dry */}
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Dry Yield / Acre</Text>
          <View style={styles.statValueRow}>
            <Text style={[styles.statNum, { color: '#D97706' }]}>
              {summary.dryKgPerAcre}
            </Text>
            <Text style={[styles.statUnit, { color: colors.textMuted }]}>kg/ac</Text>
          </View>
          <Text style={[styles.statSub, { color: colors.textMuted }]}>
            Cured yield/ac
          </Text>
        </View>
      </View>

      {/* Labor Productivity Row */}
      {summary.totalWorkerHeadcount > 0 && (
        <View style={[styles.laborFooter, { borderTopColor: colors.border }]}>
          <Ionicons name="people" size={14} color={colors.primary} />
          <Text style={[styles.laborFooterText, { color: colors.textMuted }]}>
            {summary.totalPickingDays} picking days • {summary.totalWorkerHeadcount} worker days • Average{' '}
            <Text style={{ fontWeight: '800', color: colors.text }}>
              {summary.averageKgPerWorker} kg/person/day
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 10,
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
  flushChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  flushChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  flushChipText: {
    fontSize: 11,
  },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  lockBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  flushTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  acreageBadge: {
    fontSize: 11,
  },
  statusIndicator: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: '47%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: 2,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '700',
  },
  statSub: {
    fontSize: 10,
    marginTop: 2,
  },
  laborFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  laborFooterText: {
    fontSize: 11,
    flex: 1,
  },
});
