import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { ExpenseMetrics } from '../../services/expenseService';

interface ExpenseSummaryBarProps {
  metrics: ExpenseMetrics;
  farmLabel: string;
}

export const ExpenseSummaryBar: React.FC<ExpenseSummaryBarProps> = ({
  metrics,
  farmLabel,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const formattedTotal = Number(metrics.totalAmount || 0).toLocaleString('en-IN');
  const formattedCostPerAcre = Number(metrics.costPerAcre || 0).toLocaleString('en-IN');

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {/* Top Row: Total Spend & Cost/Acre */}
      <View style={styles.topRow}>
        <View style={styles.metricCol}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
            {t('totalExpenses')}
          </Text>
          <Text style={[styles.metricValuePrimary, { color: colors.text }]}>
            ₹{formattedTotal}
          </Text>
          <Text style={[styles.subText, { color: colors.textMuted }]}>
            {metrics.count} transactions • {farmLabel}
          </Text>
        </View>

        <View style={[styles.dividerVertical, { backgroundColor: colors.cardBorder }]} />

        <View style={styles.metricCol}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
            {t('costPerAcre')}
          </Text>
          <Text style={[styles.metricValueSecondary, { color: '#D97706' }]}>
            ₹{formattedCostPerAcre}
          </Text>
          <Text style={[styles.subText, { color: colors.textMuted }]}>
            per acre in period
          </Text>
        </View>
      </View>

      {/* Bottom Row: Top Category & Fuel Breakdown */}
      <View style={[styles.bottomRow, { borderTopColor: colors.cardBorder, backgroundColor: colors.surfaceSubtle }]}>
        {/* Top Category Driver */}
        {metrics.topCategory && (
          <View style={styles.chipRow}>
            <Ionicons name="pie-chart" size={13} color={colors.primary} />
            <Text style={[styles.chipText, { color: colors.text }]}>
              Top: <Text style={{ fontWeight: '700' }}>{t(metrics.topCategory.category as any) || metrics.topCategory.category}</Text> (₹{metrics.topCategory.amount.toLocaleString('en-IN')} • {metrics.topCategory.percentage}%)
            </Text>
          </View>
        )}

        {/* Fuel Volumes */}
        {(metrics.fuelBreakdown.petrolL > 0 || metrics.fuelBreakdown.dieselL > 0 || metrics.fuelBreakdown.engineOilL > 0) && (
          <View style={styles.fuelRow}>
            <Ionicons name="speedometer-outline" size={13} color="#D97706" />
            <Text style={[styles.fuelText, { color: colors.textMuted }]}>
              Fuel:
              {metrics.fuelBreakdown.dieselL > 0 ? ` ${metrics.fuelBreakdown.dieselL}L Diesel` : ''}
              {metrics.fuelBreakdown.petrolL > 0 ? ` • ${metrics.fuelBreakdown.petrolL}L Petrol` : ''}
              {metrics.fuelBreakdown.engineOilL > 0 ? ` • ${metrics.fuelBreakdown.engineOilL}L Oil` : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    padding: 14,
  },
  metricCol: {
    flex: 1,
  },
  dividerVertical: {
    width: 1,
    marginHorizontal: 12,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metricValuePrimary: {
    fontSize: 20,
    fontWeight: '800',
  },
  metricValueSecondary: {
    fontSize: 18,
    fontWeight: '800',
  },
  subText: {
    fontSize: 11,
    marginTop: 2,
  },
  bottomRow: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 4,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    fontSize: 11,
  },
  fuelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fuelText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
