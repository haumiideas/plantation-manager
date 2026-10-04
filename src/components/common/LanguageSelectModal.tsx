import React from 'react';
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
import { Language, LANGUAGE_OPTIONS } from '../../i18n/translations';

interface LanguageSelectModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelectModal: React.FC<LanguageSelectModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const handleSelectLanguage = async (code: Language) => {
    await setLanguage(code);
    onClose();
  };

  const getSubDesc = (code: Language): string => {
    switch (code) {
      case 'en':
        return 'Standard Estate Operations & Financial MIS';
      case 'ta':
        return 'தமிழ்நாடு & கேரளா எல்லை எஸ்டேட் நிர்வாகம்';
      case 'ml':
        return 'കേരള ഏലം, കുരുമുളക്, കാപ്പി തോട്ടം രേഖകൾ';
      default:
        return '';
    }
  };

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
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {t('chooseLanguage')}
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    Select your preferred vernacular display language
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Language Options List */}
              <View style={styles.optionsList}>
                {LANGUAGE_OPTIONS.map((opt) => {
                  const isSelected = language === opt.code;
                  return (
                    <TouchableOpacity
                      key={opt.code}
                      onPress={() => handleSelectLanguage(opt.code)}
                      style={[
                        styles.langCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? '#14532D'
                              : '#DCFCE7'
                            : isDark
                            ? colors.surfaceSubtle
                            : '#F8FAFC',
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.langLeft}>
                        <View
                          style={[
                            styles.langIconBox,
                            {
                              backgroundColor: isSelected
                                ? colors.primary
                                : isDark
                                ? '#374151'
                                : '#E2E8F0',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.langCodeText,
                              { color: isSelected ? '#FFFFFF' : colors.text },
                            ]}
                          >
                            {opt.code.toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={[styles.nativeText, { color: colors.text }]}>
                            {opt.nativeLabel}
                          </Text>
                          <Text style={[styles.subText, { color: colors.textMuted }]}>
                            {opt.label} • {getSubDesc(opt.code)}
                          </Text>
                        </View>
                      </View>

                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      ) : (
                        <View style={[styles.radioOutline, { borderColor: colors.border }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Close Button */}
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeActionBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.closeActionText, { color: colors.text }]}>
                  {t('close')}
                </Text>
              </TouchableOpacity>
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
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  optionsList: {
    gap: 10,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  langIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langCodeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  nativeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  subText: {
    fontSize: 11,
    marginTop: 1,
  },
  radioOutline: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  closeActionBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
