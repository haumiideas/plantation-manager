import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFarm } from '../../context/FarmContext';
import {
  FarmAcreageConfig,
  getCustomFarms,
  saveCustomFarms,
} from '../../services/farmService';

interface FarmAcreageModalProps {
  visible: boolean;
  onClose: () => void;
  currentAcreages?: FarmAcreageConfig;
  onSave: (acreages: FarmAcreageConfig) => void;
  orgId?: string;
}

export const FarmAcreageModal: React.FC<FarmAcreageModalProps> = ({
  visible,
  onClose,
  currentAcreages,
  onSave,
  orgId = 'plantation_org_namari_adukidathan',
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { refreshFarms } = useFarm();

  const [farm1Name, setFarm1Name] = useState('');
  const [farm1Acreage, setFarm1Acreage] = useState('');
  const [farm2Name, setFarm2Name] = useState('');
  const [farm2Acreage, setFarm2Acreage] = useState('');

  useEffect(() => {
    if (visible) {
      loadFarms();
    }
  }, [visible]);

  const loadFarms = async () => {
    const data = await getCustomFarms(orgId);
    setFarm1Name(data.farm1.name || '');
    setFarm1Acreage(data.farm1.acreage > 0 ? String(data.farm1.acreage) : '');
    setFarm2Name(data.farm2.name || '');
    setFarm2Acreage(data.farm2.acreage > 0 ? String(data.farm2.acreage) : '');
  };

  const handleSave = async () => {
    const a1 = parseFloat(farm1Acreage) || 0;
    const a2 = parseFloat(farm2Acreage) || 0;
    const f1 = farm1Name.trim() || 'Farm 1';
    const f2 = farm2Name.trim() || 'Farm 2';

    await saveCustomFarms(orgId, {
      farm1: {
        id: 'namari',
        name: f1,
        shortCode: f1.slice(0, 3).toUpperCase(),
        acreage: a1,
      },
      farm2: {
        id: 'adukidathan',
        name: f2,
        shortCode: f2.slice(0, 3).toUpperCase(),
        acreage: a2,
      },
    });

    await refreshFarms();
    onSave({ namari: a1, adukidathan: a2 });
    onClose();
  };

  const totalAcres = (parseFloat(farm1Acreage) || 0) + (parseFloat(farm2Acreage) || 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="business" size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t('farmAcreageSetup')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subText, { color: colors.textMuted }]}>
            Configure estate plantation names and land sizes (Acres):
          </Text>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {/* Farm 1 Block */}
            <View style={[styles.farmBlock, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              <Text style={[styles.farmHeader, { color: colors.primary }]}>Farm / Plantation 1</Text>
              <View style={styles.fieldRow}>
                <View style={{ flex: 1.3 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Name</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                    ]}
                    value={farm1Name}
                    onChangeText={setFarm1Name}
                    placeholder="e.g. Main Estate"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Acres</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                    ]}
                    keyboardType="decimal-pad"
                    value={farm1Acreage}
                    onChangeText={setFarm1Acreage}
                    placeholder="e.g. 25.0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Farm 2 Block */}
            <View style={[styles.farmBlock, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              <Text style={[styles.farmHeader, { color: colors.primary }]}>Farm / Plantation 2 (Optional)</Text>
              <View style={styles.fieldRow}>
                <View style={{ flex: 1.3 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Name</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                    ]}
                    value={farm2Name}
                    onChangeText={setFarm2Name}
                    placeholder="e.g. Valley Section"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Acres</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                    ]}
                    keyboardType="decimal-pad"
                    value={farm2Acreage}
                    onChangeText={setFarm2Acreage}
                    placeholder="e.g. 30.0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Total Acreage summary */}
            <View
              style={[
                styles.totalBox,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.totalLabel, { color: colors.textMuted }]}>
                {t('consolidated')}:
              </Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                {totalAcres.toFixed(1)} {t('acres')}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.btnText, { color: colors.textMuted }]}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.btnText, { color: '#FFFFFF' }]}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  subText: {
    fontSize: 12,
    lineHeight: 16,
  },
  farmBlock: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
  farmHeader: {
    fontSize: 12,
    fontWeight: '700',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
