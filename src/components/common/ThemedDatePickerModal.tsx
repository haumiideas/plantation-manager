import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  formatDate,
  parseEstateDate,
  getDayOfWeekKey,
  MONTH_NAMES,
  FULL_MONTH_NAMES,
} from '../../utils/date';

interface ThemedDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate?: Date | string | null;
  onSelectDate: (formattedDate: string, isoDate: string, dayOfWeek: string) => void;
  title?: string;
}

export const ThemedDatePickerModal: React.FC<ThemedDatePickerModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  title,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const getInitialDate = (): Date => {
    if (!selectedDate) return new Date();
    if (selectedDate instanceof Date) return selectedDate;
    const parsed = parseEstateDate(selectedDate);
    return parsed || new Date();
  };

  const [activeDate, setActiveDate] = useState<Date>(getInitialDate());
  const [viewYear, setViewYear] = useState<number>(getInitialDate().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(getInitialDate().getMonth()); // 0-11

  useEffect(() => {
    if (visible) {
      const d = getInitialDate();
      setActiveDate(d);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [visible, selectedDate]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const startDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  };

  const totalDays = daysInMonth(viewYear, viewMonth);
  const offset = startDayOfMonth(viewYear, viewMonth);

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < offset; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysArray.push(d);
  }

  const today = new Date();
  const isCurrentMonthToday =
    today.getFullYear() === viewYear && today.getMonth() === viewMonth;

  const handleSelectDay = (day: number) => {
    const chosen = new Date(viewYear, viewMonth, day, 12, 0, 0);
    setActiveDate(chosen);
  };

  const handleQuickToday = () => {
    const now = new Date();
    setActiveDate(now);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const handleQuickYesterday = () => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    setActiveDate(yest);
    setViewYear(yest.getFullYear());
    setViewMonth(yest.getMonth());
  };

  const handleConfirm = () => {
    const formattedDate = formatDate(activeDate);
    const isoDate = activeDate.toISOString().split('T')[0];
    const dayKey = getDayOfWeekKey(activeDate);
    const dayName = t(dayKey);
    onSelectDate(formattedDate, isoDate, dayName);
    onClose();
  };

  const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              {/* Header Title */}
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {title || t('selectDate')}
                  </Text>
                  <Text style={[styles.headerSubtitle, { color: isDark ? colors.primaryLight : colors.primary }]}>
                    {t(getDayOfWeekKey(activeDate))}, {formatDate(activeDate)}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Month Navigation */}
              <View
                style={[
                  styles.navRow,
                  { backgroundColor: isDark ? colors.surfaceSubtle : '#F8FAFC', borderColor: colors.border },
                ]}
              >
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                  <Ionicons name="chevron-back" size={18} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.monthYearText, { color: colors.text }]}>
                  {FULL_MONTH_NAMES[viewMonth]} {viewYear}
                </Text>

                <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                  <Ionicons name="chevron-forward" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Day of Week Labels */}
              <View style={styles.weekRow}>
                {WEEK_DAYS.map((wd, idx) => (
                  <Text key={idx} style={[styles.weekDayText, { color: colors.textMuted }]}>
                    {wd}
                  </Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {daysArray.map((day, idx) => {
                  if (day === null) {
                    return <View key={`empty-${idx}`} style={styles.dayCell} />;
                  }

                  const isSelected =
                    activeDate.getFullYear() === viewYear &&
                    activeDate.getMonth() === viewMonth &&
                    activeDate.getDate() === day;

                  const isTodayDay = isCurrentMonthToday && today.getDate() === day;

                  return (
                    <TouchableOpacity
                      key={`day-${day}`}
                      onPress={() => handleSelectDay(day)}
                      style={[
                        styles.dayCell,
                        isSelected && {
                          backgroundColor: colors.primary,
                          borderRadius: 20,
                        },
                        !isSelected && isTodayDay && {
                          borderColor: colors.primary,
                          borderWidth: 1,
                          borderRadius: 20,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : isTodayDay
                              ? colors.primary
                              : colors.text,
                            fontWeight: isSelected || isTodayDay ? '800' : '500',
                          },
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quick Actions (Today / Yesterday) */}
              <View style={styles.quickRow}>
                <TouchableOpacity
                  onPress={handleQuickToday}
                  style={[
                    styles.quickPill,
                    { backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9', borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.quickText, { color: colors.primary }]}>
                    {t('today')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleQuickYesterday}
                  style={[
                    styles.quickPill,
                    { backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9', borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.quickText, { color: colors.textMuted }]}>
                    {t('yesterday')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Footer Buttons */}
              <View style={styles.footerRow}>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>
                    {t('cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirm}
                  style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmBtnText}>{t('confirm')}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  navBtn: {
    padding: 6,
  },
  monthYearText: {
    fontSize: 14,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekDayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dayText: {
    fontSize: 13,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  quickPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
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
