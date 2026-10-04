import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedWorkerName, getLocalizedTaskName } from '../../utils/localizationUtils';
import { PlantationWorker } from '../../types/worker';
import { AttendanceRecord, AttendanceStatus } from '../../types/attendance';

interface Props {
  worker: PlantationWorker;
  record?: AttendanceRecord;
  onStatusChange: (status: AttendanceStatus) => void;
  onOvertimeChange: (hours: number) => void;
  onTaskPress: () => void;
  onWagePress: () => void;
  onLeftFarmPress: () => void;
}

export const WorkerAttendanceCard: React.FC<Props> = ({
  worker,
  record,
  onStatusChange,
  onOvertimeChange,
  onTaskPress,
  onWagePress,
  onLeftFarmPress,
}) => {
  const { colors, isDark } = useTheme();
  const { role } = useAuth();
  const { language } = useLanguage();
  const isAdmin = role === 'admin';

  const currentStatus: AttendanceStatus = record ? record.status : 'unmarked';
  const overtimeHours: number = record?.overtimeHours || 0;
  const currentTask: string = record?.allocatedTask || 'Cardamom Picking';

  // Toggle or deselect logic
  const handleToggleStatus = (target: AttendanceStatus) => {
    if (currentStatus === target) {
      // Re-tapping the active state deselects it back to unmarked!
      onStatusChange('unmarked');
    } else {
      onStatusChange(target);
    }
  };

  const handleDecreaseOT = () => {
    if (overtimeHours > 0) {
      onOvertimeChange(overtimeHours - 1);
    }
  };

  const handleIncreaseOT = () => {
    if (overtimeHours < 8) {
      onOvertimeChange(overtimeHours + 1);
    }
  };

  // Dynamic card border & background tint based on status
  const cardBorderColor =
    currentStatus === 'present'
      ? (isDark ? '#059669' : '#10B981')
      : currentStatus === 'half_day'
      ? (isDark ? '#D97706' : '#F59E0B')
      : currentStatus === 'absent'
      ? (isDark ? '#DC2626' : '#EF4444')
      : colors.cardBorder;

  const cardBgColor =
    currentStatus === 'present'
      ? (isDark ? '#0C1C13' : '#F0FDF4')
      : currentStatus === 'half_day'
      ? (isDark ? '#1C150A' : '#FFFBEB')
      : currentStatus === 'absent'
      ? (isDark ? '#1C0D0D' : '#FEF2F2')
      : colors.card;

  const initials = worker.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.card, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
      {/* Top Line: Worker Avatar, Name & 3-Way Toggle */}
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
          <Text style={[styles.avatarText, { color: isDark ? colors.primaryLight : colors.primary }]}>
            {initials}
          </Text>
        </View>

        <View style={styles.nameCol}>
          <Text style={[styles.name, { color: colors.text }]}>
            {getLocalizedWorkerName(worker.name, language)}
          </Text>
          {record?.isWageOverriddenToday && (
            <Text style={[styles.overrideBadge, { color: colors.accent }]}>
              ★ Today's Wage Adjusted: ₹{record.dailyWageRate}/d
            </Text>
          )}
        </View>

        {/* 3-Button Segment: P | HD | A with click-to-deselect */}
        <View style={[styles.toggleContainer, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
          {/* Present */}
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              currentStatus === 'present' && [styles.btnPresentActive, { backgroundColor: isDark ? '#059669' : '#10B981' }],
            ]}
            onPress={() => handleToggleStatus('present')}
            accessibilityLabel={`Mark ${worker.name} present`}
          >
            <Text
              style={[
                styles.toggleBtnText,
                { color: currentStatus === 'present' ? '#FFFFFF' : colors.textMuted },
              ]}
            >
              P
            </Text>
          </TouchableOpacity>

          {/* Half-Day */}
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              currentStatus === 'half_day' && [styles.btnHalfDayActive, { backgroundColor: isDark ? '#D97706' : '#F59E0B' }],
            ]}
            onPress={() => handleToggleStatus('half_day')}
            accessibilityLabel={`Mark ${worker.name} half day`}
          >
            <Text
              style={[
                styles.toggleBtnText,
                { color: currentStatus === 'half_day' ? '#FFFFFF' : colors.textMuted },
              ]}
            >
              HD
            </Text>
          </TouchableOpacity>

          {/* Absent */}
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              currentStatus === 'absent' && [styles.btnAbsentActive, { backgroundColor: isDark ? '#DC2626' : '#EF4444' }],
            ]}
            onPress={() => handleToggleStatus('absent')}
            accessibilityLabel={`Mark ${worker.name} absent`}
          >
            <Text
              style={[
                styles.toggleBtnText,
                { color: currentStatus === 'absent' ? '#FFFFFF' : colors.textMuted },
              ]}
            >
              A
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Middle Line: Today's Dynamic Task Allocation + Overtime Stepper */}
      <View style={[styles.middleRow, { borderTopColor: colors.border }]}>
        {/* Dynamic Task Chip - Tap to reallocate work for today */}
        <TouchableOpacity
          style={[styles.taskChip, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
          onPress={onTaskPress}
          accessibilityLabel="Change allocated task for today"
        >
          <Ionicons name="briefcase-outline" size={13} color={colors.primary} />
          <Text style={[styles.taskChipText, { color: colors.text }]} numberOfLines={1}>
            {getLocalizedTaskName(currentTask, language)}
          </Text>
          <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Overtime (OT) Stepper */}
        <View
          style={[
            styles.otStepper,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: overtimeHours > 0 ? (isDark ? '#D97706' : '#F59E0B') : colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.otLabel, { color: colors.textMuted }]}>OT:</Text>
          <TouchableOpacity
            onPress={handleDecreaseOT}
            disabled={overtimeHours === 0}
            style={styles.otBtn}
            accessibilityLabel="Decrease overtime hours"
          >
            <Ionicons name="remove" size={14} color={overtimeHours > 0 ? colors.text : colors.textMuted} />
          </TouchableOpacity>

          <Text style={[styles.otValue, { color: overtimeHours > 0 ? colors.accent : colors.text }]}>
            {overtimeHours}h
          </Text>

          <TouchableOpacity
            onPress={handleIncreaseOT}
            style={styles.otBtn}
            accessibilityLabel="Increase overtime hours"
          >
            <Ionicons name="add" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Line: Admin Wage Details & Actions Menu */}
      <View style={[styles.bottomRow, { borderTopColor: colors.border }]}>
        {isAdmin ? (
          <TouchableOpacity onPress={onWagePress} style={styles.wageDisplayRow}>
            <Text style={[styles.wageInfoText, { color: colors.textMuted }]}>
              Base:{' '}
              <Text style={{ fontWeight: '700', color: colors.text }}>
                ₹{record?.dailyWageRate ?? worker.dailyWageRate}/d
              </Text>{' '}
              • OT:{' '}
              <Text style={{ fontWeight: '700', color: colors.accent }}>
                ₹{record?.overtimeRatePerHour ?? worker.overtimeRatePerHour}/hr
              </Text>
            </Text>
            <Ionicons name="pencil" size={11} color={colors.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ) : (
          <View />
        )}

        <TouchableOpacity onPress={onLeftFarmPress} style={styles.leftFarmBtn}>
          <Ionicons name="exit-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.leftFarmText, { color: colors.textMuted }]}>Left Farm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  nameCol: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  overrideBadge: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPresentActive: {},
  btnHalfDayActive: {},
  btnAbsentActive: {},
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 8,
  },
  taskChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  taskChipText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  otStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  otLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  otBtn: {
    padding: 2,
  },
  otValue: {
    fontSize: 13,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 6,
  },
  wageDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wageInfoText: {
    fontSize: 11,
  },
  leftFarmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  leftFarmText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
