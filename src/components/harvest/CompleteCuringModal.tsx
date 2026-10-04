import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { CuringBatch, CardamomGrading } from '../../types/harvest';
import { formatDate } from '../../utils/date';

interface CompleteCuringModalProps {
  visible: boolean;
  onClose: () => void;
  batch: CuringBatch | null;
  onCompleteBatch: (
    batchId: string,
    dryWeightKg: number,
    unloadDate: string,
    grades?: CardamomGrading,
    dryStorageSacksCount?: number,
    dryStoragePlasticBagsCount?: number,
    ripenedFruitDryKg?: number,
    ripenedFruitRecoveryPct?: number,
    overallRecoveryPct?: number
  ) => void;
}

export const CompleteCuringModal: React.FC<CompleteCuringModalProps> = ({
  visible,
  onClose,
  batch,
  onCompleteBatch,
}) => {
  const { colors, isDark } = useTheme();

  const [dryWeight, setDryWeight] = useState('');
  const [ripenedFruitDry, setRipenedFruitDry] = useState('');
  const [unloadDate, setUnloadDate] = useState('');
  const [drySacks, setDrySacks] = useState('4');
  const [dryPlasticBags, setDryPlasticBags] = useState('4');
  const [grade8mm, setGrade8mm] = useState('');
  const [grade7to8mm, setGrade7to8mm] = useState('');
  const [gradeSplits, setGradeSplits] = useState('');
  const [gradeWaste, setGradeWaste] = useState('');
  const [showGradingSection, setShowGradingSection] = useState(false);
  const [showRipeInput, setShowRipeInput] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && batch) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setUnloadDate(`${formatDate()} ${timeStr}`);
      setDryWeight(batch.dryWeightKg ? String(batch.dryWeightKg) : '');
      setRipenedFruitDry(batch.ripenedFruitDryKg ? String(batch.ripenedFruitDryKg) : '');
      setDrySacks(String(batch.dryStorageSacksCount || 4));
      setDryPlasticBags(String(batch.dryStoragePlasticBagsCount || 4));
      setGrade8mm(batch.grades?.grade8mmPlusKg ? String(batch.grades.grade8mmPlusKg) : '');
      setGrade7to8mm(batch.grades?.grade7to8mmKg ? String(batch.grades.grade7to8mmKg) : '');
      setGradeSplits(batch.grades?.gradeSplitsKg ? String(batch.grades.gradeSplitsKg) : '');
      setGradeWaste(batch.grades?.gradeHuskSeedsKg ? String(batch.grades.gradeHuskSeedsKg) : '');
      const hasGrades = !!(
        batch.grades?.grade8mmPlusKg ||
        batch.grades?.grade7to8mmKg ||
        batch.grades?.gradeSplitsKg ||
        batch.grades?.gradeHuskSeedsKg
      );
      setShowGradingSection(hasGrades);
      setError('');
    }
  }, [visible, batch]);

  if (!batch) return null;

  const parsedDry = parseFloat(dryWeight) || 0;
  const calculatedRecovery =
    batch.greenWeightKg > 0 && parsedDry > 0
      ? Number(((parsedDry / batch.greenWeightKg) * 100).toFixed(2))
      : 0;
  const variance = Number((calculatedRecovery - batch.benchmarkOutturnPercentage).toFixed(2));
  const isGain = variance >= 0;

  // Ripened Fruit Calculations
  const parsedRipeDry = parseFloat(ripenedFruitDry) || 0;
  const ripeLoaded = batch.ripenedFruitLoadedKg || 0;
  const ripeRecovery =
    ripeLoaded > 0 && parsedRipeDry > 0
      ? Number(((parsedRipeDry / ripeLoaded) * 100).toFixed(2))
      : 0;

  const totalLoaded = batch.greenWeightKg + ripeLoaded;
  const totalDry = parsedDry + parsedRipeDry;
  const overallRecovery =
    totalLoaded > 0 && totalDry > 0
      ? Number(((totalDry / totalLoaded) * 100).toFixed(2))
      : calculatedRecovery;

  // Grade totals
  const g8 = parseFloat(grade8mm) || 0;
  const g7 = parseFloat(grade7to8mm) || 0;
  const gSp = parseFloat(gradeSplits) || 0;
  const gW = parseFloat(gradeWaste) || 0;
  const totalGrades = Number((g8 + g7 + gSp + gW).toFixed(1));

  const handleSave = () => {
    if (!parsedDry || parsedDry <= 0) {
      setError('Please enter valid dry cured cardamom weight in kg');
      return;
    }

    let grading: CardamomGrading | undefined = undefined;
    if (totalGrades > 0) {
      grading = {
        grade8mmPlusKg: g8,
        grade7to8mmKg: g7,
        gradeSplitsKg: gSp,
        gradeHuskSeedsKg: gW,
        gradedDate: formatDate(),
      };
    }

    onCompleteBatch(
      batch.id,
      parsedDry,
      unloadDate,
      grading,
      parseInt(drySacks, 10) || undefined,
      parseInt(dryPlasticBags, 10) || undefined,
      parsedRipeDry > 0 ? parsedRipeDry : undefined,
      ripeRecovery > 0 ? ripeRecovery : undefined,
      overallRecovery > 0 ? overallRecovery : undefined
    );
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="checkmark-done-circle" size={22} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Unload Chamber & Recover Dry Yield
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subText, { color: colors.textMuted }]}>
            {batch.dryerName} ({batch.dryerType === 'own' ? 'Own Chamber' : 'Rented Dryer'}) • Batch {batch.id}
          </Text>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: '#EF444420' }]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Green Reference & Dry Input */}
            <View style={[styles.weightCompareBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.weightCol}>
                <Text style={[styles.boxLabel, { color: colors.textMuted }]}>Fresh Green Loaded</Text>
                <Text style={[styles.boxVal, { color: colors.text }]}>
                  {batch.greenWeightKg.toLocaleString()} kg
                </Text>
                <Text style={[styles.boxDate, { color: colors.textMuted }]}>{batch.loadDate}</Text>
              </View>

              <View style={styles.arrowCol}>
                <Ionicons name="arrow-forward" size={18} color={colors.primary} />
              </View>

              <View style={styles.weightCol}>
                <Text style={[styles.boxLabel, { color: colors.primary }]}>Dry Cured (kg) *</Text>
                <TextInput
                  style={[
                    styles.dryInput,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="e.g. 210.0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={dryWeight}
                  onChangeText={setDryWeight}
                  autoFocus
                />
              </View>
            </View>

            {/* RIPENED FRUIT SEPARATOR DRY INPUT */}
            {batch.ripenedFruitLoadedKg && batch.ripenedFruitLoadedKg > 0 ? (
              <View style={[styles.weightCompareBox, { backgroundColor: colors.background, borderColor: '#D97706', marginTop: 10 }]}>
                <View style={styles.weightCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="layers" size={13} color="#D97706" />
                    <Text style={[styles.boxLabel, { color: '#D97706', fontWeight: '700' }]}>Ripe Separator</Text>
                  </View>
                  <Text style={[styles.boxVal, { color: colors.text }]}>
                    {batch.ripenedFruitLoadedKg.toLocaleString()} kg
                  </Text>
                  <Text style={[styles.boxDate, { color: colors.textMuted }]}>Separator Tray</Text>
                </View>

                <View style={styles.arrowCol}>
                  <Ionicons name="arrow-forward" size={18} color="#D97706" />
                </View>

                <View style={styles.weightCol}>
                  <Text style={[styles.boxLabel, { color: '#D97706' }]}>Ripe Dried (kg)</Text>
                  <TextInput
                    style={[
                      styles.dryInput,
                      { backgroundColor: colors.card, color: colors.text, borderColor: '#D97706' },
                    ]}
                    placeholder="e.g. 9.5"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    value={ripenedFruitDry}
                    onChangeText={setRipenedFruitDry}
                  />
                  {ripeRecovery > 0 && (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706', marginTop: 3 }}>
                      {ripeRecovery}% outturn
                    </Text>
                  )}
                </View>
              </View>
            ) : null}

            {!batch.ripenedFruitLoadedKg && (
              <View style={{ marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => setShowRipeInput(!showRipeInput)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}
                >
                  <Ionicons name="layers-outline" size={14} color="#D97706" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#D97706' }}>
                    {showRipeInput ? 'Hide Separator Tray Yield' : '+ Add Separator Tray (Ripe Fruit) Dry Yield'}
                  </Text>
                  <Ionicons
                    name={showRipeInput ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#D97706"
                  />
                </TouchableOpacity>
                {showRipeInput && (
                  <View
                    style={{
                      marginTop: 6,
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#D9770640',
                      backgroundColor: colors.background,
                    }}
                  >
                    <Text style={[styles.boxLabel, { color: '#D97706', marginBottom: 4 }]}>
                      Ripened Fruit Dry Yield (kg)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.card, color: colors.text, borderColor: '#D97706' },
                      ]}
                      placeholder="e.g. 8.0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      value={ripenedFruitDry}
                      onChangeText={setRipenedFruitDry}
                    />
                  </View>
                )}
              </View>
            )}

            {/* LIVE OUTTURN BENCHMARK PREVIEW */}
            {calculatedRecovery > 0 && (
              <View
                style={[
                  styles.outturnPreview,
                  {
                    backgroundColor: isGain
                      ? isDark
                        ? '#14532D'
                        : '#DCFCE7'
                      : isDark
                      ? '#78350F'
                      : '#FEF3C7',
                  },
                ]}
              >
                <View style={styles.outturnLeft}>
                  <Text style={[styles.previewLabel, { color: isGain ? '#16A34A' : '#D97706' }]}>
                    Green Cardamom Outturn:
                  </Text>
                  <Text style={[styles.previewOutturnVal, { color: isGain ? '#16A34A' : '#D97706' }]}>
                    {calculatedRecovery}%
                  </Text>
                  {ripeLoaded > 0 && parsedRipeDry > 0 && (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 2 }}>
                      Combined Batch Outturn: {overallRecovery}%
                    </Text>
                  )}
                </View>

                <View style={styles.outturnRight}>
                  <Text style={[styles.previewVarianceText, { color: isGain ? '#16A34A' : '#D97706' }]}>
                    {isGain ? `+${variance}% GAIN` : `${variance}% VARIANCE`}
                  </Text>
                  <Text style={[styles.previewBenchmarkSub, { color: colors.textMuted }]}>
                    vs {batch.benchmarkOutturnPercentage}% benchmark
                  </Text>
                </View>
              </View>
            )}

            {/* Unload Date/Time */}
            <Text style={[styles.label, { color: colors.text }]}>Unload Date & Time</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              value={unloadDate}
              onChangeText={setUnloadDate}
            />

            {/* Quality Grading Section (Optional - Collapsed by default) */}
            <View style={{ marginTop: 14, marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => setShowGradingSection(!showGradingSection)}
                style={[
                  styles.gradingToggleBtn,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="ribbon-outline" size={16} color={colors.primary} />
                  <Text style={[styles.gradingToggleText, { color: colors.text }]}>
                    {showGradingSection
                      ? 'Hide Quality Grade Breakdown'
                      : '+ Add Sieve Quality Breakdown (Optional)'}
                  </Text>
                </View>
                <Ionicons
                  name={showGradingSection ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              <Text style={[styles.gradingHelperText, { color: colors.textMuted }]}>
                Sorting machine not required. Farms can skip grade breakdown if only fresh & ripe dry yields are recorded.
              </Text>
            </View>

            {showGradingSection && (
              <>
                <View style={styles.gradingGrid}>
                  <View style={styles.gradeField}>
                    <Text style={[styles.gradeFieldLabel, { color: '#16A34A' }]}>8mm+ Extra Bold (kg)</Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                      ]}
                      placeholder="0.0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      value={grade8mm}
                      onChangeText={setGrade8mm}
                    />
                  </View>

                  <View style={styles.gradeField}>
                    <Text style={[styles.gradeFieldLabel, { color: colors.text }]}>7-8mm Bold (kg)</Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                      ]}
                      placeholder="0.0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      value={grade7to8mm}
                      onChangeText={setGrade7to8mm}
                    />
                  </View>

                  <View style={styles.gradeField}>
                    <Text style={[styles.gradeFieldLabel, { color: '#D97706' }]}>Splits / Pale (kg)</Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                      ]}
                      placeholder="0.0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      value={gradeSplits}
                      onChangeText={setGradeSplits}
                    />
                  </View>

                  <View style={styles.gradeField}>
                    <Text style={[styles.gradeFieldLabel, { color: colors.textMuted }]}>Waste / Seeds (kg)</Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                      ]}
                      placeholder="0.0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      value={gradeWaste}
                      onChangeText={setGradeWaste}
                    />
                  </View>
                </View>

                {totalGrades > 0 && (
                  <Text style={[styles.gradeTotalHint, { color: colors.textMuted }]}>
                    Graded Sum: {totalGrades} kg {parsedDry > 0 ? `(Target: ${parsedDry} kg)` : ''}
                  </Text>
                )}
              </>
            )}

            {/* Storage & Packaging Bags */}
            <Text style={[styles.label, { color: colors.text }]}>Dry Storage Packaging</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>
                  Gunny / Jute Sacks
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                  ]}
                  keyboardType="numeric"
                  placeholder="4"
                  placeholderTextColor={colors.textMuted}
                  value={drySacks}
                  onChangeText={setDrySacks}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>
                  Plastic Inner Bags
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                  ]}
                  keyboardType="numeric"
                  placeholder="4"
                  placeholderTextColor={colors.textMuted}
                  value={dryPlasticBags}
                  onChangeText={setDryPlasticBags}
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.btnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.saveBtnText}>Save Recovery Record</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '92%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  subText: {
    fontSize: 12,
    marginBottom: 10,
  },
  body: {
    maxHeight: 520,
  },
  errorBox: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  weightCompareBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  weightCol: {
    flex: 2,
  },
  arrowCol: {
    paddingHorizontal: 8,
  },
  boxLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  boxVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  boxDate: {
    fontSize: 10,
    marginTop: 2,
  },
  dryInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 18,
    fontWeight: '800',
  },
  outturnPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  outturnLeft: {
    gap: 2,
  },
  outturnRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewOutturnVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  previewVarianceText: {
    fontSize: 13,
    fontWeight: '800',
  },
  previewBenchmarkSub: {
    fontSize: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  gradingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: 8,
  },
  gradingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gradeField: {
    flex: 1,
    minWidth: '45%',
  },
  gradeFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  gradeTotalHint: {
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
  gradingToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  gradingToggleText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  gradingHelperText: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    marginBottom: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
