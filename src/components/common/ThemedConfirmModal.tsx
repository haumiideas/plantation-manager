import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export type ThemedModalType = 'success' | 'confirm' | 'warning' | 'delete' | 'info';

interface ThemedConfirmModalProps {
  visible: boolean;
  type?: ThemedModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isSingleButton?: boolean;
}

export const ThemedConfirmModal: React.FC<ThemedConfirmModalProps> = ({
  visible,
  type = 'info',
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isSingleButton = false,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  if (!visible) return null;

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: '#059669',
          bg: isDark ? '#064E3B' : '#D1FAE5',
        };
      case 'delete':
        return {
          icon: 'trash-outline' as const,
          color: '#DC2626',
          bg: isDark ? '#450A0A' : '#FEE2E2',
        };
      case 'warning':
        return {
          icon: 'warning-outline' as const,
          color: '#D97706',
          bg: isDark ? '#451A03' : '#FEF3C7',
        };
      case 'confirm':
        return {
          icon: 'help-circle-outline' as const,
          color: '#3B82F6',
          bg: isDark ? '#172554' : '#DBEAFE',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle-outline' as const,
          color: colors.primary,
          bg: colors.surfaceSubtle,
        };
    }
  };

  const config = getIconConfig();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.dialogCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Header Icon */}
          <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={32} color={config.color} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>

          {/* Actions */}
          <View style={styles.actionRow}>
            {!isSingleButton && (
              <TouchableOpacity
                onPress={onCancel}
                style={[
                  styles.cancelBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                ]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>
                  {cancelText || t('cancel')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onConfirm || onCancel}
              style={[
                styles.confirmBtn,
                {
                  backgroundColor:
                    type === 'delete'
                      ? '#DC2626'
                      : type === 'warning'
                      ? '#D97706'
                      : colors.primary,
                  flex: isSingleButton ? 1 : 1,
                },
              ]}
            >
              <Text style={styles.confirmBtnText}>
                {confirmText || (type === 'delete' ? t('delete') : t('confirm'))}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
