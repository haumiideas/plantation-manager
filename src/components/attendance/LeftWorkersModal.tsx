import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { PlantationWorker, WORKER_CATEGORY_LABELS } from '../../types/worker';
import { formatDate } from '../../utils/date';

interface Props {
  visible: boolean;
  workers: PlantationWorker[];
  onClose: () => void;
  onReactivate: (workerId: string) => void;
}

export const LeftWorkersModal: React.FC<Props> = ({
  visible,
  workers,
  onClose,
  onReactivate,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Former / Inactive Workers</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Laborers marked as left the farm ({workers.length})
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* List */}
          <ScrollView contentContainerStyle={styles.listContent}>
            {workers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-circle-outline" size={44} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No workers currently marked as left the farm.
                </Text>
              </View>
            ) : (
              workers.map((worker) => (
                <View
                  key={worker.id}
                  style={[styles.workerRow, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.text }]}>{worker.name}</Text>
                    <Text style={[styles.details, { color: colors.textMuted }]}>
                      {WORKER_CATEGORY_LABELS[worker.category]} • Left:{' '}
                      {worker.leftFarmDate ? formatDate(new Date(worker.leftFarmDate)) : 'Previously'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.reactivateBtn, { backgroundColor: isDark ? '#064E3B' : '#D1FAE5', borderColor: colors.primary }]}
                    onPress={() => onReactivate(worker.id)}
                  >
                    <Ionicons name="refresh" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={[styles.reactivateText, { color: colors.primary }]}>Reactivate</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  emptyState: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  details: {
    fontSize: 11,
    marginTop: 2,
  },
  reactivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  reactivateText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
