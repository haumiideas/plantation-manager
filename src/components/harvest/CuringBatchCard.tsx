import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { CuringBatch } from '../../types/harvest';
import { FARM_OPTIONS } from '../../types/farm';

interface CuringBatchCardProps {
  batch: CuringBatch;
  onAddFiringLog: (batch: CuringBatch) => void;
  onCompleteBatch: (batch: CuringBatch) => void;
  onGradeBatch: (batch: CuringBatch) => void;
  onEditBatch?: (batch: CuringBatch) => void;
}

export const CuringBatchCard: React.FC<CuringBatchCardProps> = ({
  batch,
  onAddFiringLog,
  onCompleteBatch,
  onGradeBatch,
  onEditBatch,
}) => {
  const { colors, isDark } = useTheme();
  const [showLogs, setShowLogs] = useState(false);

  const farmMeta = FARM_OPTIONS.find((f) => f.id === batch.farmId);
  const isFiring = batch.status === 'firing' || batch.status === 'loading';
  const isCompleted = batch.status === 'completed' || batch.status === 'graded';
  const isGraded = batch.status === 'graded' && !!batch.grades;

  const isOwnDryer = batch.dryerType === 'own';
  const variance = batch.varianceFromBenchmark ?? 0;
  const isGain = variance >= 0;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
    >
      {/* Top Status & Dryer Ownership Row */}
      <View style={styles.topRow}>
        <View style={styles.badgeCluster}>
          {/* Farm */}
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

          {/* Dryer Type Badge */}
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isOwnDryer
                  ? isDark
                    ? '#14532D'
                    : '#DCFCE7'
                  : isDark
                  ? '#78350F'
                  : '#FEF3C7',
              },
            ]}
          >
            <Ionicons
              name={isOwnDryer ? 'home' : 'business'}
              size={12}
              color={isOwnDryer ? '#16A34A' : '#D97706'}
            />
            <Text
              style={[
                styles.badgeText,
                { color: isOwnDryer ? '#16A34A' : '#D97706' },
              ]}
            >
              {isOwnDryer ? 'Own Dryer' : 'Rented Dryer'}
            </Text>
          </View>

          {/* Batch Status */}
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isFiring
                  ? '#F59E0B25'
                  : isGraded
                  ? '#3B82F625'
                  : '#10B98125',
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: isFiring ? '#D97706' : isGraded ? '#2563EB' : '#059669',
                },
              ]}
            >
              {isFiring ? '● FIRING' : isGraded ? '✓ GRADED' : '✓ CURED'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.batchCode, { color: colors.textMuted }]}>{batch.id}</Text>
          {onEditBatch && (
            <TouchableOpacity
              onPress={() => onEditBatch(batch)}
              style={[
                styles.editBtn,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="pencil" size={12} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Dryer Facility Name */}
      <View style={styles.facilityRow}>
        <Text style={[styles.facilityName, { color: colors.text }]}>
          {batch.dryerName}
        </Text>
        {!isOwnDryer && batch.rentalCostPerKg && (
          <Text style={[styles.rentalRate, { color: '#D97706' }]}>
            ₹{batch.rentalCostPerKg}/kg fee
          </Text>
        )}
      </View>

      {/* Rented Dryer Client / Party Details */}
      {!isOwnDryer && (batch.partyName || batch.rentedDryerContact || batch.paymentStatus) && (
        <View style={[styles.partyDetailsBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Ionicons name="person-circle-outline" size={15} color={colors.primary} />
              <Text style={[styles.partyNameText, { color: colors.text }]} numberOfLines={1}>
                {batch.partyName || 'Customer'}
                {(batch.partyPhone || batch.rentedDryerContact) ? ` • ${batch.partyPhone || batch.rentedDryerContact}` : ''}
              </Text>
            </View>
            {batch.paymentStatus && (
              <View
                style={[
                  styles.paymentBadge,
                  {
                    backgroundColor:
                      batch.paymentStatus === 'paid'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : batch.paymentStatus === 'pending'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(59, 130, 246, 0.15)',
                    borderColor:
                      batch.paymentStatus === 'paid'
                        ? '#10B981'
                        : batch.paymentStatus === 'pending'
                        ? '#F59E0B'
                        : '#3B82F6',
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color:
                      batch.paymentStatus === 'paid'
                        ? '#10B981'
                        : batch.paymentStatus === 'pending'
                        ? '#D97706'
                        : '#2563EB',
                    textTransform: 'uppercase',
                  }}
                >
                  {batch.paymentStatus}
                </Text>
              </View>
            )}
          </View>
          {Boolean(batch.partyAddress) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.partyAddressText, { color: colors.textMuted }]} numberOfLines={1}>
                {batch.partyAddress}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Main Recovery & Weight Metric Grid */}
      <View
        style={[
          styles.weightsBox,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <View style={styles.weightItem}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Green Loaded</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {batch.greenWeightKg.toLocaleString()}
            <Text style={styles.metricUnit}> kg</Text>
          </Text>
          <Text style={[styles.metricDate, { color: colors.textMuted }]}>
            {batch.loadDate}
          </Text>
        </View>

        <View style={styles.arrowCol}>
          <Ionicons name="arrow-forward" size={18} color={colors.textMuted} />
        </View>

        <View style={styles.weightItem}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
            {isFiring ? 'Dry Expected' : 'Dry Recovered'}
          </Text>
          <Text
            style={[
              styles.metricValue,
              { color: isCompleted ? (isDark ? colors.primaryLight : colors.primary) : colors.textMuted },
            ]}
          >
            {batch.dryWeightKg ? `${batch.dryWeightKg.toLocaleString()}` : '—'}
            {batch.dryWeightKg && <Text style={styles.metricUnit}> kg</Text>}
          </Text>
          <Text style={[styles.metricDate, { color: colors.textMuted }]}>
            {batch.unloadDate || 'In chamber'}
          </Text>
        </View>

        {/* Recovery Outturn Badge */}
        <View style={styles.recoveryCol}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Actual Outturn</Text>
          <Text
            style={[
              styles.outturnValue,
              {
                color: isCompleted
                  ? isGain
                    ? '#16A34A'
                    : '#D97706'
                  : colors.textMuted,
              },
            ]}
          >
            {batch.recoveryPercentage ? `${batch.recoveryPercentage}%` : 'Pending'}
          </Text>

          {isCompleted && (
            <View
              style={[
                styles.variancePill,
                {
                  backgroundColor: isGain
                    ? isDark
                      ? '#14532D'
                      : '#DCFCE7'
                    : isDark
                    ? '#78350F'
                    : '#FEF3C7',
                },
              ]}
            >
              <Text
                style={[
                  styles.varianceText,
                  { color: isGain ? '#16A34A' : '#D97706' },
                ]}
              >
                {isGain ? `+${variance}%` : `${variance}%`} vs {batch.benchmarkOutturnPercentage}% bm
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Ripened Fruit / Separator Tray Breakdown */}
      {batch.ripenedFruitLoadedKg && batch.ripenedFruitLoadedKg > 0 ? (
        <View
          style={[
            styles.separatorTrayBox,
            { backgroundColor: isDark ? '#2D1B00' : '#FEF3C7', borderColor: '#D97706' },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="layers" size={13} color="#D97706" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>
              Separator Tray (Ripe Fruit):
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.text, marginTop: 2 }}>
            Loaded: <Text style={{ fontWeight: '700' }}>{batch.ripenedFruitLoadedKg} kg</Text>
            {batch.ripenedFruitDryKg ? (
              <>
                {' '}➔ Dried:{' '}
                <Text style={{ fontWeight: '700', color: '#16A34A' }}>
                  {batch.ripenedFruitDryKg} kg ({batch.ripenedFruitRecoveryPct || 0}%)
                </Text>
              </>
            ) : (
              <Text style={{ color: colors.textMuted }}> (Curing on separator)</Text>
            )}
            {batch.overallRecoveryPct ? (
              <Text style={{ fontWeight: '700', color: isDark ? colors.primaryLight : colors.primary }}>
                {' '}• Total Batch Outturn: {batch.overallRecoveryPct}%
              </Text>
            ) : null}
          </Text>
        </View>
      ) : null}

      {/* Firing Check summary (Temp & Firewood) */}
      <View style={styles.firingSummaryRow}>
        <View style={styles.firingMetric}>
          <Ionicons name="flame" size={14} color="#EF4444" />
          <Text style={[styles.firingText, { color: colors.text }]}>
            Wood: <Text style={{ fontWeight: '800' }}>{batch.totalFirewoodConsumed || 0}</Text> bundles
          </Text>
        </View>

        {batch.firingLogs.length > 0 && (
          <View style={styles.firingMetric}>
            <Ionicons name="thermometer" size={14} color="#F59E0B" />
            <Text style={[styles.firingText, { color: colors.text }]}>
              Latest: <Text style={{ fontWeight: '800' }}>{batch.firingLogs[batch.firingLogs.length - 1].tempCelsius}°C</Text>
            </Text>
          </View>
        )}

        {batch.firingLogs.length > 0 && (
          <TouchableOpacity onPress={() => setShowLogs(!showLogs)}>
            <Text style={[styles.viewLogsBtn, { color: colors.primary }]}>
              {showLogs ? 'Hide Logs' : `Logs (${batch.firingLogs.length})`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Expandable Firing Logs */}
      {showLogs && batch.firingLogs.length > 0 && (
        <View style={[styles.logsTable, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {batch.firingLogs.map((log) => (
            <View key={log.id} style={[styles.logRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.logTime, { color: colors.textMuted }]}>{log.timestamp}</Text>
              <Text style={[styles.logTemp, { color: '#F59E0B' }]}>{log.tempCelsius}°C</Text>
              <Text style={[styles.logWood, { color: colors.text }]}>{log.firewoodBundles} bundles</Text>
              {log.notes && <Text style={[styles.logNotes, { color: colors.textMuted }]}>{log.notes}</Text>}
            </View>
          ))}
        </View>
      )}

      {/* Quality Grading Breakdown (If Graded) */}
      {isGraded && batch.grades && (
        <View
          style={[
            styles.gradesContainer,
            { backgroundColor: isDark ? '#101B2B' : '#EFF6FF', borderColor: isDark ? '#1E3A8A' : '#BFDBFE' },
          ]}
        >
          <View style={styles.gradesHeader}>
            <Ionicons name="ribbon" size={14} color="#3B82F6" />
            <Text style={[styles.gradesTitle, { color: colors.text }]}>
              Quality Grading Breakdown
            </Text>
          </View>
          <View style={styles.gradesGrid}>
            <View style={styles.gradeCol}>
              <Text style={[styles.gradeLabel, { color: colors.textMuted }]}>8mm+ Extra Bold</Text>
              <Text style={[styles.gradeKg, { color: '#16A34A' }]}>
                {batch.grades.grade8mmPlusKg} kg
              </Text>
            </View>
            <View style={styles.gradeCol}>
              <Text style={[styles.gradeLabel, { color: colors.textMuted }]}>7-8mm Bold</Text>
              <Text style={[styles.gradeKg, { color: colors.text }]}>
                {batch.grades.grade7to8mmKg} kg
              </Text>
            </View>
            <View style={styles.gradeCol}>
              <Text style={[styles.gradeLabel, { color: colors.textMuted }]}>Splits / Pale</Text>
              <Text style={[styles.gradeKg, { color: '#D97706' }]}>
                {batch.grades.gradeSplitsKg} kg
              </Text>
            </View>
            <View style={styles.gradeCol}>
              <Text style={[styles.gradeLabel, { color: colors.textMuted }]}>Seeds / Waste</Text>
              <Text style={[styles.gradeKg, { color: colors.textMuted }]}>
                {batch.grades.gradeHuskSeedsKg} kg
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Operational Actions */}
      <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
        {isFiring ? (
          <>
            <TouchableOpacity
              onPress={() => onAddFiringLog(batch)}
              style={[styles.actionBtnSecondary, { borderColor: colors.border }]}
            >
              <Ionicons name="thermometer-outline" size={16} color={colors.text} />
              <Text style={[styles.actionBtnSecText, { color: colors.text }]}>
                + Check Temp / Wood
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onCompleteBatch(batch)}
              style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnPriText}>Unload & Recover</Text>
            </TouchableOpacity>
          </>
        ) : !isGraded ? (
          <TouchableOpacity
            onPress={() => onGradeBatch(batch)}
            style={[styles.actionBtnPrimary, { backgroundColor: '#3B82F6', width: '100%' }]}
          >
            <Ionicons name="ribbon-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnPriText}>Record Grading (8mm / 7-8mm / Splits)</Text>
          </TouchableOpacity>
        ) : null}
      </View>
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
  badgeCluster: {
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
  facilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '800',
  },
  rentalRate: {
    fontSize: 12,
    fontWeight: '700',
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
  },
  arrowCol: {
    paddingHorizontal: 4,
  },
  recoveryCol: {
    flex: 2,
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricDate: {
    fontSize: 10,
    marginTop: 2,
  },
  outturnValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  variancePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  varianceText: {
    fontSize: 9,
    fontWeight: '800',
  },
  firingSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  firingMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  firingText: {
    fontSize: 12,
  },
  viewLogsBtn: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  logsTable: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    gap: 6,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  logTime: {
    fontSize: 10,
    flex: 2,
  },
  logTemp: {
    fontSize: 11,
    fontWeight: '800',
    flex: 1,
  },
  logWood: {
    fontSize: 11,
    flex: 1,
  },
  logNotes: {
    fontSize: 10,
    flex: 2,
  },
  gradesContainer: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  gradesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gradesTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  gradesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gradeCol: {
    alignItems: 'center',
  },
  gradeLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  gradeKg: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnSecText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnPriText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  editBtn: {
    padding: 5,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyDetailsBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 4,
  },
  partyNameText: {
    fontSize: 12,
    fontWeight: '700',
  },
  paymentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  partyAddressText: {
    fontSize: 11,
  },
  separatorTrayBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 4,
  },
});
