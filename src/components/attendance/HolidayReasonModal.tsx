import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface HolidayReasonModalProps {
  visible: boolean;
  onClose: () => void;
  currentReason?: string;
  onConfirm: (reason: string) => void;
  dateDisplay: string;
}

const COMMON_REASONS = [
  'Heavy Rain / Monsoon',
  'Regional Festival / Pongal / Onam',
  'Weekly Rest / Sunday',
  'Local Strike / Bandh',
  'Dryer / Machinery Maintenance',
];

export const HolidayReasonModal: React.FC<HolidayReasonModalProps> = ({
  visible,
  onClose,
  currentReason = '',
  onConfirm,
  dateDisplay,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [selectedPreset, setSelectedPreset] = useState<string>(currentReason || '');
  const [customReason, setCustomReason] = useState<string>(currentReason || '');

  const handleSelectPreset = (reason: string) => {
    setSelectedPreset(reason);
    setCustomReason(reason);
  };

  const handleSave = () => {
    onConfirm(customReason.trim() || selectedPreset.trim() || 'Estate Holiday');
    onClose();
  };

  const handleSkip = () => {
    onConfirm('Estate Holiday');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
                  <Ionicons name="sunny-outline" size={24} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {t('setHolidayReason')}
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    {dateDisplay}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Quick Preset Chips */}
              <Text style={[styles.label, { color: colors.text }]}>
                {t('quickSelectReason')}:
              </Text>
              <View style={styles.chipsRow}>
                {COMMON_REASONS.map((reason) => {
                  const isSelected = customReason === reason;
                  return (
                    <TouchableOpacity
                      key={reason}
                      onPress={() => handleSelectPreset(reason)}
                      style={[
                        styles.chip,
                        {
                          borderColor: isSelected ? '#D97706' : colors.border,
                          backgroundColor: isSelected
                            ? isDark
                              ? '#78350F'
                              : '#FEF3C7'
                            : colors.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected ? '#D97706' : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Free-text input */}
              <Text style={[styles.label, { color: colors.text }]}>
                {t('orTypeCustomReason')}:
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t('holidayReasonPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={customReason}
                onChangeText={setCustomReason}
              />

              {/* Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={handleSkip}
                  style={[styles.skipBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.skipBtnText, { color: colors.textMuted }]}>
                    {t('skipNoReason')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.confirmBtn, { backgroundColor: '#D97706' }]}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmBtnText}>{t('confirmHoliday')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
