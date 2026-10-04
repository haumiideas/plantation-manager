import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFarm } from '../../context/FarmContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { FarmId } from '../../types/farm';

export const FarmSwitcher: React.FC = () => {
  const { selectedFarm, setFarm, options } = useFarm();
  const { colors, isDark } = useTheme();
  const { t, translateUserText } = useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
      {options.map((option) => {
        const isSelected = selectedFarm === option.id;
        const displayLabel = option.id === 'consolidated'
          ? (t('consolidatedTab') || 'Consolidated')
          : translateUserText(option.label.replace(' Farm', ''));

        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => setFarm(option.id)}
            style={[
              styles.tab,
              isSelected && [
                styles.selectedTab,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? colors.primaryLight : colors.primary,
                },
              ],
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: isSelected ? (isDark ? colors.primaryLight : colors.primary) : colors.textMuted,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {displayLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTab: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
