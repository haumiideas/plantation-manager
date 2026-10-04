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
import { useLanguage } from '../../context/LanguageContext';
import { useFarm } from '../../context/FarmContext';
import { IncomeCategory, IncomeEntry } from '../../types/income';
import { PaymentMode } from '../../types/expense';
import { formatDate } from '../../utils/date';
import { ThemedDatePickerModal } from '../common/ThemedDatePickerModal';
import { ContactPickerModal } from '../common/ContactPickerModal';
import { generateNextReceiptNumber } from '../../services/incomeService';

interface LogIncomeModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: Omit<IncomeEntry, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  orgId: string;
  editingEntry?: IncomeEntry | null;
}

const CATEGORIES: { id: IncomeCategory; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'produce_sale', label: 'Produce Sale', icon: 'cart', color: '#10B981' },
  { id: 'farm_tour', label: 'Farm Tour / Agro-Tourism', icon: 'camera', color: '#14B8A6' },
  { id: 'educational_visit', label: 'Educational Visit', icon: 'school', color: '#8B5CF6' },
  { id: 'scrap_sale', label: 'Scrap & Empty Drum Sale', icon: 'trash', color: '#F59E0B' },
  { id: 'curing_rental', label: 'Curing Service Fee', icon: 'business', color: '#3B82F6' },
  { id: 'consulting_honorarium', label: 'Advisory Honorarium', icon: 'ribbon', color: '#6366F1' },
  { id: 'other_income', label: 'Other Receipt', icon: 'cash', color: '#64748B' },
];

const CROP_OPTIONS = [
  { id: 'Cardamom', label: 'Cardamom' },
  { id: 'Black Pepper', label: 'Black Pepper' },
  { id: 'Coffee', label: 'Coffee' },
  { id: 'Other', label: 'Other Produce' },
];

const GRADE_OPTIONS: Record<string, string[]> = {
  Cardamom: [
    '8mm+ Bold Green',
    '7-8mm Extra Bold',
    'Bulk / Bleached Commercial',
    'Pan / Separator Ripe',
  ],
  'Black Pepper': [
    'Bold Garbled TGSEB',
    'Garbled Malabar Black Pepper',
    'Ungarbled Farm Pepper',
    'Pinheads / Light Berries',
  ],
  Coffee: [
    'Plantation A (Arabica Washed)',
    'Plantation PB (Peaberry)',
    'Robusta Cherry AB',
    'Robusta Parchment',
  ],
  Other: ['Grade 1 Farm Direct', 'Commercial Lot', 'Ungraded Mixed'],
};

const PAYMENT_MODES: { id: PaymentMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'upi', label: 'UPI / GPay', icon: 'phone-portrait-outline' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: 'business-outline' },
  { id: 'cash', label: 'Cash', icon: 'cash-outline' },
  { id: 'credit', label: 'Credit / Ledger', icon: 'time-outline' },
];

export const LogIncomeModal: React.FC<LogIncomeModalProps> = ({
  visible,
  onClose,
  onSave,
  orgId,
  editingEntry,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { options, selectedFarm } = useFarm();

  const [farmId, setFarmId] = useState<string>(selectedFarm || 'namari');
  const [date, setDate] = useState(formatDate());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const [category, setCategory] = useState<IncomeCategory>('produce_sale');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  // Produce Sale specific
  const [produceWeightKg, setProduceWeightKg] = useState('');
  const [produceRatePerKg, setProduceRatePerKg] = useState('');
  const [produceCrop, setProduceCrop] = useState('Cardamom');
  const [produceGrade, setProduceGrade] = useState('8mm+ Bold Green');
  const [customGradeText, setCustomGradeText] = useState('');
  const [showCustomGrade, setShowCustomGrade] = useState(false);

  // Farm Tour specific
  const [tourVisitorsCount, setTourVisitorsCount] = useState('');
  const [tourRatePerPerson, setTourRatePerPerson] = useState('');
  const [tourPackageName, setTourPackageName] = useState('Cardamom Estate Guided Walk');

  // Educational Visit specific
  const [institutionName, setInstitutionName] = useState('');
  const [studentCount, setStudentCount] = useState('');
  const [studentFee, setStudentFee] = useState('');

  // Curing Rental specific
  const [curingWeightKg, setCuringWeightKg] = useState('');
  const [curingRatePerKg, setCuringRatePerKg] = useState('');
  const [curingBatchNo, setCuringBatchNo] = useState('');

  // Scrap Sale specific
  const [scrapItemType, setScrapItemType] = useState('Empty Chemical Drums (200L)');
  const [scrapQuantity, setScrapQuantity] = useState('');
  const [scrapUnit, setScrapUnit] = useState('nos');
  const [scrapRate, setScrapRate] = useState('');

  // Consulting / Advisory specific
  const [advisoryTopic, setAdvisoryTopic] = useState('');
  const [advisoryHours, setAdvisoryHours] = useState('');
  const [advisoryFee, setAdvisoryFee] = useState('');

  // Payer / Buyer Profile
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [payerAddress, setPayerAddress] = useState('');
  const [payerGstin, setPayerGstin] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [showContactPicker, setShowContactPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingEntry) {
        setFarmId(editingEntry.farmId || selectedFarm || 'namari');
        setDate(editingEntry.date || formatDate());
        setCategory(editingEntry.category || 'produce_sale');
        setTitle(editingEntry.title || '');
        setAmount(editingEntry.amount ? String(editingEntry.amount) : '');
        setProduceWeightKg(editingEntry.produceWeightKg ? String(editingEntry.produceWeightKg) : '');
        setProduceRatePerKg(editingEntry.produceRatePerKg ? String(editingEntry.produceRatePerKg) : '');
        const crop = editingEntry.produceCrop || 'Cardamom';
        setProduceCrop(crop);
        const grade = editingEntry.produceGrade || '8mm+ Bold Green';
        const defaultGrades = GRADE_OPTIONS[crop] || [];
        if (defaultGrades.includes(grade)) {
          setProduceGrade(grade);
          setShowCustomGrade(false);
          setCustomGradeText('');
        } else {
          setShowCustomGrade(true);
          setCustomGradeText(grade);
        }

        // Category fields
        setTourVisitorsCount(editingEntry.tourVisitorsCount ? String(editingEntry.tourVisitorsCount) : '');
        setTourRatePerPerson(editingEntry.tourRatePerPerson ? String(editingEntry.tourRatePerPerson) : '');
        setTourPackageName(editingEntry.tourPackageName || 'Cardamom Estate Guided Walk');

        setInstitutionName(editingEntry.institutionName || '');
        setStudentCount(editingEntry.studentCount ? String(editingEntry.studentCount) : '');
        setStudentFee(editingEntry.studentFee ? String(editingEntry.studentFee) : '');

        setCuringWeightKg(editingEntry.curingWeightKg ? String(editingEntry.curingWeightKg) : '');
        setCuringRatePerKg(editingEntry.curingRatePerKg ? String(editingEntry.curingRatePerKg) : '');
        setCuringBatchNo(editingEntry.curingBatchNo || '');

        setScrapItemType(editingEntry.scrapItemType || 'Empty Chemical Drums (200L)');
        setScrapQuantity(editingEntry.scrapQuantity ? String(editingEntry.scrapQuantity) : '');
        setScrapUnit(editingEntry.scrapUnit || 'nos');
        setScrapRate(editingEntry.scrapRate ? String(editingEntry.scrapRate) : '');

        setAdvisoryTopic(editingEntry.advisoryTopic || '');
        setAdvisoryHours(editingEntry.advisoryHours ? String(editingEntry.advisoryHours) : '');
        setAdvisoryFee(editingEntry.advisoryFee ? String(editingEntry.advisoryFee) : '');

        setPayerName(editingEntry.payerName || '');
        setPayerPhone(editingEntry.payerPhone || '');
        setPayerAddress(editingEntry.payerAddress || '');
        setPayerGstin(editingEntry.payerGstin || '');
        setPaymentMode(editingEntry.paymentMode || 'upi');
        setReceiptNumber(editingEntry.receiptNumber || '');
        setNotes(editingEntry.notes || '');
      } else {
        const initialFarm = selectedFarm && selectedFarm !== 'consolidated' ? selectedFarm : 'namari';
        setFarmId(initialFarm);
        setDate(formatDate());
        setCategory('produce_sale');
        setTitle('');
        setAmount('');
        setProduceWeightKg('');
        setProduceRatePerKg('');
        setProduceCrop('Cardamom');
        setProduceGrade('8mm+ Bold Green');
        setShowCustomGrade(false);
        setCustomGradeText('');

        setTourVisitorsCount('');
        setTourRatePerPerson('');
        setTourPackageName('Cardamom Estate Guided Walk');

        setInstitutionName('');
        setStudentCount('');
        setStudentFee('');

        setCuringWeightKg('');
        setCuringRatePerKg('');
        setCuringBatchNo('');

        setScrapItemType('Empty Chemical Drums (200L)');
        setScrapQuantity('');
        setScrapUnit('nos');
        setScrapRate('');

        setAdvisoryTopic('');
        setAdvisoryHours('');
        setAdvisoryFee('');

        setPayerName('');
        setPayerPhone('');
        setPayerAddress('');
        setPayerGstin('');
        setPaymentMode('upi');
        setNotes('');
        generateNextReceiptNumber(orgId, initialFarm)
          .then((rn) => setReceiptNumber(rn))
          .catch(() => setReceiptNumber(''));
      }
    }
  }, [visible, editingEntry]);

  const handleFarmSelect = (fId: string) => {
    setFarmId(fId);
    if (!editingEntry) {
      generateNextReceiptNumber(orgId, fId)
        .then((rn) => setReceiptNumber(rn))
        .catch(() => {});
    }
  };

  const handleWeightOrRateChange = (w: string, r: string) => {
    setProduceWeightKg(w);
    setProduceRatePerKg(r);
    const weightNum = parseFloat(w);
    const rateNum = parseFloat(r);
    if (!isNaN(weightNum) && !isNaN(rateNum) && weightNum > 0 && rateNum > 0) {
      setAmount(String(Math.round(weightNum * rateNum)));
    }
  };

  const handleTourChange = (vis: string, rate: string) => {
    setTourVisitorsCount(vis);
    setTourRatePerPerson(rate);
    const v = parseFloat(vis);
    const r = parseFloat(rate);
    if (!isNaN(v) && !isNaN(r) && v > 0 && r > 0) {
      setAmount(String(Math.round(v * r)));
    }
  };

  const handleEduChange = (cnt: string, fee: string) => {
    setStudentCount(cnt);
    setStudentFee(fee);
    const c = parseFloat(cnt);
    const f = parseFloat(fee);
    if (!isNaN(c) && !isNaN(f) && c > 0 && f > 0) {
      setAmount(String(Math.round(c * f)));
    }
  };

  const handleCuringChange = (w: string, r: string) => {
    setCuringWeightKg(w);
    setCuringRatePerKg(r);
    const weight = parseFloat(w);
    const rate = parseFloat(r);
    if (!isNaN(weight) && !isNaN(rate) && weight > 0 && rate > 0) {
      setAmount(String(Math.round(weight * rate)));
    }
  };

  const handleScrapChange = (q: string, r: string) => {
    setScrapQuantity(q);
    setScrapRate(r);
    const qty = parseFloat(q);
    const rate = parseFloat(r);
    if (!isNaN(qty) && !isNaN(rate) && qty > 0 && rate > 0) {
      setAmount(String(Math.round(qty * rate)));
    }
  };

  const handleAdvisoryChange = (h: string, f: string) => {
    setAdvisoryHours(h);
    setAdvisoryFee(f);
    const hrs = parseFloat(h);
    const fee = parseFloat(f);
    if (!isNaN(hrs) && !isNaN(fee) && hrs > 0 && fee > 0) {
      setAmount(String(Math.round(hrs * fee)));
    }
  };

  const handleSelectContact = (contact: {
    name: string;
    phone: string;
    address?: string;
    companyOrOrg?: string;
  }) => {
    setPayerName(contact.name);
    setPayerPhone(contact.phone);
    if (contact.address) {
      setPayerAddress(contact.address);
    }
    if (!title && contact.companyOrOrg) {
      setTitle(`${contact.companyOrOrg} Produce Purchase`);
    }
  };

  const handleSave = async () => {
    const numAmount = amount.trim() === '' ? 0 : parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) return;
    if (!payerName.trim()) return;

    const finalGrade = showCustomGrade && customGradeText.trim() ? customGradeText.trim() : produceGrade;

    let computedTitle = title.trim();
    if (!computedTitle) {
      if (category === 'produce_sale') {
        computedTitle = finalGrade ? `${produceCrop} (${finalGrade})` : `${produceCrop} Sale`;
      } else if (category === 'farm_tour') {
        computedTitle = `${tourPackageName.trim() || 'Farm Tour'} (${tourVisitorsCount || 1} visitors)`;
      } else if (category === 'educational_visit') {
        computedTitle = `${institutionName.trim() || 'Educational Visit'} (${studentCount || 1} students)`;
      } else if (category === 'curing_rental') {
        computedTitle = `Curing Facility Rental (Batch ${curingBatchNo || '01'})`;
      } else if (category === 'scrap_sale') {
        computedTitle = `${scrapItemType} (${scrapQuantity || 0} ${scrapUnit})`;
      } else if (category === 'consulting_honorarium') {
        computedTitle = `Advisory: ${advisoryTopic || 'Plantation Consultation'}`;
      } else {
        const catLabel = CATEGORIES.find((c) => c.id === category)?.label || category;
        computedTitle = `${catLabel} from ${payerName.trim()}`;
      }
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: editingEntry?.id,
        orgId,
        farmId,
        date,
        category,
        title: computedTitle,
        amount: numAmount,
        payerName: payerName.trim(),
        payerPhone: payerPhone.trim() || undefined,
        payerAddress: payerAddress.trim() || undefined,
        payerGstin: payerGstin.trim() || undefined,
        paymentMode,
        receiptNumber: receiptNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        produceWeightKg: parseFloat(produceWeightKg) || undefined,
        produceRatePerKg: parseFloat(produceRatePerKg) || undefined,
        produceCrop: produceCrop.trim() || undefined,
        produceGrade: finalGrade.trim() || undefined,
        tourVisitorsCount: parseFloat(tourVisitorsCount) || undefined,
        tourRatePerPerson: parseFloat(tourRatePerPerson) || undefined,
        tourPackageName: tourPackageName.trim() || undefined,
        institutionName: institutionName.trim() || undefined,
        studentCount: parseFloat(studentCount) || undefined,
        studentFee: parseFloat(studentFee) || undefined,
        curingWeightKg: parseFloat(curingWeightKg) || undefined,
        curingRatePerKg: parseFloat(curingRatePerKg) || undefined,
        curingBatchNo: curingBatchNo.trim() || undefined,
        scrapItemType: scrapItemType.trim() || undefined,
        scrapQuantity: parseFloat(scrapQuantity) || undefined,
        scrapUnit: scrapUnit.trim() || undefined,
        scrapRate: parseFloat(scrapRate) || undefined,
        advisoryTopic: advisoryTopic.trim() || undefined,
        advisoryHours: parseFloat(advisoryHours) || undefined,
        advisoryFee: parseFloat(advisoryFee) || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconWrap, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="wallet" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {editingEntry ? t('editIncome') || 'Edit Income Receipt' : t('farmIncome') || 'Record Farm Income'}
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  {editingEntry ? 'Update existing produce sale or income transaction' : 'Log produce sale, tour fees, scrap revenue & advances'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Division & Date */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('farm') || 'Division'}</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {options.filter((o) => o.id !== 'consolidated').map((o) => (
                    <TouchableOpacity
                      key={o.id}
                      onPress={() => handleFarmSelect(o.id)}
                      style={[
                        styles.farmChip,
                        {
                          backgroundColor: farmId === o.id ? `${colors.primary}15` : colors.surfaceSubtle,
                          borderColor: farmId === o.id ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.farmChipText,
                          { color: farmId === o.id ? colors.primary : colors.text, fontWeight: farmId === o.id ? '700' : '500' },
                        ]}
                      >
                        {o.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('date') || 'Receipt Date'}</Text>
                <TouchableOpacity
                  onPress={() => setIsDatePickerVisible(true)}
                  style={[
                    styles.dateSelectBtn,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={[styles.dateText, { color: colors.text }]}>{date}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Income Category */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Revenue Category</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((c) => {
                const isSel = category === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCategory(c.id)}
                    style={[
                      styles.catCard,
                      {
                        backgroundColor: isSel ? `${c.color}15` : colors.surfaceSubtle,
                        borderColor: isSel ? c.color : colors.cardBorder,
                      },
                    ]}
                  >
                    <Ionicons name={c.icon} size={16} color={isSel ? c.color : colors.textMuted} />
                    <Text
                      style={[
                        styles.catCardText,
                        { color: isSel ? (isDark ? '#FFFFFF' : c.color) : colors.text, fontWeight: isSel ? '700' : '500' },
                      ]}
                      numberOfLines={1}
                    >
                      {c.id === 'produce_sale' ? (t('produceSale') || c.label) : c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Produce Weighment & Rate Calculator for Produce Sale */}
            {category === 'produce_sale' && (
              <View
                style={{
                  backgroundColor: colors.surfaceSubtle,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  padding: 14,
                  marginBottom: 14,
                  gap: 10,
                }}
              >
                {/* Crop Selector */}
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 6 }}>
                    {t('selectCrop') || 'Select Crop'}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {CROP_OPTIONS.map((cr) => {
                      const isSel = produceCrop === cr.id;
                      return (
                        <TouchableOpacity
                          key={cr.id}
                          onPress={() => {
                            setProduceCrop(cr.id);
                            const grades = GRADE_OPTIONS[cr.id] || [];
                            if (grades.length > 0) {
                              setProduceGrade(grades[0]);
                              setShowCustomGrade(false);
                            }
                          }}
                          style={[
                            styles.subChip,
                            {
                              backgroundColor: isSel ? colors.primary : colors.card,
                              borderColor: isSel ? colors.primary : colors.cardBorder,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.subChipText,
                              { color: isSel ? '#FFFFFF' : colors.text, fontWeight: isSel ? '700' : '500' },
                            ]}
                          >
                            {cr.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Grade Selector */}
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 6 }}>
                    {t('selectGrade') || 'Grade Standard'}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {(GRADE_OPTIONS[produceCrop] || GRADE_OPTIONS['Other']).map((gr) => {
                      const isSel = !showCustomGrade && produceGrade === gr;
                      return (
                        <TouchableOpacity
                          key={gr}
                          onPress={() => {
                            setProduceGrade(gr);
                            setShowCustomGrade(false);
                          }}
                          style={[
                            styles.subChip,
                            {
                              backgroundColor: isSel ? `${colors.primary}20` : colors.card,
                              borderColor: isSel ? colors.primary : colors.cardBorder,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.subChipText,
                              { color: isSel ? colors.primary : colors.text, fontWeight: isSel ? '700' : '500' },
                            ]}
                          >
                            {gr}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity
                      onPress={() => setShowCustomGrade(true)}
                      style={[
                        styles.subChip,
                        {
                          backgroundColor: showCustomGrade ? `${colors.primary}20` : colors.card,
                          borderColor: showCustomGrade ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.subChipText,
                          { color: showCustomGrade ? colors.primary : colors.text, fontWeight: showCustomGrade ? '700' : '500' },
                        ]}
                      >
                        + {t('customGrade') || 'Custom Grade'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showCustomGrade && (
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.card, borderColor: colors.primary, color: colors.text, marginTop: 8, height: 42 },
                      ]}
                      placeholder={t('enterCustomGrade') || 'Type custom grade specification...'}
                      placeholderTextColor={colors.textMuted}
                      value={customGradeText}
                      onChangeText={setCustomGradeText}
                    />
                  )}
                </View>

                {/* Weight & Rate Inputs */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                      Net Weight (kg)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginBottom: 0, height: 42 },
                      ]}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 350.0"
                      placeholderTextColor={colors.textMuted}
                      value={produceWeightKg}
                      onChangeText={(w) => handleWeightOrRateChange(w, produceRatePerKg)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                      Rate / kg (₹)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginBottom: 0, height: 42 },
                      ]}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 2350"
                      placeholderTextColor={colors.textMuted}
                      value={produceRatePerKg}
                      onChangeText={(r) => handleWeightOrRateChange(produceWeightKg, r)}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Farm Tour / Agro-Tourism Calculator */}
            {category === 'farm_tour' && (
              <View style={[styles.categoryCardBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="camera" size={16} color="#14B8A6" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                    Agro-Tourism & Estate Walk Booking
                  </Text>
                </View>

                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                  {t('tourPackageName') || 'Tour Package / Experience Name'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                  placeholder="e.g. Cardamom Walk & Fresh Tea Tasting"
                  placeholderTextColor={colors.textMuted}
                  value={tourPackageName}
                  onChangeText={setTourPackageName}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                      {t('tourVisitorsCount') || 'Number of Visitors'}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                      keyboardType="numeric"
                      placeholder="e.g. 12"
                      placeholderTextColor={colors.textMuted}
                      value={tourVisitorsCount}
                      onChangeText={(v) => handleTourChange(v, tourRatePerPerson)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                      {t('tourRatePerPerson') || 'Fee / Head (₹)'}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 350"
                      placeholderTextColor={colors.textMuted}
                      value={tourRatePerPerson}
                      onChangeText={(r) => handleTourChange(tourVisitorsCount, r)}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Educational Visit Section */}
            {category === 'educational_visit' && (
              <View style={[styles.categoryCardBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="school" size={16} color="#8B5CF6" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                    Educational & University Study Tour
                  </Text>
                </View>

                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                  {t('institutionName') || 'Institution / College Name'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                  placeholder="e.g. College of Agriculture Vellayani (KAU)"
                  placeholderTextColor={colors.textMuted}
                  value={institutionName}
                  onChangeText={setInstitutionName}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                      {t('studentCount') || 'Student / Faculty Count'}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                      keyboardType="numeric"
                      placeholder="e.g. 45"
                      placeholderTextColor={colors.textMuted}
                      value={studentCount}
                      onChangeText={(c) => handleEduChange(c, studentFee)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                      {t('studentFee') || 'Fee / Head (₹)'}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 150"
                      placeholderTextColor={colors.textMuted}
                      value={studentFee}
                      onChangeText={(f) => handleEduChange(studentCount, f)}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Curing Rental Section */}
            {category === 'curing_rental' && (
              <View style={[styles.categoryCardBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="business" size={16} color="#3B82F6" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                    Cardamom Curing Facility Rental Service
                  </Text>
                </View>

                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                  {t('curingBatchNo') || 'Curing Batch / Lot ID'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                  placeholder="e.g. BATCH-CUR-26-88"
                  placeholderTextColor={colors.textMuted}
                  value={curingBatchNo}
                  onChangeText={setCuringBatchNo}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                      {t('curingWeight') || 'Green Produce Weight (kg)'}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 750.0"
                      placeholderTextColor={colors.textMuted}
                      value={curingWeightKg}
                      onChangeText={(w) => handleCuringChange(w, curingRatePerKg)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                      {t('curingRate') || 'Curing Rate / kg (₹)'}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 35"
                      placeholderTextColor={colors.textMuted}
                      value={curingRatePerKg}
                      onChangeText={(r) => handleCuringChange(curingWeightKg, r)}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Scrap Sale Section */}
            {category === 'scrap_sale' && (
              <View style={[styles.categoryCardBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="trash" size={16} color="#F59E0B" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                    Scrap & Surplus Farm Material Sale
                  </Text>
                </View>

                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                  {t('scrapItemType') || 'Scrap Material Category'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {[
                    'Empty Chemical Drums (200L)',
                    'Fertilizer Sacks / Bags',
                    'Scrap Metal & Fencing Wire',
                    'Discarded PVC / Drip Hose',
                  ].map((item) => {
                    const isSel = scrapItemType === item;
                    return (
                      <TouchableOpacity
                        key={item}
                        onPress={() => setScrapItemType(item)}
                        style={[
                          styles.subChip,
                          {
                            backgroundColor: isSel ? '#F59E0B20' : colors.card,
                            borderColor: isSel ? '#F59E0B' : colors.cardBorder,
                          },
                        ]}
                      >
                        <Text style={[styles.subChipText, { color: isSel ? '#D97706' : colors.text, fontWeight: isSel ? '700' : '500' }]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                  placeholder="Custom scrap item or specific lot..."
                  placeholderTextColor={colors.textMuted}
                  value={scrapItemType}
                  onChangeText={setScrapItemType}
                />

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                      {t('scrapQty') || 'Quantity'}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 15"
                      placeholderTextColor={colors.textMuted}
                      value={scrapQuantity}
                      onChangeText={(q) => handleScrapChange(q, scrapRate)}
                    />
                  </View>
                  <View style={{ flex: 0.8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                      {t('scrapUnit') || 'Unit'}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                      placeholder="nos / kg"
                      placeholderTextColor={colors.textMuted}
                      value={scrapUnit}
                      onChangeText={setScrapUnit}
                    />
                  </View>
                  <View style={{ flex: 1.2 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                      {t('scrapRate') || 'Rate / Unit (₹)'}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 250"
                      placeholderTextColor={colors.textMuted}
                      value={scrapRate}
                      onChangeText={(r) => handleScrapChange(scrapQuantity, r)}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Consulting / Advisory Section */}
            {category === 'consulting_honorarium' && (
              <View style={[styles.categoryCardBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="ribbon" size={16} color="#6366F1" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                    Agronomy Advisory & Field Knowledge Sharing
                  </Text>
                </View>

                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                  {t('advisoryTopic') || 'Consultation / Advisory Topic'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                  placeholder="e.g. High-Density Fertigation Protocol Design"
                  placeholderTextColor={colors.textMuted}
                  value={advisoryTopic}
                  onChangeText={setAdvisoryTopic}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                      {t('advisoryHours') || 'Sessions / Hours'}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 2"
                      placeholderTextColor={colors.textMuted}
                      value={advisoryHours}
                      onChangeText={(h) => handleAdvisoryChange(h, advisoryFee)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                      {t('advisoryFee') || 'Fee / Session (₹)'}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 2500"
                      placeholderTextColor={colors.textMuted}
                      value={advisoryFee}
                      onChangeText={(f) => handleAdvisoryChange(advisoryHours, f)}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Other Miscellaneous Receipts */}
            {category === 'other_income' && (
              <View style={[styles.categoryCardBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="cash" size={16} color="#64748B" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                    Miscellaneous Farm Receipt
                  </Text>
                </View>

                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                  {t('otherIncomeDesc') || 'Particulars / Reference'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, height: 42 }]}
                  placeholder="e.g. Nursery sapling direct sale / land lease advance"
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            )}

            {/* Amount (₹) */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 0 }]}>
                {t('totalAmountLabel') || 'Amount Received (₹)'}
              </Text>
              <TouchableOpacity
                onPress={() => setAmount('0')}
                style={{
                  backgroundColor: amount === '0' ? `${colors.primary}20` : colors.surfaceSubtle,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: amount === '0' ? colors.primary : colors.cardBorder,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: amount === '0' ? colors.primary : colors.textMuted }}>
                  {t('freeComplimentaryShort') || 'Free / ₹0'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.amountBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.rupeeSymbol, { color: colors.primary }]}>₹</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                keyboardType="decimal-pad"
                placeholder="0.00 (Optional for free tours/educational visits)"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Payer Profile & Contact Picker */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 4 }}>
              <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 0 }]}>
                {t('buyerTrader') || 'Customer / Buyer / Source'} *
              </Text>
              <TouchableOpacity
                onPress={() => setShowContactPicker(true)}
                style={[styles.contactPickerBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
              >
                <Ionicons name="people" size={14} color={colors.primary} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                  Select Contact
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <TextInput
                style={[
                  styles.input,
                  { flex: 1.2, backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="e.g. Green Valley Traders"
                placeholderTextColor={colors.textMuted}
                value={payerName}
                onChangeText={setPayerName}
              />
              <TextInput
                style={[
                  styles.input,
                  { flex: 0.8, backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="Phone (optional)"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={payerPhone}
                onChangeText={setPayerPhone}
              />
            </View>

            {/* Payer Address & GSTIN */}
            <View style={styles.row}>
              <TextInput
                style={[
                  styles.input,
                  { flex: 1.2, backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                ]}
                placeholder={t('buyerAddressLabel') || 'Buyer / Customer Address (optional)'}
                placeholderTextColor={colors.textMuted}
                value={payerAddress}
                onChangeText={setPayerAddress}
              />
              <TextInput
                style={[
                  styles.input,
                  { flex: 0.8, backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                ]}
                placeholder={t('buyerGstinLabel') || 'GSTIN (optional)'}
                placeholderTextColor={colors.textMuted}
                value={payerGstin}
                onChangeText={setPayerGstin}
                autoCapitalize="characters"
              />
            </View>

            {/* Title / Description */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {t('descriptionExpenseTitle') || 'Income Title / Particulars'}
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
              ]}
              placeholder="e.g. Advance payment for 150kg dry cardamom batch #04"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Payment Mode */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Mode</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
              {PAYMENT_MODES.map((pm) => {
                const isSel = paymentMode === pm.id;
                return (
                  <TouchableOpacity
                    key={pm.id}
                    onPress={() => setPaymentMode(pm.id)}
                    style={[
                      styles.payModeChip,
                      {
                        backgroundColor: isSel ? `${colors.primary}15` : colors.surfaceSubtle,
                        borderColor: isSel ? colors.primary : colors.cardBorder,
                      },
                    ]}
                  >
                    <Ionicons name={pm.icon} size={14} color={isSel ? colors.primary : colors.textMuted} />
                    <Text
                      style={[
                        styles.payModeText,
                        { color: isSel ? colors.primary : colors.text, fontWeight: isSel ? '700' : '500' },
                      ]}
                    >
                      {pm.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Receipt Number & Notes */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {t('receiptNo') || 'Receipt / Voucher Number'}
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
              ]}
              placeholder="e.g. REC-26-NAM-1041"
              placeholderTextColor={colors.textMuted}
              value={receiptNumber}
              onChangeText={setReceiptNumber}
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {t('notes') || 'Internal Remarks / Notes'}
            </Text>
            <TextInput
              style={[
                styles.input,
                { height: 65, backgroundColor: colors.background, borderColor: colors.border, color: colors.text, textAlignVertical: 'top' },
              ]}
              multiline
              numberOfLines={2}
              placeholder="Optional notes, lot numbers, check details..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity
              disabled={isSubmitting || !payerName.trim()}
              onPress={handleSave}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: payerName.trim() ? colors.primary : colors.textMuted,
                  marginTop: 18,
                  marginBottom: 34,
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                {editingEntry ? t('save') || 'Update Income Record' : t('save') || 'Save Income Receipt'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Date Picker Modal */}
          <ThemedDatePickerModal
            visible={isDatePickerVisible}
            selectedDate={date}
            onSelectDate={(newDate) => {
              setDate(newDate);
              setIsDatePickerVisible(false);
            }}
            onClose={() => setIsDatePickerVisible(false)}
          />

          {/* Contact Picker Modal */}
          <ContactPickerModal
            visible={showContactPicker}
            onClose={() => setShowContactPicker(false)}
            onSelectContact={handleSelectContact}
            orgId={orgId}
            title="Pick Customer / Payer"
            defaultCategory="trader"
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
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
    marginTop: 6,
  },
  farmChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  farmChipText: {
    fontSize: 12,
  },
  dateSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    width: '48.5%',
  },
  catCardText: {
    fontSize: 12,
    flex: 1,
  },
  subChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  subChipText: {
    fontSize: 11,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  rupeeSymbol: {
    fontSize: 20,
    fontWeight: '800',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    paddingVertical: 10,
  },
  contactPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    marginBottom: 8,
  },
  payModeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  payModeText: {
    fontSize: 11,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  categoryCardBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    gap: 8,
  },
});
