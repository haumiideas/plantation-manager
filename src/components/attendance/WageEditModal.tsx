import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedWorkerName } from '../../utils/localizationUtils';
import { PlantationWorker } from '../../types/worker';
import { AttendanceRecord } from '../../types/attendance';

interface Props {
  visible: boolean;
  worker: PlantationWorker;
  record?: AttendanceRecord;
  selectedDateFormatted: string;
  onClose: () => void;
  onSaveTodayOverride: (dailyWage: number, otRate: number) => void;
  onSavePermanentBase: (dailyWage: number, otRate: number) => void;
}

export const WageEditModal: React.FC<Props> = ({
  visible,
  worker,
  record,
  selectedDateFormatted,
  onClose,
  onSaveTodayOverride,
  onSavePermanentBase,
}) => {
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();

  // Mode: 'today_only' or 'future_base'
  const [mode, setMode] = useState<'today_only' | 'future_base'>('today_only');
  const [dailyWage, setDailyWage] = useState(
    String(record?.dailyWageRate ?? worker.dailyWageRate ?? 500)
  );
  const [otRate, setOtRate] = useState(
    String(record?.overtimeRatePerHour ?? worker.overtimeRatePerHour ?? 80)
  );

  const handleSave = () => {
    const wageNum = parseFloat(dailyWage) || 500;
    const otNum = parseFloat(otRate) || 80;

    if (mode === 'today_only') {
      onSaveTodayOverride(wageNum, otNum);
    } else {
      onSavePermanentBase(wageNum, otNum);
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                {language === 'ta'
                  ? 'தொழிலாளர் கூலியை மாற்று'
                  : language === 'ml'
                  ? 'തൊഴിലാളി വേതനം പുതുക്കുക'
                  : 'Adjust Labor Wage'}
              </Text>
              <Text style={[styles.workerName, { color: colors.primary }]}>
                {getLocalizedWorkerName(worker.name, language)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Scope Selector: Today Only vs Future Base */}
          <View style={[styles.scopeToggle, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={[
                styles.scopeBtn,
                mode === 'today_only' && [styles.scopeBtnActive, { backgroundColor: isDark ? '#451A03' : '#FEF3C7', borderColor: colors.accent }],
              ]}
              onPress={() => setMode('today_only')}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color={mode === 'today_only' ? colors.accent : colors.textMuted}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.scopeBtnText, { color: mode === 'today_only' ? colors.accent : colors.textMuted }]}>
                Today Only ({selectedDateFormatted})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.scopeBtn,
                mode === 'future_base' && [styles.scopeBtnActive, { backgroundColor: isDark ? '#064E3B' : '#D1FAE5', borderColor: colors.primary }],
              ]}
              onPress={() => setMode('future_base')}
            >
              <Ionicons
                name="trending-up-outline"
                size={14}
                color={mode === 'future_base' ? colors.primary : colors.textMuted}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.scopeBtnText, { color: mode === 'future_base' ? colors.primary : colors.textMuted }]}>
                Update Base Rate
              </Text>
            </TouchableOpacity>
          </View>

          {/* Explanatory note */}
          <View style={[styles.noteBox, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <Text style={[styles.noteText, { color: colors.textMuted }]}>
              {mode === 'today_only'
                ? `Special condition override for ${selectedDateFormatted} only (e.g. hazardous spray or heavy digging). Past records and future days remain completely untouched.`
                : 'Updates his standard base wage for future attendance records (e.g., Labor Department revision). All past records up to yesterday remain permanently frozen.'}
            </Text>
          </View>

          {/* Inputs */}
          <View style={styles.inputsRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.text }]}>Daily Wage (₹)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.cardBorder }]}
                value={dailyWage}
                onChangeText={setDailyWage}
                keyboardType="numeric"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.accent }]}>OT Rate / Hr (₹)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceSubtle, color: colors.accent, borderColor: colors.cardBorder }]}
                value={otRate}
                onChangeText={setOtRate}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: mode === 'today_only' ? colors.accent : colors.primary }]}
            onPress={handleSave}
          >
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>
              {mode === 'today_only' ? `Apply ₹${dailyWage} to Today Only` : `Set Standard Base to ₹${dailyWage}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  workerName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scopeToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    gap: 4,
  },
  scopeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  scopeBtnActive: {
    borderWidth: 1,
  },
  scopeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noteBox: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '800',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
