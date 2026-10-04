import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { ExpendableItem, ExpendableType } from '../../types/equipment';

interface ExpendablesInventoryCardProps {
  items: ExpendableItem[];
  onAddItem: (item: ExpendableItem) => void;
  onOpenLogConsumption: (preselectedItemId?: string) => void;
  orgId: string;
}

const ITEM_ICONS: Record<string, string> = {
  petrol: 'speedometer',
  diesel: 'speedometer',
  engine_oil: 'water',
  wood: 'bonfire',
  chemical: 'flask',
  fertilizer: 'leaf',
  default: 'cube-outline',
};

export const ExpendablesInventoryCard: React.FC<ExpendablesInventoryCardProps> = ({
  items,
  onAddItem,
  onOpenLogConsumption,
  orgId,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('Litres');
  const [newItemType, setNewItemType] = useState<ExpendableType>('oil');
  const [initialStock, setInitialStock] = useState('');

  const handleSaveNewItem = () => {
    if (!newItemName.trim()) return;
    const item: ExpendableItem = {
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      orgId,
      name: newItemName.trim(),
      type: newItemType,
      unit: newItemUnit.trim() || 'Units',
      currentStock: parseFloat(initialStock) || 0,
      isCustom: true,
    };
    onAddItem(item);
    setNewItemName('');
    setInitialStock('');
    setShowAddModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="speedometer" size={18} color="#D97706" />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('inventoryStock')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {t('liveStockSubtitle')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={[styles.addBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
        >
          <Ionicons name="add" size={14} color={colors.primary} />
          <Text style={[styles.addBtnText, { color: colors.primary }]}>{t('addItem')}</Text>
        </TouchableOpacity>
      </View>

      {/* Grid of Stock Items */}
      <View style={styles.stockGrid}>
        {items.map((it) => {
          const isLow = it.reorderLevel ? it.currentStock <= it.reorderLevel : false;
          const iconName =
            it.name.toLowerCase().includes('petrol')
              ? 'speedometer'
              : it.name.toLowerCase().includes('diesel')
              ? 'speedometer'
              : it.name.toLowerCase().includes('oil')
              ? 'water'
              : it.name.toLowerCase().includes('wood')
              ? 'bonfire'
              : 'cube-outline';

          const localizedName =
            it.name.toLowerCase().includes('diesel')
              ? t('diesel')
              : it.name.toLowerCase().includes('petrol')
              ? t('petrol')
              : it.name.toLowerCase().includes('oil')
              ? t('engineOil')
              : it.name.toLowerCase().includes('wood')
              ? t('woodenLogs')
              : it.name;

          return (
            <View
              key={it.id}
              style={[
                styles.stockTile,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: isLow ? '#EF4444' : colors.cardBorder,
                },
              ]}
            >
              <View style={styles.tileTop}>
                <Ionicons name={iconName as any} size={16} color={isLow ? '#EF4444' : colors.primary} />
                {isLow && (
                  <View style={styles.lowBadge}>
                    <Text style={styles.lowBadgeText}>{t('lowStockBadge')}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                {localizedName}
              </Text>

              <Text style={[styles.stockValue, { color: isLow ? '#EF4444' : colors.text }]}>
                {it.currentStock} <Text style={[styles.stockUnit, { color: colors.textMuted }]}>{it.unit}</Text>
              </Text>

              <TouchableOpacity
                onPress={() => onOpenLogConsumption(it.id)}
                style={[styles.quickConsumeBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <Ionicons name="remove-circle-outline" size={13} color={colors.primary} />
                <Text style={[styles.quickConsumeText, { color: colors.primary }]}>{t('consume')}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Add Custom Expendable Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Expendable Item</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputField}>
              <Text style={[styles.label, { color: colors.text }]}>Item Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. 2T Lubricant Oil, Grease, Urea..."
                placeholderTextColor={colors.textMuted}
                value={newItemName}
                onChangeText={setNewItemName}
              />
            </View>

            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.text }]}>Unit (Litres, kg, etc.)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="Litres"
                  placeholderTextColor={colors.textMuted}
                  value={newItemUnit}
                  onChangeText={setNewItemUnit}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.text }]}>Initial Stock</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={initialStock}
                  onChangeText={setInitialStock}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSaveNewItem}
              style={[styles.saveModalBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.saveModalBtnText}>Save Item to Inventory</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stockTile: {
    width: '48.5%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lowBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  lowBadgeText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '800',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '700',
  },
  stockValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  stockUnit: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickConsumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
  },
  quickConsumeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  inputField: {
    gap: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  saveModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
