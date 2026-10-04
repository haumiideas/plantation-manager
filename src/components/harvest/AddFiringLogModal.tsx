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
import { CuringBatch, FiringLogEntry } from '../../types/harvest';
import { formatDate } from '../../utils/date';

interface AddFiringLogModalProps {
  visible: boolean;
  onClose: () => void;
  batch: CuringBatch | null;
  onSaveLog: (batchId: string, log: Omit<FiringLogEntry, 'id'>) => void;
}

export const AddFiringLogModal: React.FC<AddFiringLogModalProps> = ({
  visible,
  onClose,
  batch,
  onSaveLog,
}) => {
  const { colors } = useTheme();

  const [temp, setTemp] = useState('48');
  const [bundles, setBundles] = useState('4');
  const [timestamp, setTimestamp] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && batch) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setTimestamp(`${formatDate()} ${timeStr}`);
      setTemp('48');
      setBundles('4');
      setNotes('');
      setError('');
    }
  }, [visible, batch]);

  const handleSave = () => {
    if (!batch) return;
    const t = parseFloat(temp);
    const b = parseInt(bundles, 10) || 0;

    if (!t || t < 25 || t > 80) {
      setError('Please enter a valid chamber temperature (typically 40°C - 55°C)');
      return;
    }

    onSaveLog(batch.id, {
      timestamp,
      tempCelsius: t,
      firewoodBundles: b,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  if (!batch) return null;

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
              <Ionicons name="flame" size={20} color="#EF4444" />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Chamber Firing Check
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.batchSub, { color: colors.textMuted }]}>
            {batch.dryerName} • Batch {batch.id}
          </Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: '#EF444420' }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.text }]}>Chamber Temp (°C)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                ]}
                keyboardType="decimal-pad"
                value={temp}
                onChangeText={setTemp}
                placeholder="48"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={[styles.hint, { color: colors.textMuted }]}>Ideal: 40°C - 52°C</Text>
            </View>

            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.text }]}>Wood Added (Bundles)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                ]}
                keyboardType="numeric"
                value={bundles}
                onChangeText={setBundles}
                placeholder="4"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={[styles.hint, { color: colors.textMuted }]}>Bundles or logs</Text>
            </View>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Timestamp</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
            ]}
            value={timestamp}
            onChangeText={setTimestamp}
          />

          <Text style={[styles.label, { color: colors.text }]}>Observation / Stage Notes</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="e.g. Sweating stage, flue pipe cleared, smoke vent adjusted"
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
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
              style={[styles.saveBtn, { backgroundColor: '#EF4444' }]}
            >
              <Text style={styles.saveBtnText}>Log Check</Text>
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
  batchSub: {
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  hint: {
    fontSize: 10,
    marginTop: 2,
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
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
