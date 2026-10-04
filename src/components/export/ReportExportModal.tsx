import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedConfirmModal } from '../common/ThemedConfirmModal';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useFarm } from '../../context/FarmContext';
import {
  ReportHead,
  ReportSummaryStats,
  generateReportData,
  exportReport,
} from '../../services/exportService';
import {
  FULL_MONTH_NAMES,
  MONTH_NAMES,
  PeriodType,
} from '../../utils/date';

interface ReportExportModalProps {
  visible: boolean;
  onClose: () => void;
  defaultHead?: ReportHead;
  defaultPeriod?: 'monthly' | 'quarterly' | 'yearly';
}

const REPORT_HEADS: { id: ReportHead; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'complete_audit', label: 'All Sections (Complete Audit Dossier)', icon: 'documents', color: '#047857' },
  { id: 'consolidated', label: 'Consolidated P&L (Income Tax & CA)', icon: 'stats-chart', color: '#10B981' },
  { id: 'expenses', label: 'Plantation Expense Ledger', icon: 'receipt', color: '#EF4444' },
  { id: 'income', label: 'Income Tracker & Receipts', icon: 'wallet', color: '#059669' },
  { id: 'harvest', label: 'Harvest & Picking Records', icon: 'basket', color: '#F59E0B' },
  { id: 'curing', label: 'Curing Kiln & Dryer Batches', icon: 'flame', color: '#3B82F6' },
  { id: 'attendance', label: 'Labor Muster Roll & Wages', icon: 'people', color: '#8B5CF6' },
  { id: 'visitors', label: 'Field Visitors Register', icon: 'id-card', color: '#14B8A6' },
  { id: 'activity', label: 'Field Operations & Tasks', icon: 'leaf', color: '#10B981' },
];

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  visible,
  onClose,
  defaultHead = 'consolidated',
  defaultPeriod = 'monthly',
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { role, orgId, switchRole } = useAuth();
  const { selectedFarm } = useFarm();
  const effectiveOrgId = orgId || 'plantation_org_namari_adukidathan';

  const [selectedHead, setSelectedHead] = useState<ReportHead>(defaultHead);
  const [periodMode, setPeriodMode] = useState<'monthly' | 'quarterly' | 'yearly'>(defaultPeriod);
  const [farmScope, setFarmScope] = useState<string>(selectedFarm || 'consolidated');

  // Year & Month selections
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState<number>(2); // Q2 Jul-Sep default

  // Admin Security Gate
  const isAdmin = role === 'admin';
  const [adminPin, setAdminPin] = useState('');
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Live Preview State
  const [summaryData, setSummaryData] = useState<ReportSummaryStats | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null);

  const canExport = isAdmin || pinUnlocked;

  // Build reference date from selection
  const computeReferenceDate = (): Date => {
    if (periodMode === 'monthly') {
      return new Date(selectedYear, selectedMonthIdx, 15);
    }
    if (periodMode === 'quarterly') {
      // 1=Q1(Apr), 2=Q2(Jul), 3=Q3(Oct), 4=Q4(Jan)
      const qMonth = selectedQuarter === 1 ? 4 : selectedQuarter === 2 ? 7 : selectedQuarter === 3 ? 10 : 1;
      return new Date(selectedYear, qMonth, 15);
    }
    // yearly
    return new Date(selectedYear, 6, 15);
  };

  useEffect(() => {
    if (visible) {
      loadPreview();
    }
  }, [visible, selectedHead, periodMode, farmScope, selectedYear, selectedMonthIdx, selectedQuarter]);

  const loadPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const data = await generateReportData({
        orgId: effectiveOrgId,
        farmId: farmScope,
        head: selectedHead,
        period: periodMode === 'yearly' ? 'annual' : periodMode,
        refDate: computeReferenceDate(),
      });
      setSummaryData(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleVerifyPin = () => {
    if (adminPin === '2026' || adminPin === '1234') {
      setPinUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const [exportSuccessModal, setExportSuccessModal] = useState<{ visible: boolean; message: string; format: 'excel' | 'pdf' }>({
    visible: false,
    message: '',
    format: 'excel',
  });
  const [exportErrorModal, setExportErrorModal] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!canExport) return;
    setIsExporting(format);
    try {
      await exportReport({
        orgId: effectiveOrgId,
        farmId: farmScope,
        head: selectedHead,
        period: periodMode === 'yearly' ? 'annual' : periodMode,
        refDate: computeReferenceDate(),
        format,
        estateName: 'Namari & Adukidathan Estates',
      });
      setExportSuccessModal({
        visible: true,
        format,
        message: `The ${format === 'excel' ? 'Excel (.xlsx)' : 'PDF'} report has been generated. Use the share/save sheet to save or send.`,
      });
    } catch (err: any) {
      console.log('Export error:', err);
      setExportErrorModal({
        visible: true,
        message: err?.message || 'Failed to generate report. Please try again.',
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.iconWrap, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Estate Reports & Export Center
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  Export Monthly, Quarterly & Yearly Records to Excel or PDF
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 1. REPORT HEAD SELECTION */}
            <Text style={[styles.sectionLabel, { color: colors.text }]}>1. Select Report Head</Text>
            <View style={styles.headsGrid}>
              {REPORT_HEADS.map((h) => {
                const isSel = selectedHead === h.id;
                return (
                  <TouchableOpacity
                    key={h.id}
                    onPress={() => setSelectedHead(h.id)}
                    style={[
                      styles.headCard,
                      {
                        backgroundColor: isSel ? `${h.color}15` : colors.surfaceSubtle,
                        borderColor: isSel ? h.color : colors.cardBorder,
                      },
                    ]}
                  >
                    <Ionicons name={h.icon} size={15} color={isSel ? h.color : colors.textMuted} />
                    <Text
                      style={[
                        styles.headCardText,
                        { color: isSel ? (isDark ? '#FFFFFF' : h.color) : colors.text, fontWeight: isSel ? '800' : '600' },
                      ]}
                      numberOfLines={1}
                    >
                      {h.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. PERIOD MODE SELECTOR */}
            <Text style={[styles.sectionLabel, { color: colors.text }]}>2. Reporting Period</Text>
            <View style={[styles.periodModeRow, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              {(['monthly', 'quarterly', 'yearly'] as const).map((mode) => {
                const isSel = periodMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setPeriodMode(mode)}
                    style={[
                      styles.periodModeBtn,
                      isSel && [styles.periodModeBtnActive, { backgroundColor: colors.card }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.periodModeText,
                        {
                          color: isSel ? colors.primary : colors.textMuted,
                          fontWeight: isSel ? '800' : '600',
                        },
                      ]}
                    >
                      {mode === 'monthly' ? 'Monthly' : mode === 'quarterly' ? 'Quarterly' : 'Yearly'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* MONTH / QUARTER / YEAR SELECTION */}
            {periodMode === 'monthly' && (
              <View style={styles.subPeriodBox}>
                <Text style={[styles.subPeriodLabel, { color: colors.textMuted }]}>Select Month:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {MONTH_NAMES.map((m, idx) => (
                      <TouchableOpacity
                        key={m}
                        onPress={() => setSelectedMonthIdx(idx)}
                        style={[
                          styles.subPill,
                          {
                            backgroundColor: selectedMonthIdx === idx ? colors.primary : colors.surfaceSubtle,
                            borderColor: selectedMonthIdx === idx ? colors.primary : colors.cardBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.subPillText,
                            { color: selectedMonthIdx === idx ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {periodMode === 'quarterly' && (
              <View style={styles.subPeriodBox}>
                <Text style={[styles.subPeriodLabel, { color: colors.textMuted }]}>Select Quarter (Indian FY):</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {[
                    { q: 1, label: 'Q1 (Apr - Jun)' },
                    { q: 2, label: 'Q2 (Jul - Sep)' },
                    { q: 3, label: 'Q3 (Oct - Dec)' },
                    { q: 4, label: 'Q4 (Jan - Mar)' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.q}
                      onPress={() => setSelectedQuarter(item.q)}
                      style={[
                        styles.subPill,
                        {
                          backgroundColor: selectedQuarter === item.q ? colors.primary : colors.surfaceSubtle,
                          borderColor: selectedQuarter === item.q ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.subPillText,
                          { color: selectedQuarter === item.q ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 3. FARM SCOPE SELECTION */}
            <Text style={[styles.sectionLabel, { color: colors.text }]}>3. Plantation Scope</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
              {[
                { id: 'consolidated', label: 'All Divisions (Consolidated)' },
                { id: 'namari', label: 'Namari Estate' },
                { id: 'adukidathan', label: 'Adukidathan Farm' },
              ].map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setFarmScope(f.id)}
                  style={[
                    styles.scopeChip,
                    {
                      backgroundColor: farmScope === f.id ? `${colors.primary}15` : colors.surfaceSubtle,
                      borderColor: farmScope === f.id ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scopeChipText,
                      { color: farmScope === f.id ? colors.primary : colors.text, fontWeight: farmScope === f.id ? '700' : '500' },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 4. LIVE REPORT SUMMARY PREVIEW */}
            <View
              style={[
                styles.previewBox,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.previewHeading, { color: colors.text }]}>
                  {summaryData?.title || 'Report Preview'}
                </Text>
                <View style={[styles.recordCountBadge, { backgroundColor: colors.surfaceSubtle }]}>
                  <Text style={[styles.recordCountText, { color: colors.primary }]}>
                    {summaryData?.recordCount || 0} Records
                  </Text>
                </View>
              </View>
              <Text style={[styles.previewSubheading, { color: colors.textMuted }]}>
                {summaryData?.periodLabel} • {summaryData?.subtitle}
              </Text>

              {isLoadingPreview ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 14 }} />
              ) : summaryData?.kpis ? (
                <View style={styles.kpiRow}>
                  {summaryData.kpis.map((kpi, i) => (
                    <View
                      key={i}
                      style={[
                        styles.kpiMiniCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.kpiMiniLabel, { color: colors.textMuted }]}>{kpi.label}</Text>
                      <Text style={[styles.kpiMiniValue, { color: kpi.color || colors.text }]}>
                        {kpi.value}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {/* 5. ADMIN AUTHORIZATION GATE */}
            {!canExport && (
              <View
                style={[
                  styles.adminGateBox,
                  { backgroundColor: '#EF444410', borderColor: '#EF444430' },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name="lock-closed" size={16} color={colors.danger} />
                  <Text style={[styles.adminGateTitle, { color: colors.danger }]}>
                    Admin Authorization Required
                  </Text>
                </View>
                <Text style={[styles.adminGateDesc, { color: colors.textMuted }]}>
                  As requested, financial and operational reports can only be exported by the estate administrator. Enter Admin PIN or unlock.
                </Text>

                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <TextInput
                    style={[
                      styles.pinInput,
                      { backgroundColor: colors.card, borderColor: pinError ? colors.danger : colors.border, color: colors.text },
                    ]}
                    placeholder="Enter PIN (Default: 2026)"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    keyboardType="numeric"
                    value={adminPin}
                    onChangeText={(val) => {
                      setAdminPin(val);
                      setPinError(false);
                    }}
                  />
                  <TouchableOpacity
                    onPress={handleVerifyPin}
                    style={[styles.pinVerifyBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>Unlock</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      await switchRole('admin');
                      setPinUnlocked(true);
                    }}
                    style={[styles.pinVerifyBtn, { backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.cardBorder }]}
                  >
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 11 }}>Demo Admin</Text>
                  </TouchableOpacity>
                </View>
                {pinError && (
                  <Text style={{ color: colors.danger, fontSize: 11, marginTop: 4 }}>
                    Invalid Admin PIN. Use '2026' or '1234'.
                  </Text>
                )}
              </View>
            )}

            {/* 6. EXPORT BUTTONS */}
            <View style={styles.exportActionsRow}>
              <TouchableOpacity
                disabled={!canExport || isExporting !== null}
                onPress={() => handleExport('excel')}
                style={[
                  styles.exportBtn,
                  {
                    backgroundColor: canExport ? '#059669' : colors.textMuted,
                    opacity: isExporting !== null ? 0.7 : 1,
                  },
                ]}
              >
                {isExporting === 'excel' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="grid" size={17} color="#FFFFFF" />
                    <View>
                      <Text style={styles.exportBtnTitle}>Export Excel (.xlsx)</Text>
                      <Text style={styles.exportBtnSub}>Open in Excel, Sheets</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!canExport || isExporting !== null}
                onPress={() => handleExport('pdf')}
                style={[
                  styles.exportBtn,
                  {
                    backgroundColor: canExport ? '#DC2626' : colors.textMuted,
                    opacity: isExporting !== null ? 0.7 : 1,
                  },
                ]}
              >
                {isExporting === 'pdf' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="document-text" size={17} color="#FFFFFF" />
                    <View>
                      <Text style={styles.exportBtnTitle}>Export PDF (Print)</Text>
                      <Text style={styles.exportBtnSub}>Executive Format</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* In-App Themed Export Feedback Dialogs */}
          <ThemedConfirmModal
            visible={exportSuccessModal.visible}
            type="success"
            title="Report Export Ready"
            message={exportSuccessModal.message}
            confirmText="Done"
            isSingleButton={true}
            onConfirm={() => setExportSuccessModal({ visible: false, message: '', format: 'excel' })}
          />

          <ThemedConfirmModal
            visible={exportErrorModal.visible}
            type="warning"
            title="Export Notice"
            message={exportErrorModal.message}
            confirmText="OK"
            isSingleButton={true}
            onConfirm={() => setExportErrorModal({ visible: false, message: '' })}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  headCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    width: '48.5%',
  },
  headCardText: {
    fontSize: 11,
    flex: 1,
  },
  periodModeRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    marginBottom: 10,
  },
  periodModeBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodModeBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodModeText: {
    fontSize: 12,
  },
  subPeriodBox: {
    marginBottom: 14,
  },
  subPeriodLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  subPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  subPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scopeChip: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  scopeChipText: {
    fontSize: 11,
    textAlign: 'center',
  },
  previewBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  previewHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  previewSubheading: {
    fontSize: 11,
    marginBottom: 10,
  },
  recordCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  recordCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  kpiMiniCard: {
    flex: 1,
    minWidth: '46%',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  kpiMiniLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  kpiMiniValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  adminGateBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  adminGateTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  adminGateDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  pinInput: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
  },
  pinVerifyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  exportBtnTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  exportBtnSub: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '500',
  },
});
