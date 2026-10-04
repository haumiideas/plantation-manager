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
import { FarmId, FARM_OPTIONS } from '../../types/farm';
import { PepperDryingBatch } from '../../types/harvest';
import { formatDate } from '../../utils/date';

interface NewPepperBatchModalProps {
  visible: boolean;
  onClose: () => void;
  defaultFarmId?: FarmId;
  defaultBenchmark: number;
  onCreateBatch: (batchData: Omit<PepperDryingBatch, 'id' | 'createdAt' | 'status'>) => void;
}

export const NewPepperBatchModal: React.FC<NewPepperBatchModalProps> = ({
  visible,
  onClose,
  defaultFarmId = 'namari',
  defaultBenchmark = 34.0,
  onCreateBatch,
}) => {
  const { colors, isDark } = useTheme();

  const [farmId, setFarmId] = useState<FarmId>(
    defaultFarmId === 'consolidated' ? 'namari' : defaultFarmId
  );
  const [freshWeight, setFreshWeight] = useState('');
  const [threshedWeight, setThreshedWeight] = useState('');
  const [benchmark, setBenchmark] = useState(String(defaultBenchmark));
  const [startDate, setStartDate] = useState(formatDate());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setFarmId(defaultFarmId === 'consolidated' ? 'namari' : defaultFarmId);
      setFreshWeight('');
      setThreshedWeight('');
      setBenchmark(String(defaultBenchmark));
      setStartDate(formatDate());
      setNotes('');
      setError('');
    }
  }, [visible, defaultFarmId, defaultBenchmark]);

  const handleSave = () => {
    const fW = parseFloat(freshWeight);
    const tW = parseFloat(threshedWeight);

    if (!fW || fW <= 0) {
      setError('Please enter valid fresh pepper spikes harvest weight in kg');
      return;
    }

    onCreateBatch({
      orgId: 'plantation_org_namari_adukidathan',
      farmId,
      seasonYear: '2026-27',
      freshSpikesWeightKg: fW,
      threshedBerriesWeightKg: tW > 0 ? tW : Number((fW * 0.85).toFixed(1)),
      benchmarkOutturnPercentage: parseFloat(benchmark) || 34.0,
      dryingDays: 1,
      startDate,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="sunny" size={22} color="#0D9488" />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                New Pepper Solar Yard Batch
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: '#EF444420' }]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Farm Selector */}
            <Text style={[styles.label, { color: colors.text }]}>Estate / Farm</Text>
            <View style={styles.farmRow}>
              {FARM_OPTIONS.filter((f) => f.id !== 'consolidated').map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setFarmId(f.id)}
                  style={[
                    styles.chip,
                    {
                      borderColor: farmId === f.id ? colors.primary : colors.border,
                      backgroundColor:
                        farmId === f.id
                          ? isDark
                            ? '#1B3D2F'
                            : '#DCFCE7'
                          : colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          farmId === f.id
                            ? isDark
                              ? colors.primaryLight
                              : colors.primary
                            : colors.textMuted,
                        fontWeight: farmId === f.id ? '700' : '500',
                      },
                    ]}
                  >
                    {f.label} ({f.shortCode})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Fresh Spikes Harvest Weight */}
            <Text style={[styles.label, { color: colors.text }]}>
              Fresh Pepper Spikes Harvested (kg) *
            </Text>
            <TextInput
              style={[
                styles.inputLarge,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="e.g. 450.0"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={freshWeight}
              onChangeText={(t) => {
                setFreshWeight(t);
                const num = parseFloat(t);
                if (num && !threshedWeight) {
                  setThreshedWeight(String(Number((num * 0.85).toFixed(1))));
                }
              }}
            />

            {/* Threshed Green Berries Weight */}
            <Text style={[styles.label, { color: colors.text }]}>
              Threshed Green Berries Weight (kg)
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="e.g. 380.0 (typically ~85% of spikes weight)"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={threshedWeight}
              onChangeText={setThreshedWeight}
            />

            {/* Benchmark Outturn % */}
            <Text style={[styles.label, { color: colors.text }]}>
              Benchmark Dry Black Pepper Outturn (%)
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="34.0"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={benchmark}
              onChangeText={setBenchmark}
            />

            {/* Start Date */}
            <Text style={[styles.label, { color: colors.text }]}>Drying Start Date</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              value={startDate}
              onChangeText={setStartDate}
            />

            {/* Yard Notes */}
            <Text style={[styles.label, { color: colors.text }]}>Solar Yard Notes</Text>
            <TextInput
              style={[
                styles.notesInput,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="e.g. Main concrete drying yard, raked every 2 hours"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            {/* Action Buttons */}
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
                <Text style={styles.saveBtnText}>Start Drying Batch</Text>
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
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  body: {
    maxHeight: 500,
  },
  errorBox: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  farmRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  inputLarge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: '800',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 45,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    marginBottom: 8,
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
