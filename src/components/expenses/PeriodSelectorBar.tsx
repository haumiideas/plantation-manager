import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { PeriodType, getPeriodDisplayRange, shiftPeriod } from '../../utils/date';

interface PeriodSelectorBarProps {
  selectedPeriod: PeriodType;
  referenceDate: Date;
  onSelectPeriod: (period: PeriodType) => void;
  onChangeReferenceDate: (newDate: Date) => void;
}

const PERIODS: PeriodType[] = ['daily', 'weekly', 'monthly', 'quarterly', 'halfYearly', 'annual'];

export const PeriodSelectorBar: React.FC<PeriodSelectorBarProps> = ({
  selectedPeriod,
  referenceDate,
  onSelectPeriod,
  onChangeReferenceDate,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const currentRangeLabel = getPeriodDisplayRange(selectedPeriod, referenceDate);

  const handlePrev = () => {
    onChangeReferenceDate(shiftPeriod(selectedPeriod, referenceDate, -1));
  };

  const handleNext = () => {
    onChangeReferenceDate(shiftPeriod(selectedPeriod, referenceDate, 1));
  };

  const handleResetToday = () => {
    onChangeReferenceDate(new Date());
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {/* Horizontal Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {PERIODS.map((p) => {
          const isActive = selectedPeriod === p;
          return (
            <TouchableOpacity
              key={p}
              onPress={() => onSelectPeriod(p)}
              style={[
                styles.tabPill,
                {
                  backgroundColor: isActive ? colors.primary : colors.surfaceSubtle,
                  borderColor: isActive ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? '#FFFFFF' : colors.text,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {t(p)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Stepper Navigator */}
      <View style={[styles.stepperRow, { borderTopColor: colors.cardBorder }]}>
        <TouchableOpacity
          onPress={handlePrev}
          style={[styles.arrowBtn, { backgroundColor: colors.surfaceSubtle }]}
          accessibilityLabel="Previous period"
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResetToday} style={styles.centerDateBox}>
          <Ionicons name="calendar-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.rangeLabel, { color: colors.text }]}>
            {currentRangeLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          style={[styles.arrowBtn, { backgroundColor: colors.surfaceSubtle }]}
          accessibilityLabel="Next period"
        >
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>
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
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  arrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  rangeLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
});
