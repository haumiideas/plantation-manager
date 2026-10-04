import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { CropConfig } from '../../types/crop';
import { AddCropModal } from './AddCropModal';

export type HarvestTabType =
  | 'crop_cardamom'
  | 'crop_pepper'
  | 'crop_coffee'
  | 'curing_chamber'
  | 'pepper_yard'
  | string; // for custom crops: 'crop_<cropId>'

interface HarvestTabSelectorProps {
  crops: CropConfig[];
  selectedTab: HarvestTabType;
  onSelectTab: (tab: HarvestTabType) => void;
  onAddCrop: (crop: Omit<CropConfig, 'isCustom'>) => void;
  activeCuringCount?: number;
  activePepperCount?: number;
}

export const HarvestTabSelector: React.FC<HarvestTabSelectorProps> = ({
  crops,
  selectedTab,
  onSelectTab,
  onAddCrop,
  activeCuringCount = 0,
  activePepperCount = 0,
}) => {
  const { colors, isDark } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);

  // Group tabs: Crop pickings, then post-harvest processing
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Dynamic Crop Tabs */}
        {crops.map((crop) => {
          const tabKey = `crop_${crop.id}`;
          const isSelected = selectedTab === tabKey;
          let iconName: any = 'leaf';
          if (crop.id === 'cardamom') iconName = 'flower';
          else if (crop.id === 'pepper') iconName = 'nutrition';
          else if (crop.id === 'coffee') iconName = 'cafe';

          return (
            <TouchableOpacity
              key={tabKey}
              onPress={() => onSelectTab(tabKey)}
              style={[
                styles.tab,
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
              <Ionicons
                name={iconName}
                size={16}
                color={isSelected ? '#FFFFFF' : isDark ? colors.primaryLight : colors.primary}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.text,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {crop.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Curing Chamber Processing Tab */}
        <TouchableOpacity
          onPress={() => onSelectTab('curing_chamber')}
          style={[
            styles.tab,
            {
              backgroundColor:
                selectedTab === 'curing_chamber'
                  ? '#D97706' // amber-600 for furnace/bhatti
                  : colors.card,
              borderColor:
                selectedTab === 'curing_chamber' ? '#D97706' : colors.cardBorder,
            },
          ]}
        >
          <Ionicons
            name="flame"
            size={16}
            color={selectedTab === 'curing_chamber' ? '#FFFFFF' : '#D97706'}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: selectedTab === 'curing_chamber' ? '#FFFFFF' : colors.text,
                fontWeight: selectedTab === 'curing_chamber' ? '700' : '500',
              },
            ]}
          >
            Curing Chamber
          </Text>
          {activeCuringCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeCuringCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Pepper Solar Yard Tab */}
        <TouchableOpacity
          onPress={() => onSelectTab('pepper_yard')}
          style={[
            styles.tab,
            {
              backgroundColor:
                selectedTab === 'pepper_yard'
                  ? '#0D9488' // teal-600
                  : colors.card,
              borderColor:
                selectedTab === 'pepper_yard' ? '#0D9488' : colors.cardBorder,
            },
          ]}
        >
          <Ionicons
            name="sunny"
            size={16}
            color={selectedTab === 'pepper_yard' ? '#FFFFFF' : '#0D9488'}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: selectedTab === 'pepper_yard' ? '#FFFFFF' : colors.text,
                fontWeight: selectedTab === 'pepper_yard' ? '700' : '500',
              },
            ]}
          >
            Pepper Yard
          </Text>
          {activePepperCount > 0 && (
            <View style={[styles.badge, { backgroundColor: '#0D9488' }]}>
              <Text style={styles.badgeText}>{activePepperCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Add Crop Button */}
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={[
            styles.addCropBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="add-circle" size={16} color={colors.primary} />
          <Text style={[styles.addCropText, { color: colors.primary }]}>+ Crop</Text>
        </TouchableOpacity>
      </ScrollView>

      <AddCropModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddCrop={onAddCrop}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  addCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addCropText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
