import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface BenchmarkConfigModalProps {
  visible: boolean;
  onClose: () => void;
  currentCardamomBenchmark: number;
  currentPepperBenchmark: number;
  onSave: (cardamom: number, pepper: number) => void;
}

export const BenchmarkConfigModal: React.FC<BenchmarkConfigModalProps> = ({
  visible,
  onClose,
  currentCardamomBenchmark,
  currentPepperBenchmark,
  onSave,
}) => {
  const { colors, isDark } = useTheme();
  const [cardamom, setCardamom] = useState(String(currentCardamomBenchmark));
  const [pepper, setPepper] = useState(String(currentPepperBenchmark));

  useEffect(() => {
    setCardamom(String(currentCardamomBenchmark));
    setPepper(String(currentPepperBenchmark));
  }, [currentCardamomBenchmark, currentPepperBenchmark, visible]);

  const handleSave = () => {
    const cardVal = parseFloat(cardamom) || 20.0;
    const pepVal = parseFloat(pepper) || 34.0;
    onSave(cardVal, pepVal);
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
              <Ionicons name="speedometer" size={22} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Curing & Recovery Benchmarks
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.description, { color: colors.textMuted }]}>
            Set the expected outturn benchmark (%) for comparing actual batch yields. Helps detect wet picking or dryer heat losses.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Small Cardamom Curing Outturn Benchmark (%)
            </Text>
            <Text style={[styles.subLabel, { color: colors.textMuted }]}>
              Standard range: 18.0% - 24.0% (Green $\rightarrow$ Dry Cured)
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              keyboardType="decimal-pad"
              value={cardamom}
              onChangeText={setCardamom}
              placeholder="e.g. 20.0"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Black Pepper Solar Drying Outturn Benchmark (%)
            </Text>
            <Text style={[styles.subLabel, { color: colors.textMuted }]}>
              Standard range: 32.0% - 36.0% (Fresh Berries $\rightarrow$ Dry Black Pepper)
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              keyboardType="decimal-pad"
              value={pepper}
              onChangeText={setPepper}
              placeholder="e.g. 34.0"
              placeholderTextColor={colors.textMuted}
            />
          </View>

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
              <Text style={styles.saveBtnText}>Update Benchmarks</Text>
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  subLabel: {
    fontSize: 11,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
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
