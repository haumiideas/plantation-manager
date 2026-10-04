import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFarm } from '../../context/FarmContext';
import { LANGUAGE_OPTIONS, Language } from '../../i18n/translations';
import {
  hasCompletedInitialSetup,
  setInitialSetupCompleted,
  saveCustomFarms,
  getCustomFarms,
} from '../../services/farmService';

interface InitialSetupModalProps {
  orgId: string;
  onSetupDone?: () => void;
}

export const InitialSetupModal: React.FC<InitialSetupModalProps> = ({
  orgId,
  onSetupDone,
}) => {
  const { colors, isDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { refreshFarms } = useFarm();
  const [visible, setVisible] = useState(false);

  // Per user instruction: Ask for farm names and acreages without hardcoded defaults
  const [farm1Name, setFarm1Name] = useState('');
  const [farm1Acreage, setFarm1Acreage] = useState('');
  const [farm2Name, setFarm2Name] = useState('');
  const [farm2Acreage, setFarm2Acreage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const checkSetup = async () => {
      const completed = await hasCompletedInitialSetup(orgId);
      if (!completed) {
        setVisible(true);
      }
    };
    checkSetup();
  }, [orgId]);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
  };

  const handleComplete = async () => {
    const a1 = parseFloat(farm1Acreage) || 0;
    const a2 = parseFloat(farm2Acreage) || 0;

    const f1Name = farm1Name.trim() || 'Estate 1';
    const f2Name = farm2Name.trim() || 'Estate 2';

    await saveCustomFarms(orgId, {
      farm1: {
        id: 'namari',
        name: f1Name,
        shortCode: f1Name.slice(0, 3).toUpperCase(),
        acreage: a1,
      },
      farm2: {
        id: 'adukidathan',
        name: f2Name,
        shortCode: f2Name.slice(0, 3).toUpperCase(),
        acreage: a2,
      },
    });

    await setInitialSetupCompleted(orgId, true);
    await refreshFarms();
    setVisible(false);
    if (onSetupDone) onSetupDone();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="sparkles" size={24} color="#10B981" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('initialSetup')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {t('initialSetupSubtitle')}
            </Text>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Step 1: Language Selection */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="language" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('selectLanguage')}
                </Text>
              </View>

              <View style={styles.langRow}>
                {LANGUAGE_OPTIONS.map((opt) => {
                  const isSelected = language === opt.code;
                  return (
                    <TouchableOpacity
                      key={opt.code}
                      onPress={() => handleLanguageSelect(opt.code)}
                      style={[
                        styles.langChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.background,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.langNative,
                          {
                            color: isSelected ? '#FFFFFF' : colors.text,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {opt.nativeLabel}
                      </Text>
                      <Text
                        style={[
                          styles.langSub,
                          {
                            color: isSelected ? '#E6F4EA' : colors.textMuted,
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 2: Custom Farm Names & Acreage Setup */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="business-outline" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('farmAcreageSetup')}
                </Text>
              </View>
              <Text style={[styles.hintText, { color: colors.textMuted }]}>
                Enter the names and land sizes of your estate sections / plantations:
              </Text>

              {/* Farm 1 Block */}
              <View style={[styles.farmBlock, { borderColor: colors.border }]}>
                <Text style={[styles.farmBlockHeader, { color: colors.primary }]}>
                  Plantation / Farm 1
                </Text>
                <View style={styles.fieldRow}>
                  <View style={{ flex: 1.4 }}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Farm Name</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="e.g. Valley Estate"
                      placeholderTextColor={colors.textMuted}
                      value={farm1Name}
                      onChangeText={setFarm1Name}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Acreage (Acres)</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 25.0"
                      placeholderTextColor={colors.textMuted}
                      value={farm1Acreage}
                      onChangeText={setFarm1Acreage}
                    />
                  </View>
                </View>
              </View>

              {/* Farm 2 Block */}
              <View style={[styles.farmBlock, { borderColor: colors.border }]}>
                <Text style={[styles.farmBlockHeader, { color: colors.primary }]}>
                  Plantation / Farm 2 (Optional)
                </Text>
                <View style={styles.fieldRow}>
                  <View style={{ flex: 1.4 }}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Farm Name</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="e.g. Hilltop Section"
                      placeholderTextColor={colors.textMuted}
                      value={farm2Name}
                      onChangeText={setFarm2Name}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Acreage (Acres)</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 30.0"
                      placeholderTextColor={colors.textMuted}
                      value={farm2Acreage}
                      onChangeText={setFarm2Acreage}
                    />
                  </View>
                </View>
              </View>
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleComplete}
              style={[styles.completeBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.completeBtnText}>{t('completeSetup')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  scrollArea: {
    maxHeight: 460,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 16,
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  langNative: {
    fontSize: 15,
  },
  langSub: {
    fontSize: 11,
    marginTop: 2,
  },
  farmBlock: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  farmBlockHeader: {
    fontSize: 13,
    fontWeight: '700',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
