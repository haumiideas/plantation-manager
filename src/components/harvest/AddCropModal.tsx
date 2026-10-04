import React, { useState } from 'react';
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
import { CropConfig } from '../../types/crop';

interface AddCropModalProps {
  visible: boolean;
  onClose: () => void;
  onAddCrop: (crop: Omit<CropConfig, 'isCustom'>) => void;
}

export const AddCropModal: React.FC<AddCropModalProps> = ({
  visible,
  onClose,
  onAddCrop,
}) => {
  const { colors, isDark } = useTheme();
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [primaryUnit, setPrimaryUnit] = useState<'kg' | 'bags' | 'quintal'>('kg');
  const [blocksText, setBlocksText] = useState('Block 1, Block 2');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter crop name (e.g. Arecanut, Nutmeg, Ginger)');
      return;
    }
    const code = (shortCode.trim() || name.slice(0, 4)).toUpperCase();
    const id = name.trim().toLowerCase().replace(/\s+/g, '_');
    const defaultBlocks = blocksText
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    onAddCrop({
      id,
      name: name.trim(),
      shortCode: code,
      primaryUnit,
      harvestActivities: [`${name.trim()} Harvesting`, `${name.trim()} Sorting & Weighment`],
      defaultBlocks: defaultBlocks.length > 0 ? defaultBlocks : ['Block A', 'Block B'],
    });

    setName('');
    setShortCode('');
    setBlocksText('Block 1, Block 2');
    setError('');
    onClose();
  };

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
              <Ionicons name="leaf" size={22} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Add New Estate Crop</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: '#EF444420' }]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={[styles.label, { color: colors.text }]}>Crop Name</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="e.g. Arecanut, Nutmeg, Vanilla, Ginger"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError('');
                if (!shortCode) {
                  setShortCode(t.slice(0, 4).toUpperCase());
                }
              }}
            />

            <Text style={[styles.label, { color: colors.text }]}>Short Code (2-4 letters)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="e.g. AREC, NUTM, VANI"
              placeholderTextColor={colors.textMuted}
              value={shortCode}
              maxLength={6}
              onChangeText={setShortCode}
            />

            <Text style={[styles.label, { color: colors.text }]}>Primary Unit</Text>
            <View style={styles.unitRow}>
              {(['kg', 'bags', 'quintal'] as const).map((unit) => (
                <TouchableOpacity
                  key={unit}
                  onPress={() => setPrimaryUnit(unit)}
                  style={[
                    styles.unitChip,
                    {
                      borderColor: primaryUnit === unit ? colors.primary : colors.border,
                      backgroundColor:
                        primaryUnit === unit
                          ? isDark
                            ? '#1B3D2F'
                            : '#DCFCE7'
                          : colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitText,
                      {
                        color:
                          primaryUnit === unit
                            ? isDark
                              ? colors.primaryLight
                              : colors.primary
                            : colors.textMuted,
                        fontWeight: primaryUnit === unit ? '700' : '500',
                      },
                    ]}
                  >
                    {unit.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>
              Default Farm Blocks (comma separated)
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="e.g. North Ridge, Stream Block, Yard"
              placeholderTextColor={colors.textMuted}
              value={blocksText}
              onChangeText={setBlocksText}
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.btnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.saveBtnText}>Save & Add Crop</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    maxHeight: 480,
  },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  unitChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  unitText: {
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
