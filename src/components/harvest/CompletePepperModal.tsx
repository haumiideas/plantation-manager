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
import { PepperDryingBatch } from '../../types/harvest';
import { formatDate } from '../../utils/date';

interface CompletePepperModalProps {
  visible: boolean;
  onClose: () => void;
  batch: PepperDryingBatch | null;
  onCompleteBatch: (batchId: string, dryBlackPepperKg: number, completedDate: string) => void;
}

export const CompletePepperModal: React.FC<CompletePepperModalProps> = ({
  visible,
  onClose,
  batch,
  onCompleteBatch,
}) => {
  const { colors, isDark } = useTheme();

  const [dryWeight, setDryWeight] = useState('');
  const [completedDate, setCompletedDate] = useState(formatDate());
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && batch) {
      setCompletedDate(formatDate());
      setDryWeight(batch.dryBlackPepperKg ? String(batch.dryBlackPepperKg) : '');
      setError('');
    }
  }, [visible, batch]);

  if (!batch) return null;

  const parsedDry = parseFloat(dryWeight) || 0;
  const calculatedRecovery =
    batch.freshSpikesWeightKg > 0 && parsedDry > 0
      ? Number(((parsedDry / batch.freshSpikesWeightKg) * 100).toFixed(2))
      : 0;
  const variance = Number((calculatedRecovery - batch.benchmarkOutturnPercentage).toFixed(2));
  const isGain = variance >= 0;

  const handleSave = () => {
    if (!parsedDry || parsedDry <= 0) {
      setError('Please enter valid dry black pepper weight in kg');
      return;
    }

    onCompleteBatch(batch.id, parsedDry, completedDate);
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
              <Ionicons name="checkmark-done-circle" size={22} color="#0D9488" />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Record Dry Black Pepper Yield
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subText, { color: colors.textMuted }]}>
            Batch {batch.id} • Started {batch.startDate} ({batch.dryingDays} drying days)
          </Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: '#EF444420' }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Weights Box */}
          <View
            style={[
              styles.weightsBox,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <View style={styles.weightCol}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                Fresh Spikes
              </Text>
              <Text style={[styles.metricVal, { color: colors.text }]}>
                {batch.freshSpikesWeightKg} kg
              </Text>
            </View>

            <View style={styles.arrowCol}>
              <Ionicons name="arrow-forward" size={18} color="#0D9488" />
            </View>

            <View style={styles.weightCol}>
              <Text style={[styles.metricLabel, { color: '#0D9488' }]}>
                Dry Black Pepper (kg) *
              </Text>
              <TextInput
                style={[
                  styles.dryInput,
                  { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="e.g. 145.0"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={dryWeight}
                onChangeText={setDryWeight}
                autoFocus
              />
            </View>
          </View>

          {/* LIVE OUTTURN BENCHMARK PREVIEW */}
          {calculatedRecovery > 0 && (
            <View
              style={[
                styles.outturnPreview,
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
              <View>
                <Text style={[styles.previewLabel, { color: isGain ? '#16A34A' : '#D97706' }]}>
                  Black Pepper Outturn Recovery:
                </Text>
                <Text style={[styles.previewOutturnVal, { color: isGain ? '#16A34A' : '#D97706' }]}>
                  {calculatedRecovery}%
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.previewVarianceText, { color: isGain ? '#16A34A' : '#D97706' }]}>
                  {isGain ? `+${variance}% GAIN` : `${variance}% VARIANCE`}
                </Text>
                <Text style={[styles.previewBenchmarkSub, { color: colors.textMuted }]}>
                  vs {batch.benchmarkOutturnPercentage}% benchmark
                </Text>
              </View>
            </View>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Completion Date</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
            ]}
            value={completedDate}
            onChangeText={setCompletedDate}
          />

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.btnText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: '#0D9488' }]}
            >
              <Text style={styles.saveBtnText}>Save Black Pepper Yield</Text>
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
    gap: 10,
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
    marginBottom: 4,
  },
  errorBox: {
    padding: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  weightsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  weightCol: {
    flex: 2,
  },
  arrowCol: {
    paddingHorizontal: 8,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  dryInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 18,
    fontWeight: '800',
  },
  outturnPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewOutturnVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  previewVarianceText: {
    fontSize: 13,
    fontWeight: '800',
  },
  previewBenchmarkSub: {
    fontSize: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
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
