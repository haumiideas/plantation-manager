import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGE_OPTIONS, Language } from '../../i18n/translations';
import { getFarmAcreages, saveFarmAcreages, FarmAcreageConfig } from '../../services/farmService';
import { FarmAcreageModal } from '../../components/farm/FarmAcreageModal';
import { AuditTrailModal } from '../../components/common/AuditTrailModal';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';

export const SettingsScreen: React.FC = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, role, orgId, signOut, switchRole, isFirebaseReady } = useAuth();
  const { language, setLanguage, t, translateUserText } = useLanguage();
  const effectiveOrgId = orgId || 'plantation_org_namari_adukidathan';

  const [acreages, setAcreages] = useState<FarmAcreageConfig>({ namari: 0, adukidathan: 0 });
  const [showAcreageModal, setShowAcreageModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  useEffect(() => {
    loadAcreages();
  }, [effectiveOrgId]);

  const loadAcreages = async () => {
    const data = await getFarmAcreages(effectiveOrgId);
    setAcreages(data);
  };

  const handleSaveAcreages = async (newAcreages: FarmAcreageConfig) => {
    await saveFarmAcreages(effectiveOrgId, newAcreages);
    setAcreages(newAcreages);
    setShowAcreageModal(false);
  };

  return (
    <ScreenContainer header={<AppHeader />}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Settings Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>{t('settingsTitle')}</Text>
          <Text style={[styles.screenSubtitle, { color: colors.textMuted }]}>
            {t('settingsSubtitle')}
          </Text>
        </View>

        {/* Language Selection Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('selectLanguage')}</Text>
          <View style={styles.langRow}>
            {LANGUAGE_OPTIONS.map((opt) => {
              const isSelected = language === opt.code;
              return (
                <TouchableOpacity
                  key={opt.code}
                  style={[
                    styles.langChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                      borderColor: isSelected ? colors.primary : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setLanguage(opt.code)}
                >
                  <Text
                    style={[
                      styles.langChipText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {opt.nativeLabel} ({opt.label})
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* User & Organization Details */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('activeUser')}</Text>

          <View style={styles.rowItem}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Name</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>{user?.displayName || 'Admin User'}</Text>
          </View>
          <View style={styles.rowItem}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Email</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>{user?.email || 'admin@plantation.local'}</Text>
          </View>
          <View style={styles.rowItem}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{t('role')}</Text>
            <View style={[styles.badge, { backgroundColor: '#422006', borderColor: '#D97706' }]}>
              <Text style={{ color: '#FDE68A', fontSize: 11, fontWeight: '700' }}>
                {role?.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.rowItem}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Tenant Org ID</Text>
            <Text style={[styles.rowValue, { color: colors.primary }]} numberOfLines={1}>
              {effectiveOrgId}
            </Text>
          </View>
        </View>

        {/* Farm Acreage Configuration */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('farmAcreageSetup')}</Text>
            <TouchableOpacity
              style={[styles.editAcreageBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
              onPress={() => setShowAcreageModal(true)}
            >
              <Ionicons name="pencil" size={13} color={colors.primary} />
              <Text style={[styles.editAcreageBtnText, { color: colors.primary }]}>{t('edit')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rowItem}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{t('namariAcreage')}</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>
              {acreages.namari > 0 ? `${acreages.namari} ${t('acres')}` : 'Not set'}
            </Text>
          </View>
          <View style={styles.rowItem}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{t('adukidathanAcreage')}</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>
              {acreages.adukidathan > 0 ? `${acreages.adukidathan} ${t('acres')}` : 'Not set'}
            </Text>
          </View>
        </View>

        {/* Display & Appearance */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('appearance')}</Text>

          <View style={styles.rowItemBetween}>
            <View>
              <Text style={[styles.rowLabelBold, { color: colors.text }]}>{t('darkTheme')}</Text>
              <Text style={[styles.rowSubLabel, { color: colors.textMuted }]}>
                {t('darkThemeDesc')}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              thumbColor={isDark ? colors.primaryLight : '#F4F7F4'}
              trackColor={{ false: '#767577', true: colors.surfaceSubtle }}
            />
          </View>
        </View>

        {/* Multi-Farm Setup */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('managedPlantations')}</Text>
          <View style={styles.farmItem}>
            <Ionicons name="leaf-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.farmName, { color: colors.text }]}>{translateUserText('Namari Farm')}</Text>
              <Text style={[styles.farmDesc, { color: colors.textMuted }]}>
                Block 1 • Cardamom & Pepper ({acreages.namari > 0 ? `${acreages.namari} ${t('acres')}` : 'Acreage not set'})
              </Text>
            </View>
            <Text style={[styles.tag, { color: colors.primary }]}>{t('active')}</Text>
          </View>
          <View style={[styles.farmItem, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Ionicons name="leaf-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.farmName, { color: colors.text }]}>{translateUserText('Adukidathan Farm')}</Text>
              <Text style={[styles.farmDesc, { color: colors.textMuted }]}>
                Block 2 • Cardamom & Pepper ({acreages.adukidathan > 0 ? `${acreages.adukidathan} ${t('acres')}` : 'Acreage not set'})
              </Text>
            </View>
            <Text style={[styles.tag, { color: colors.primary }]}>{t('active')}</Text>
          </View>
        </View>

        {/* Role Evaluation Shortcut (Switch to Supervisor) */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('switchRole')}</Text>
          <Text style={[styles.rowSubLabel, { color: colors.textMuted, marginBottom: 12 }]}>
            {t('switchRoleDesc')}
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
            onPress={() => switchRole('supervisor')}
          >
            <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              {t('switchToSupervisor')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* System Audit Trail & Compliance */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('auditTrailTitle') || 'System Audit Trail'}</Text>
          <Text style={[styles.rowSubLabel, { color: colors.textMuted, marginBottom: 12 }]}>
            {t('auditTrailDesc')}
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
            onPress={() => setShowAuditModal(true)}
          >
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              {t('viewAuditTrail') || 'Open Audit Trail & Activity Logs'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: colors.danger, backgroundColor: isDark ? '#2D1414' : '#FEE2E2' }]}
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={[styles.signOutText, { color: colors.danger }]}>{t('signOut')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Farm Acreage Edit Modal */}
      <FarmAcreageModal
        visible={showAcreageModal}
        onClose={() => setShowAcreageModal(false)}
        currentAcreages={acreages}
        onSave={handleSaveAcreages}
      />

      {/* System Audit Trail Modal */}
      <AuditTrailModal
        visible={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        orgId={effectiveOrgId}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
  },
  titleContainer: {
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowItemBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  rowLabelBold: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  farmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  farmName: {
    fontSize: 14,
    fontWeight: '700',
  },
  farmDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  tag: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  langChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editAcreageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  editAcreageBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
