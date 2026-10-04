import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { WorkerCategory, PlantationWorker, WORKER_CATEGORY_LABELS } from '../../types/worker';
import { CropType } from '../../types/crop';
import { FarmId } from '../../types/farm';

interface Props {
  visible: boolean;
  defaultFarmId: FarmId;
  onClose: () => void;
  onWorkerAdded: (worker: PlantationWorker) => void;
}

export const AddWorkerModal: React.FC<Props> = ({
  visible,
  defaultFarmId,
  onClose,
  onWorkerAdded,
}) => {
  const { colors, isDark } = useTheme();
  const { role, orgId } = useAuth();
  const isAdmin = role === 'admin';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [farmId, setFarmId] = useState<FarmId>(defaultFarmId === 'consolidated' ? 'namari' : defaultFarmId);
  const [category, setCategory] = useState<WorkerCategory>('picker');
  const [crops, setCrops] = useState<CropType[]>(['cardamom']);
  const [wageRate, setWageRate] = useState('520');
  const [otRate, setOtRate] = useState('80');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleCrop = (crop: CropType) => {
    if (crops.includes(crop)) {
      if (crops.length > 1) {
        setCrops(crops.filter((c) => c !== crop));
      }
    } else {
      setCrops([...crops, crop]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMsg('Please enter worker name');
      return;
    }

    const newWorker: PlantationWorker = {
      id: `worker_${farmId}_${Date.now()}`,
      orgId: orgId || 'plantation_org_namari_adukidathan',
      farmId,
      name: name.trim(),
      phone: phone.trim() || undefined,
      category,
      crops,
      dailyWageRate: parseFloat(wageRate) || 520,
      overtimeRatePerHour: parseFloat(otRate) || 80,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    onWorkerAdded(newWorker);
    setName('');
    setPhone('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="person-add" size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Add Field Worker</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll}>
            {errorMsg && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
            )}

            {/* Worker Name */}
            <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.cardBorder }]}
              placeholder="e.g., Ramanathan V."
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Phone */}
            <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.cardBorder }]}
              placeholder="+91 98421 XXXXX"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {/* Assigned Estate / Farm */}
            <Text style={[styles.label, { color: colors.text }]}>Assigned Estate</Text>
            <View style={styles.pillRow}>
              <TouchableOpacity
                style={[
                  styles.pill,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                  farmId === 'namari' && [styles.pillActive, { borderColor: colors.primary, backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }],
                ]}
                onPress={() => setFarmId('namari')}
              >
                <Text style={[styles.pillText, { color: farmId === 'namari' ? colors.primary : colors.textMuted }]}>
                  Namari Farm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pill,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                  farmId === 'adukidathan' && [styles.pillActive, { borderColor: colors.primary, backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }],
                ]}
                onPress={() => setFarmId('adukidathan')}
              >
                <Text style={[styles.pillText, { color: farmId === 'adukidathan' ? colors.primary : colors.textMuted }]}>
                  Adukidathan Farm
                </Text>
              </TouchableOpacity>
            </View>

            {/* Worker Category / Gang */}
            <Text style={[styles.label, { color: colors.text }]}>Gang / Skill Category</Text>
            <View style={styles.categoryGrid}>
              {(['picker', 'sprayer', 'weeder', 'curing_crew', 'general'] as WorkerCategory[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catOption,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                    category === cat && [styles.catOptionActive, { borderColor: colors.primary, backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }],
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catOptionText, { color: category === cat ? colors.primary : colors.text }]}>
                    {WORKER_CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Crops Handled */}
            <Text style={[styles.label, { color: colors.text }]}>Crops Handled</Text>
            <View style={styles.pillRow}>
              <TouchableOpacity
                style={[
                  styles.pill,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                  crops.includes('cardamom') && [styles.pillActive, { borderColor: colors.accent, backgroundColor: isDark ? '#451A03' : '#FEF3C7' }],
                ]}
                onPress={() => toggleCrop('cardamom')}
              >
                <Text style={[styles.pillText, { color: crops.includes('cardamom') ? colors.accent : colors.textMuted }]}>
                  Cardamom
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pill,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                  crops.includes('pepper') && [styles.pillActive, { borderColor: colors.accent, backgroundColor: isDark ? '#451A03' : '#FEF3C7' }],
                ]}
                onPress={() => toggleCrop('pepper')}
              >
                <Text style={[styles.pillText, { color: crops.includes('pepper') ? colors.accent : colors.textMuted }]}>
                  Black Pepper
                </Text>
              </TouchableOpacity>
            </View>

            {/* Admin-Only Wage & Overtime Rates */}
            {isAdmin && (
              <View style={[styles.adminWageBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
                <View style={styles.adminWageRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.wageLabel, { color: colors.text }]}>Daily Base Wage (₹)</Text>
                    <TextInput
                      style={[styles.wageInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.cardBorder }]}
                      value={wageRate}
                      onChangeText={setWageRate}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.wageLabel, { color: colors.accent }]}>OT Rate / Hr (₹)</Text>
                    <TextInput
                      style={[styles.wageInput, { backgroundColor: colors.card, color: colors.accent, borderColor: colors.cardBorder }]}
                      value={otRate}
                      onChangeText={setOtRate}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Save Worker</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    padding: 18,
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  pillActive: {
    borderWidth: 1.5,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryGrid: {
    gap: 8,
  },
  catOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  catOptionActive: {
    borderWidth: 1.5,
  },
  catOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  adminWageBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  adminWageRow: {
    flexDirection: 'row',
  },
  wageLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  wageInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
