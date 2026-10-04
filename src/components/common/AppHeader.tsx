import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { FarmSwitcher } from './FarmSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelectModal } from './LanguageSelectModal';
import { AuditTrailModal } from './AuditTrailModal';
import { ReportExportModal } from '../export/ReportExportModal';
import { formatDateWithDay, getDayOfWeekKey, formatDateLocalized } from '../../utils/date';

const ESTATE_NAME_KEY = '@plantation_custom_estate_name';

export const AppHeader: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { user, role, orgId, signOut, switchRole } = useAuth();
  const { language, t } = useLanguage();
  const [showLangModal, setShowLangModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Estate name custom branding
  const [estateName, setEstateName] = useState('Farmag App');
  const [showNameModal, setShowNameModal] = useState(false);
  const [editNameText, setEditNameText] = useState('Farmag App');

  const dayKey = getDayOfWeekKey();
  const localizedDay = t(dayKey) || dayKey;
  const todayFormatted = `${localizedDay}, ${formatDateLocalized(new Date(), language)}`;

  useEffect(() => {
    AsyncStorage.getItem(ESTATE_NAME_KEY)
      .then((val) => {
        if (val && val.trim()) {
          setEstateName(val.trim());
          setEditNameText(val.trim());
        }
      })
      .catch((err) => console.warn('Failed to load estate name', err));
  }, []);

  const handleSaveEstateName = async () => {
    const finalName = editNameText.trim() || 'Farmag App';
    setEstateName(finalName);
    try {
      await AsyncStorage.setItem(ESTATE_NAME_KEY, finalName);
    } catch (err) {
      console.warn('Failed to save estate name', err);
    }
    setShowNameModal(false);
  };

  const handleResetEstateName = async () => {
    setEstateName('Farmag App');
    setEditNameText('Farmag App');
    try {
      await AsyncStorage.removeItem(ESTATE_NAME_KEY);
    } catch (err) {
      console.warn('Failed to reset estate name', err);
    }
    setShowNameModal(false);
  };

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.cardBorder,
        },
      ]}
    >
      {/* Top Bar: Title, Role Badge, Actions */}
      <View style={styles.topRow}>
        {/* Brand Container - No wrapping, tap to rename estate */}
        <TouchableOpacity
          style={styles.brandContainer}
          onPress={() => {
            setEditNameText(estateName);
            setShowNameModal(true);
          }}
          activeOpacity={0.7}
          accessibilityLabel={`App branding: ${estateName}. Tap to change name.`}
        >
          <Ionicons
            name="leaf"
            size={18}
            color={isDark ? colors.primaryLight : colors.primary}
            style={styles.brandIcon}
          />
          <View style={styles.brandTextWrap}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text
                style={[styles.brandTitle, { color: colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {estateName}
              </Text>
              <Ionicons name="pencil" size={10} color={colors.textMuted} />
            </View>
            <Text style={[styles.dateText, { color: colors.textMuted }]} numberOfLines={1}>
              {todayFormatted}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actionsContainer}>
          {/* Role Badge (Tap to toggle demo role for quick evaluation) */}
          <TouchableOpacity
            style={[
              styles.roleBadge,
              {
                backgroundColor:
                  role === 'admin'
                    ? (isDark ? '#422006' : '#FEF3C7')
                    : (isDark ? '#064E3B' : '#D1FAE5'),
                borderColor:
                  role === 'admin'
                    ? (isDark ? '#D97706' : '#F59E0B')
                    : (isDark ? '#059669' : '#10B981'),
              },
            ]}
            onPress={() => {
              // Quick demo switch between admin and supervisor
              switchRole(role === 'admin' ? 'supervisor' : 'admin');
            }}
            accessibilityLabel={`Current role: ${role}. Tap to switch demo role`}
          >
            <Ionicons
              name={role === 'admin' ? 'shield-checkmark' : 'person-circle-outline'}
              size={11}
              color={role === 'admin' ? '#F59E0B' : '#10B981'}
              style={{ marginRight: 3 }}
            />
            <Text
              style={[
                styles.roleBadgeText,
                {
                  color: role === 'admin'
                    ? (isDark ? '#FDE68A' : '#92400E')
                    : (isDark ? '#A7F3D0' : '#065F46'),
                },
              ]}
            >
              {role === 'admin' ? t('admin') : t('supervisor')}
            </Text>
          </TouchableOpacity>

          {/* Language Selection Button */}
          <TouchableOpacity
            style={[
              styles.langBtn,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
            ]}
            onPress={() => setShowLangModal(true)}
            accessibilityLabel="Change vernacular language"
            accessibilityRole="button"
          >
            <Ionicons name="globe-outline" size={13} color={colors.primary} />
            <Text style={[styles.langBtnText, { color: colors.text }]}>
              {language === 'en' ? 'EN' : language === 'ta' ? 'தமிழ்' : 'മല'}
            </Text>
            <Ionicons name="chevron-down" size={9} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Theme Toggle (Light / Dark) */}
          <ThemeToggle />

          {/* Export Reports Button */}
          <TouchableOpacity
            style={[
              styles.auditBtn,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
            ]}
            onPress={() => setShowExportModal(true)}
            accessibilityLabel="Export Reports"
            accessibilityRole="button"
          >
            <Ionicons name="download-outline" size={14} color={colors.primary} />
          </TouchableOpacity>

          {/* Audit Trail Button */}
          <TouchableOpacity
            style={[
              styles.auditBtn,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
            ]}
            onPress={() => setShowAuditModal(true)}
            accessibilityLabel="View Audit Trail"
            accessibilityRole="button"
          >
            <Ionicons name="time-outline" size={14} color={colors.primary} />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={signOut}
            style={[
              styles.logoutButton,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.cardBorder,
              },
            ]}
            accessibilityLabel="Sign out"
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Farm Context Switcher */}
      <View style={styles.switcherRow}>
        <FarmSwitcher />
      </View>

      {/* Language Selection Modal */}
      <LanguageSelectModal
        visible={showLangModal}
        onClose={() => setShowLangModal(false)}
      />

      {/* Audit Trail Modal */}
      <AuditTrailModal
        visible={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        orgId={orgId || 'plantation_org_namari_adukidathan'}
      />

      {/* Report & Compliance Export Modal */}
      <ReportExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Custom Estate Branding Modal */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Ionicons name="leaf" size={20} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('customEstateBranding') || 'Custom Estate Branding'}
              </Text>
            </View>

            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              {t('customEstateBrandingDesc') || 'Personalize the top header with your plantation or company name (e.g. Namari & Adukidathan Estates, Farmag App, Valley High).'}
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
              ]}
              value={editNameText}
              onChangeText={setEditNameText}
              placeholder="e.g. Farmag App or High Range Estates"
              placeholderTextColor={colors.textMuted}
              maxLength={30}
              autoFocus
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                onPress={handleResetEstateName}
                style={[styles.modalBtnSec, { backgroundColor: colors.surfaceSubtle }]}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>
                  {t('resetDefault') || 'Reset Default'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowNameModal(false)}
                style={[styles.modalBtnSec, { backgroundColor: colors.surfaceSubtle }]}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
                  {t('cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEstateName}
                style={[styles.modalBtnPri, { backgroundColor: colors.primary }]}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                  {t('saveName') || 'Save Name'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    maxWidth: 130,
    marginRight: 4,
  },
  brandIcon: {
    marginRight: 5,
  },
  brandTextWrap: {
    flexShrink: 1,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  logoutButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switcherRow: {
    marginTop: 2,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  langBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  auditBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  modalInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  modalBtnSec: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalBtnPri: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
