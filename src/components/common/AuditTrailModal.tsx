import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { AuditEvent, getAuditLogs } from '../../services/auditService';
import { formatDate } from '../../utils/date';

interface AuditTrailModalProps {
  visible: boolean;
  onClose: () => void;
  orgId: string;
}

type EntityFilter = 'all' | 'attendance' | 'harvest' | 'curing' | 'expense' | 'day_status';

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({
  visible,
  onClose,
  orgId,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<EntityFilter>('all');

  useEffect(() => {
    if (visible) {
      loadLogs();
    }
  }, [visible, orgId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(orgId || 'plantation_org_namari_adukidathan', 100);
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.entityType === filter;
  });

  const getActionBadgeColor = (action: AuditEvent['action']) => {
    switch (action) {
      case 'create':
        return '#10B981';
      case 'update':
        return '#3B82F6';
      case 'delete':
        return '#EF4444';
      case 'override':
        return '#F59E0B';
      default:
        return colors.primary;
    }
  };

  const getEntityIcon = (type: AuditEvent['entityType']) => {
    switch (type) {
      case 'attendance':
        return 'people-outline';
      case 'harvest':
        return 'leaf-outline';
      case 'curing':
        return 'flame-outline';
      case 'expense':
        return 'receipt-outline';
      case 'equipment':
        return 'build-outline';
      case 'day_status':
        return 'sunny-outline';
      default:
        return 'document-text-outline';
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${formatDate(d)} ${hours}:${mins}`;
    } catch {
      return iso;
    }
  };

  const FILTERS: { id: EntityFilter; label: string }[] = [
    { id: 'all', label: 'All Activities' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'harvest', label: 'Harvest' },
    { id: 'curing', label: 'Curing' },
    { id: 'expense', label: 'Expenses' },
    { id: 'day_status', label: 'Day Status' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? '#14532D' : '#DCFCE7' }]}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t('auditTrailTitle')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Who modified what, when, and changes made
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {FILTERS.map((f) => {
                const isSelected = filter === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setFilter(f.id)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Logs List */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.emptyText, { color: colors.textMuted, marginTop: 8 }]}>
                Loading audit trail...
              </Text>
            </View>
          ) : filteredLogs.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="shield-checkmark-outline" size={44} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.text, marginTop: 10, fontWeight: '700' }]}>
                {t('noAuditLogs')}
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted, marginTop: 4 }]}>
                Modifications to attendance, harvest, curing, and expenses will automatically be logged here with supervisor accountability.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={{ padding: 14, gap: 10 }}>
              {filteredLogs.map((item) => {
                const actionColor = getActionBadgeColor(item.action);
                const entityIcon = getEntityIcon(item.entityType);

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.logCard,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.logCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Ionicons name={entityIcon as any} size={15} color={colors.primary} />
                        <Text style={[styles.logTitle, { color: colors.text }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.actionBadge,
                          { backgroundColor: actionColor + '20', borderColor: actionColor },
                        ]}
                      >
                        <Text style={[styles.actionBadgeText, { color: actionColor }]}>
                          {item.action.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.logDetails, { color: colors.textMuted }]}>
                      {item.details}
                    </Text>

                    <View style={[styles.logFooter, { borderTopColor: colors.border }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="person-outline" size={12} color={colors.primary} />
                        <Text style={[styles.metaText, { color: colors.text }]}>
                          {item.performedByName || 'Supervisor'}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>
                          {formatTimestamp(item.timestamp)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Footer Close */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={[styles.doneBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.doneBtnText}>{t('close')}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '88%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
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
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    flexGrow: 0,
    maxHeight: 460,
  },
  logCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  actionBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  logDetails: {
    fontSize: 12,
    lineHeight: 17,
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  centerBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  modalFooter: {
    padding: 12,
    borderTopWidth: 1,
  },
  doneBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
