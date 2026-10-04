import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AttendanceSummary } from '../../types/attendance';

interface Props {
  summary: AttendanceSummary;
  allPresent: boolean;
  onToggleMarkAll: () => void;
  onAddWorkerPress: () => void;
}

export const AttendanceSummaryBar: React.FC<Props> = ({
  summary,
  allPresent,
  onToggleMarkAll,
  onAddWorkerPress,
}) => {
  const { colors, isDark } = useTheme();
  const { role } = useAuth();
  const { t } = useLanguage();
  const isAdmin = role === 'admin';

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {/* Top Action Bar: Large High-Contrast "Mark All Present" / "Clear Selection" Toggle + "+ Add Worker" */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.bulkButton,
            allPresent
              ? [styles.bulkButtonActive, { backgroundColor: isDark ? '#451A03' : '#FEF3C7', borderColor: colors.accent }]
              : [styles.bulkButtonActive, { backgroundColor: isDark ? '#064E3B' : '#059669', borderColor: colors.primaryLight }],
          ]}
          onPress={onToggleMarkAll}
          activeOpacity={0.8}
          accessibilityLabel={allPresent ? 'Clear muster selection' : 'Mark all workers present'}
        >
          <Ionicons
            name={allPresent ? 'refresh-circle' : 'checkmark-circle'}
            size={18}
            color={allPresent ? (isDark ? '#FCD34D' : '#92400E') : '#FFFFFF'}
          />
          <Text
            style={[
              styles.bulkButtonText,
              { color: allPresent ? (isDark ? '#FDE68A' : '#92400E') : '#FFFFFF' },
            ]}
          >
            {allPresent ? `${t('present')} (${t('cancel')})` : `✓ ${t('markAllPresent')}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addWorkerBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
          onPress={onAddWorkerPress}
        >
          <Ionicons name="person-add-outline" size={16} color={colors.text} />
          <Text style={[styles.addWorkerText, { color: colors.text }]}>{t('addWorker')}</Text>
        </TouchableOpacity>
      </View>

      {/* Headcount Breakdown Badges */}
      <View style={styles.countsRow}>
        <View style={[styles.countItem, styles.badgePresent, { backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }]}>
          <Text style={[styles.badgeLabel, { color: isDark ? '#6EE7B7' : '#065F46' }]}>{t('present')} (P)</Text>
          <Text style={[styles.badgeValue, { color: isDark ? '#A7F3D0' : '#047857' }]}>{summary.presentCount}</Text>
        </View>

        <View style={[styles.countItem, styles.badgeHalfDay, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
          <Text style={[styles.badgeLabel, { color: isDark ? '#FCD34D' : '#92400E' }]}>{t('halfDay')} (HD)</Text>
          <Text style={[styles.badgeValue, { color: isDark ? '#FDE68A' : '#B45309' }]}>{summary.halfDayCount}</Text>
        </View>

        <View style={[styles.countItem, styles.badgeAbsent, { backgroundColor: isDark ? '#450A0A' : '#FEE2E2' }]}>
          <Text style={[styles.badgeLabel, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>{t('absent')} (A)</Text>
          <Text style={[styles.badgeValue, { color: isDark ? '#FECACA' : '#DC2626' }]}>{summary.absentCount}</Text>
        </View>

        <View style={[styles.countItem, styles.badgeUnmarked, { backgroundColor: colors.surfaceSubtle }]}>
          <Text style={[styles.badgeLabel, { color: colors.textMuted }]}>Unmarked</Text>
          <Text style={[styles.badgeValue, { color: colors.textMuted }]}>{summary.unmarkedCount}</Text>
        </View>
      </View>

      {/* Bottom Metrics: Overtime Hours and Daily Wage Total */}
      <View style={[styles.metricsRow, { borderTopColor: colors.border }]}>
        <View style={styles.metricItem}>
          <Ionicons name="time-outline" size={16} color={colors.accent} />
          <Text style={[styles.metricText, { color: colors.text }]}>
            {t('overtimeHours')}: <Text style={{ fontWeight: '800', color: colors.accent }}>{summary.totalOvertimeHours} hrs</Text>
          </Text>
        </View>

        {isAdmin && (
          <View style={styles.metricItem}>
            <Ionicons name="cash-outline" size={16} color={colors.primary} />
            <Text style={[styles.metricText, { color: colors.text }]}>
              {t('dailyWage')}: <Text style={{ fontWeight: '800', color: isDark ? colors.primaryLight : colors.primary }}>₹{summary.totalEstimatedWage.toLocaleString('en-IN')}</Text>
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bulkButton: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  bulkButtonActive: {},
  bulkButtonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  addWorkerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  addWorkerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  countItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  badgePresent: {},
  badgeHalfDay: {},
  badgeAbsent: {},
  badgeUnmarked: {},
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  badgeValue: {
    fontSize: 17,
    fontWeight: '900',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
