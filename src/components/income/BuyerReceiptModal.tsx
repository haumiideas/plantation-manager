import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { IncomeEntry } from '../../types/income';
import { formatIndianNumber } from '../../services/exportService';
import { formatDate } from '../../utils/date';

interface BuyerReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  entry: IncomeEntry | null;
  estateName?: string;
}

const CROP_OPTIONS = [
  { id: 'Cardamom', label: 'Cardamom' },
  { id: 'Black Pepper', label: 'Black Pepper' },
  { id: 'Coffee', label: 'Coffee' },
  { id: 'Other', label: 'Other' },
];

const GRADE_STANDARDS: Record<string, string[]> = {
  Cardamom: [
    '8mm+ Bold Green',
    '7-8mm Extra Bold',
    'Bulk / Bleached Commercial',
    'Pan / Separator Ripe (Yellow/Red)',
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

const COMPANY_PROFILE_STORAGE_KEY = '@farmag_company_profile';

interface CategoryReceiptDetails {
  docTitle: string;
  itemDescription: string;
  itemSpec: string;
  metricLabel: string;
  metricValue: string;
  rateLabel: string;
  rateValue: string;
}

const getCategoryReceiptDetails = (
  entry: IncomeEntry,
  cropName: string,
  gradeName: string
): CategoryReceiptDetails => {
  switch (entry.category) {
    case 'produce_sale':
      return {
        docTitle: 'Farm-Gate Produce Sale Receipt',
        itemDescription: cropName,
        itemSpec: gradeName,
        metricLabel: 'Weight (kg)',
        metricValue: entry.produceWeightKg ? `${entry.produceWeightKg.toFixed(1)} kg` : '-',
        rateLabel: 'Rate / kg',
        rateValue: entry.produceRatePerKg ? `₹${formatIndianNumber(entry.produceRatePerKg, 2)}` : '-',
      };
    case 'farm_tour':
      return {
        docTitle: 'Agro-Tourism & Estate Visit Receipt',
        itemDescription: entry.tourPackageName || entry.title || 'Estate Guided Tour',
        itemSpec: 'Agro-Tourism Visitor Pass',
        metricLabel: 'Visitors',
        metricValue: entry.tourVisitorsCount ? `${entry.tourVisitorsCount} Persons` : '-',
        rateLabel: 'Rate / Person',
        rateValue: entry.tourRatePerPerson ? `₹${formatIndianNumber(entry.tourRatePerPerson, 2)}` : '-',
      };
    case 'educational_visit':
      return {
        docTitle: 'Educational Study Tour Receipt',
        itemDescription: entry.institutionName || entry.title || 'Educational Visit',
        itemSpec: 'Student Study Delegation',
        metricLabel: 'Students',
        metricValue: entry.studentCount ? `${entry.studentCount} Students` : '-',
        rateLabel: 'Fee / Student',
        rateValue: entry.studentFee ? `₹${formatIndianNumber(entry.studentFee, 2)}` : '-',
      };
    case 'curing_rental':
      return {
        docTitle: 'Cardamom Curing Service Receipt',
        itemDescription: `Curing Facility Rental (Batch: ${entry.curingBatchNo || 'Standard'})`,
        itemSpec: 'Kiln / Curing Unit Service',
        metricLabel: 'Green Weight',
        metricValue: entry.curingWeightKg ? `${entry.curingWeightKg.toFixed(1)} kg` : '-',
        rateLabel: 'Curing Rate / kg',
        rateValue: entry.curingRatePerKg ? `₹${formatIndianNumber(entry.curingRatePerKg, 2)}` : '-',
      };
    case 'scrap_sale':
      return {
        docTitle: 'Scrap & Surplus Material Invoice',
        itemDescription: entry.scrapItemType || entry.title || 'Scrap Material',
        itemSpec: 'Farm Surplus Disposal',
        metricLabel: 'Quantity',
        metricValue: entry.scrapQuantity ? `${entry.scrapQuantity} ${entry.scrapUnit || 'nos'}` : '-',
        rateLabel: 'Rate / Unit',
        rateValue: entry.scrapRate ? `₹${formatIndianNumber(entry.scrapRate, 2)}` : '-',
      };
    case 'consulting_honorarium':
      return {
        docTitle: 'Agronomy Advisory & Consulting Receipt',
        itemDescription: entry.advisoryTopic || entry.title || 'Field Agronomy Advisory',
        itemSpec: 'Technical Consultancy',
        metricLabel: 'Duration',
        metricValue: entry.advisoryHours ? `${entry.advisoryHours} Sessions/Hours` : '-',
        rateLabel: 'Fee / Session',
        rateValue: entry.advisoryFee ? `₹${formatIndianNumber(entry.advisoryFee, 2)}` : '-',
      };
    case 'other_income':
    default:
      return {
        docTitle: 'Official Farm Receipt & Voucher',
        itemDescription: entry.title || 'Farm Receipt',
        itemSpec: 'General Plantation Receipt',
        metricLabel: 'Quantity',
        metricValue: '-',
        rateLabel: 'Rate',
        rateValue: '-',
      };
  }
};

export const BuyerReceiptModal: React.FC<BuyerReceiptModalProps> = ({
  visible,
  onClose,
  entry,
  estateName = 'Namari & Adukidathan Estates',
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [selectedCrop, setSelectedCrop] = useState<string>('Cardamom');
  const [selectedGrade, setSelectedGrade] = useState<string>('8mm+ Bold Green');
  const [customGradeText, setCustomGradeText] = useState<string>('');
  const [showCustomGradeInput, setShowCustomGradeInput] = useState<boolean>(false);

  // Official Company Profile & Buyer Profile (Persisted in AsyncStorage)
  const [companyName, setCompanyName] = useState<string>('Highland Plantations & Spices Agro Enterprise');
  const [companyAddress, setCompanyAddress] = useState<string>('P.O. Box 14, Nedumkandam, Idukki District, Kerala - 685553');
  const [companyContact, setCompanyContact] = useState<string>('+91 94470 12345 | operations@highlandagro.in');
  const [companyGstin, setCompanyGstin] = useState<string>('32AAAAA0000A1Z5');

  const [buyerAddress, setBuyerAddress] = useState<string>('');
  const [buyerGstin, setBuyerGstin] = useState<string>('');
  const [showProfileConfig, setShowProfileConfig] = useState<boolean>(false);

  // Load persisted company profile on mount/visible
  useEffect(() => {
    AsyncStorage.getItem(COMPANY_PROFILE_STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const profile = JSON.parse(raw);
          if (profile.companyName) setCompanyName(profile.companyName);
          if (profile.companyAddress) setCompanyAddress(profile.companyAddress);
          if (profile.companyContact) setCompanyContact(profile.companyContact);
          if (profile.companyGstin) setCompanyGstin(profile.companyGstin);
        } catch {}
      } else if (estateName) {
        setCompanyName(`${estateName} Agro Enterprise`);
      }
    }).catch(() => {});
  }, [visible, estateName]);

  const saveCompanyProfile = async (updates: Partial<{
    companyName: string;
    companyAddress: string;
    companyContact: string;
    companyGstin: string;
  }>) => {
    try {
      const current = {
        companyName,
        companyAddress,
        companyContact,
        companyGstin,
        ...updates,
      };
      await AsyncStorage.setItem(COMPANY_PROFILE_STORAGE_KEY, JSON.stringify(current));
    } catch {}
  };

  // Sync state whenever entry changes or modal opens
  useEffect(() => {
    if (entry) {
      const crop = entry.produceCrop || 'Cardamom';
      setSelectedCrop(crop);
      const defaultGrades = GRADE_STANDARDS[crop] || GRADE_STANDARDS.Other;
      if (entry.produceGrade) {
        if (defaultGrades.includes(entry.produceGrade)) {
          setSelectedGrade(entry.produceGrade);
          setShowCustomGradeInput(false);
          setCustomGradeText('');
        } else {
          setSelectedGrade(defaultGrades[0]);
          setShowCustomGradeInput(true);
          setCustomGradeText(entry.produceGrade);
        }
      } else {
        setSelectedGrade(defaultGrades[0]);
        setShowCustomGradeInput(false);
        setCustomGradeText('');
      }

      setBuyerAddress(entry.payerAddress || '');
      setBuyerGstin(entry.payerGstin || '');
    }
  }, [entry, visible]);

  if (!entry) return null;

  const receiptNo = entry.receiptNumber || `REC-26-${entry.id.slice(-4).toUpperCase()}`;
  const totalAmountFormatted = formatIndianNumber(entry.amount, 2);
  const weightKg = entry.produceWeightKg || 0;
  const ratePerKg = entry.produceRatePerKg || (weightKg > 0 ? entry.amount / weightKg : 0);
  const cropName = selectedCrop;
  const gradeName = showCustomGradeInput && customGradeText.trim() ? customGradeText.trim() : selectedGrade;

  const catDetails = getCategoryReceiptDetails(entry, cropName, gradeName);

  // Build clean WhatsApp message tailored to category
  const buildWhatsAppMessage = (): string => {
    return (
      `🌾 *${companyName.toUpperCase()}*\n` +
      `*${catDetails.docTitle.toUpperCase()}*\n` +
      `📍 ${companyAddress}\n` +
      `📞 ${companyContact}${companyGstin ? ` • GSTIN: ${companyGstin}` : ''}\n` +
      `----------------------------------------\n` +
      `📄 *Receipt No:* ${receiptNo}\n` +
      `📅 *Date:* ${entry.date}\n` +
      `👤 *Customer / Payer:* ${entry.payerName}${entry.payerPhone ? ` (${entry.payerPhone})` : ''}\n` +
      (buyerAddress ? `🏠 *Address:* ${buyerAddress}\n` : '') +
      (buyerGstin ? `🏛️ *GSTIN:* ${buyerGstin}\n` : '') +
      `📍 *Farm Division:* ${entry.farmId.toUpperCase()} Estate\n\n` +
      `*PARTICULARS:*\n` +
      `📋 *Description:* ${catDetails.itemDescription}\n` +
      (catDetails.itemSpec ? `🏷️ *Specification:* ${catDetails.itemSpec}\n` : '') +
      (catDetails.metricValue !== '-' ? `⚖️ *${catDetails.metricLabel}:* ${catDetails.metricValue}\n` : '') +
      (catDetails.rateValue !== '-' ? `💰 *${catDetails.rateLabel}:* ${catDetails.rateValue}\n` : '') +
      `----------------------------------------\n` +
      (entry.amount === 0
        ? `💵 *TOTAL AMOUNT:* Free / Complimentary (₹0.00)\n` +
          `💳 *Payment Status:* COMPLIMENTARY / FREE VISIT (NO PAYMENT DUE)\n`
        : `💵 *TOTAL AMOUNT:* ₹${totalAmountFormatted}\n` +
          `💳 *Payment Mode:* ${entry.paymentMode.toUpperCase()} (CLEARED)\n`
      ) +
      (entry.notes ? `📝 *Notes:* ${entry.notes}\n` : '') +
      `----------------------------------------\n` +
      `ℹ️ _This is a computer-generated document and requires no physical signature._\n` +
      `_Official Estate Receipt • Generated via Farmag App_`
    );
  };

  const handleShareWhatsApp = async () => {
    try {
      const msg = encodeURIComponent(buildWhatsAppMessage());
      let phoneParam = '';
      if (entry.payerPhone) {
        // Strip non-digits
        const cleanPhone = entry.payerPhone.replace(/\D/g, '');
        // If 10 digits Indian number, prefix 91
        const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        phoneParam = fullPhone;
      }

      const waUrl = phoneParam
        ? `whatsapp://send?phone=${phoneParam}&text=${msg}`
        : `whatsapp://send?text=${msg}`;
      const webWaUrl = phoneParam
        ? `https://wa.me/${phoneParam}?text=${msg}`
        : `https://wa.me/?text=${msg}`;

      const supported = await Linking.canOpenURL(waUrl);
      if (supported) {
        await Linking.openURL(waUrl);
      } else {
        await Linking.openURL(webWaUrl);
      }
    } catch (err: any) {
      console.warn('WhatsApp share error:', err);
      Alert.alert('Notice', 'Unable to open WhatsApp. Message copied to clipboard.');
    }
  };

  const handleSharePdfReceipt = async () => {
    setIsGeneratingPdf(true);
    try {
      const isProduce = entry.category === 'produce_sale';
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${catDetails.docTitle} - ${receiptNo}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 40px;
                color: #0F172A;
                background: #FFFFFF;
              }
              .receipt-box {
                border: 2px solid #047857;
                border-radius: 12px;
                padding: 30px;
                max-width: 650px;
                margin: 0 auto;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #E2E8F0;
                padding-bottom: 18px;
                margin-bottom: 22px;
              }
              .estate-title {
                font-size: 22px;
                font-weight: 900;
                color: #065F46;
                margin: 0;
              }
              .receipt-type {
                font-size: 13px;
                font-weight: 700;
                color: #047857;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-top: 4px;
              }
              .receipt-meta {
                text-align: right;
                font-size: 12px;
                color: #64748B;
                line-height: 1.6;
              }
              .meta-badge {
                display: inline-block;
                background: #ECFDF5;
                color: #047857;
                font-weight: 800;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 11px;
                margin-bottom: 4px;
              }
              .info-grid {
                display: flex;
                gap: 20px;
                background: #F8FAFC;
                border: 1px solid #E2E8F0;
                border-radius: 8px;
                padding: 14px 18px;
                margin-bottom: 24px;
              }
              .info-col {
                flex: 1;
              }
              .info-label {
                font-size: 10px;
                font-weight: 700;
                color: #64748B;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .info-val {
                font-size: 14px;
                font-weight: 700;
                color: #0F172A;
                margin-top: 2px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 24px;
              }
              th {
                background: #065F46;
                color: #FFFFFF;
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                padding: 10px 12px;
                text-align: left;
              }
              td {
                padding: 12px;
                font-size: 12px;
                border-bottom: 1px solid #E2E8F0;
                color: #1E293B;
              }
              .total-box {
                display: flex;
                justify-content: flex-end;
                margin-top: 10px;
                border-top: 2px solid #0F172A;
                padding-top: 14px;
              }
              .total-inner {
                text-align: right;
              }
              .total-label {
                font-size: 12px;
                font-weight: 700;
                color: #64748B;
                text-transform: uppercase;
              }
              .total-amount {
                font-size: 26px;
                font-weight: 900;
                color: #065F46;
                margin-top: 2px;
              }
              .footer {
                margin-top: 36px;
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: #94A3B8;
                border-top: 1px solid #E2E8F0;
                padding-top: 16px;
              }
            </style>
          </head>
          <body>
            <div class="receipt-box">
              <div class="header">
                <div>
                  <h1 class="estate-title">${companyName}</h1>
                  <div style="font-size: 11px; color: #475569; margin-top: 3px;">${companyAddress}</div>
                  <div style="font-size: 11px; color: #475569;">Tel: ${companyContact}${companyGstin ? ` | GSTIN: <strong>${companyGstin}</strong>` : ''}</div>
                  <div class="receipt-type">${catDetails.docTitle}</div>
                  <div style="font-size: 11px; color: #047857; font-weight: 700; margin-top: 2px;">Farm Division: ${entry.farmId.toUpperCase()} Estate</div>
                </div>
                <div class="receipt-meta">
                  <div class="meta-badge">${receiptNo}</div>
                  <div><strong>Date:</strong> ${entry.date}</div>
                  <div><strong>Status:</strong> <span style="color: #059669; font-weight: 800;">${entry.amount === 0 ? 'COMPLIMENTARY / FREE VISIT' : 'PAID & CLEARED'}</span></div>
                </div>
              </div>

              <div class="info-grid">
                <div class="info-col">
                  <div class="info-label">Customer / Payer Details</div>
                  <div class="info-val">${entry.payerName}</div>
                  ${entry.payerPhone ? `<div style="font-size: 11px; color: #64748B;">Tel: ${entry.payerPhone}</div>` : ''}
                  ${buyerAddress ? `<div style="font-size: 11px; color: #64748B;">Address: ${buyerAddress}</div>` : ''}
                  ${buyerGstin ? `<div style="font-size: 11px; color: #64748B;">GSTIN: ${buyerGstin}</div>` : ''}
                </div>
                <div class="info-col">
                  <div class="info-label">Payment Mode</div>
                  <div class="info-val" style="text-transform: uppercase;">${entry.amount === 0 ? 'COMPLIMENTARY' : entry.paymentMode}</div>
                  <div style="font-size: 11px; color: #059669; font-weight: 600;">Direct Farm Settlement</div>
                </div>
              </div>

              ${
                isProduce
                  ? `<table>
                      <thead>
                        <tr>
                          <th>Item Description</th>
                          <th>Grade / Quality</th>
                          <th style="text-align: right;">Weight (kg)</th>
                          <th style="text-align: right;">Rate / kg (INR)</th>
                          <th style="text-align: right;">Total (INR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>${cropName}</strong><br><span style="font-size: 10px; color: #64748B;">Farm-gate lot pickup</span></td>
                          <td>${gradeName}</td>
                          <td style="text-align: right;">${weightKg > 0 ? weightKg.toFixed(1) : '-'}</td>
                          <td style="text-align: right;">${ratePerKg > 0 ? formatIndianNumber(ratePerKg, 2) : '-'}</td>
                          <td style="text-align: right; font-weight: 800;">${entry.amount === 0 ? 'Free (₹0.00)' : `₹${totalAmountFormatted}`}</td>
                        </tr>
                      </tbody>
                    </table>`
                  : `<table>
                      <thead>
                        <tr>
                          <th>Item Description</th>
                          <th>Specification</th>
                          <th style="text-align: right;">${catDetails.metricLabel}</th>
                          <th style="text-align: right;">${catDetails.rateLabel}</th>
                          <th style="text-align: right;">Total (INR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>${catDetails.itemDescription}</strong><br><span style="font-size: 10px; color: #64748B;">Direct Plantation Operations</span></td>
                          <td>${catDetails.itemSpec}</td>
                          <td style="text-align: right;">${catDetails.metricValue}</td>
                          <td style="text-align: right;">${catDetails.rateValue}</td>
                          <td style="text-align: right; font-weight: 800;">${entry.amount === 0 ? 'Free (₹0.00)' : `₹${totalAmountFormatted}`}</td>
                        </tr>
                      </tbody>
                    </table>`
              }

              <div class="total-box">
                <div class="total-inner">
                  <div class="total-label">${entry.amount === 0 ? 'Billing Status' : 'Total Realized Amount'}</div>
                  <div class="total-amount">${entry.amount === 0 ? 'Free / Complimentary' : `₹${totalAmountFormatted}`}</div>
                  <div style="font-size: 11px; color: #64748B; margin-top: 4px;">${entry.amount === 0 ? 'Complimentary / Educational Goodwill Visit (No Payment Due)' : `Indian Rupees ${entry.amount.toLocaleString('en-IN')} Only`}</div>
                </div>
              </div>

              ${entry.notes ? `<div style="background: #F1F5F9; border-radius: 6px; padding: 10px 12px; font-size: 11px; color: #475569; margin-top: 18px;"><strong>Terms / Notes:</strong> ${entry.notes}</div>` : ''}

              <div style="margin-top: 26px; padding: 12px; border: 1px dashed #64748B; border-radius: 6px; text-align: center; background: #F8FAFC;">
                <p style="font-size: 11px; font-weight: 700; color: #334155; margin: 0;">
                  ℹ️ This is a computer-generated document and requires no physical signature.
                </p>
              </div>

              <div class="footer">
                <div>Farmag App Plantation Operations ERP • Verified Immutable Transaction</div>
                <div>Generated: ${formatDate()}</div>
              </div>
            </div>
          </body>
        </html>
      `;

      try {
        const { uri } = await Print.printToFileAsync({ html });
        const available = await Sharing.isAvailableAsync();
        if (available) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Receipt - ${receiptNo}`,
            UTI: 'com.adobe.pdf',
          });
          return;
        }
      } catch (fileErr) {
        console.warn('printToFileAsync or shareAsync failed, falling back to Print preview:', fileErr);
      }
      // Direct Print / Save to PDF fallback
      await Print.printAsync({ html });
    } catch (err: any) {
      console.warn('PDF receipt error:', err);
      Alert.alert('Notice', 'Unable to generate PDF receipt. Please check printer or storage permissions.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.iconCircle, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="receipt" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>{catDetails.docTitle}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {entry.category === 'produce_sale'
                    ? 'Farm-gate purchase voucher & buyer memo'
                    : 'Official plantation revenue receipt & memo'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}>
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Interactive Crop & Grade Selection Bar - ONLY for Produce Sale */}
            {entry.category === 'produce_sale' && (
              <View style={[styles.standardsCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Ionicons name="leaf" size={15} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('selectCrop')}</Text>
                </View>
                <View style={styles.chipRow}>
                  {CROP_OPTIONS.map((c) => {
                    const isSel = selectedCrop === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => {
                          setSelectedCrop(c.id);
                          const defaultGrades = GRADE_STANDARDS[c.id] || [];
                          if (defaultGrades.length > 0) {
                            setSelectedGrade(defaultGrades[0]);
                            setShowCustomGradeInput(false);
                          }
                        }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSel ? colors.primary : colors.card,
                            borderColor: isSel ? colors.primary : colors.cardBorder,
                          },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: isSel ? '#FFFFFF' : colors.text }]}>
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, marginBottom: 6 }}>
                  <Ionicons name="ribbon-outline" size={15} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('selectGrade')}</Text>
                </View>
                <View style={styles.chipRow}>
                  {(GRADE_STANDARDS[selectedCrop] || GRADE_STANDARDS.Other).map((g) => {
                    const isSel = !showCustomGradeInput && selectedGrade === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        onPress={() => {
                          setSelectedGrade(g);
                          setShowCustomGradeInput(false);
                        }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSel ? '#059669' : colors.card,
                            borderColor: isSel ? '#059669' : colors.cardBorder,
                          },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: isSel ? '#FFFFFF' : colors.text }]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    onPress={() => setShowCustomGradeInput(true)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: showCustomGradeInput ? '#059669' : colors.card,
                        borderColor: showCustomGradeInput ? '#059669' : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: showCustomGradeInput ? '#FFFFFF' : colors.text }]}>
                      + {t('customGrade')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showCustomGradeInput && (
                  <View style={{ marginTop: 8 }}>
                    <TextInput
                      style={[
                        styles.customGradeInput,
                        { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                      ]}
                      placeholder={t('enterCustomGrade')}
                      placeholderTextColor={colors.textMuted}
                      value={customGradeText}
                      onChangeText={setCustomGradeText}
                    />
                  </View>
                )}
              </View>
            )}

            {/* Company & Buyer Details Configuration Card */}
            <View style={[styles.standardsCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              <TouchableOpacity
                onPress={() => setShowProfileConfig(!showProfileConfig)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="business-outline" size={15} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Company & Buyer Profile (Official Memo)</Text>
                </View>
                <Ionicons
                  name={showProfileConfig ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              {showProfileConfig && (
                <View style={{ marginTop: 10, gap: 8 }}>
                  <View>
                    <Text style={[styles.metaFieldLabel, { color: colors.textMuted }]}>Estate / Company Name</Text>
                    <TextInput
                      style={[styles.customGradeInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginTop: 4 }]}
                      value={companyName}
                      onChangeText={(val) => {
                        setCompanyName(val);
                        saveCompanyProfile({ companyName: val });
                      }}
                      placeholder="Company / Estate Name"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View>
                    <Text style={[styles.metaFieldLabel, { color: colors.textMuted }]}>Official Address</Text>
                    <TextInput
                      style={[styles.customGradeInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginTop: 4 }]}
                      value={companyAddress}
                      onChangeText={(val) => {
                        setCompanyAddress(val);
                        saveCompanyProfile({ companyAddress: val });
                      }}
                      placeholder="Address & P.O."
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.metaFieldLabel, { color: colors.textMuted }]}>Contact / Email</Text>
                      <TextInput
                        style={[styles.customGradeInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginTop: 4 }]}
                        value={companyContact}
                        onChangeText={(val) => {
                          setCompanyContact(val);
                          saveCompanyProfile({ companyContact: val });
                        }}
                        placeholder="Phone & Email"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.metaFieldLabel, { color: colors.textMuted }]}>Company GSTIN</Text>
                      <TextInput
                        style={[styles.customGradeInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginTop: 4 }]}
                        value={companyGstin}
                        onChangeText={(val) => {
                          setCompanyGstin(val);
                          saveCompanyProfile({ companyGstin: val });
                        }}
                        placeholder="GSTIN"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.metaFieldLabel, { color: colors.textMuted }]}>Buyer Address (Optional)</Text>
                      <TextInput
                        style={[styles.customGradeInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginTop: 4 }]}
                        value={buyerAddress}
                        onChangeText={setBuyerAddress}
                        placeholder="Buyer location / market"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.metaFieldLabel, { color: colors.textMuted }]}>Buyer GSTIN (Optional)</Text>
                      <TextInput
                        style={[styles.customGradeInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginTop: 4 }]}
                        value={buyerGstin}
                        onChangeText={setBuyerGstin}
                        placeholder="Buyer GSTIN"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Receipt Preview Box */}
            <View style={[styles.receiptPaper, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              {/* Top Banner */}
              <View style={styles.receiptTop}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.receiptEstateName, { color: colors.primary }]}>{companyName}</Text>
                  <Text style={[styles.receiptDocType, { color: colors.textMuted }]}>
                    {catDetails.docTitle}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{companyAddress}</Text>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>{companyContact}{companyGstin ? ` • GSTIN: ${companyGstin}` : ''}</Text>
                </View>
                <View style={[styles.badgePill, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <Text style={styles.badgePillText}>{receiptNo}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

              {/* Meta details */}
              <View style={styles.metaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.metaFieldLabel, { color: colors.textMuted }]}>Customer / Payer:</Text>
                  <Text style={[styles.metaFieldValue, { color: colors.text }]}>{entry.payerName}</Text>
                  {entry.payerPhone && (
                    <Text style={[styles.metaFieldSub, { color: colors.textMuted }]}>📱 {entry.payerPhone}</Text>
                  )}
                  {buyerAddress ? (
                    <Text style={[styles.metaFieldSub, { color: colors.textMuted }]}>🏠 {buyerAddress}</Text>
                  ) : null}
                  {buyerGstin ? (
                    <Text style={[styles.metaFieldSub, { color: colors.textMuted }]}>🏛️ GSTIN: {buyerGstin}</Text>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.metaFieldLabel, { color: colors.textMuted }]}>Date & Scope:</Text>
                  <Text style={[styles.metaFieldValue, { color: colors.text }]}>{entry.date}</Text>
                  <Text style={[styles.metaFieldSub, { color: colors.textMuted }]}>
                    {entry.farmId.toUpperCase()} Division
                  </Text>
                </View>
              </View>

              {/* Item Card */}
              <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.itemName, { color: colors.text }]}>{catDetails.itemDescription}</Text>
                    <Text style={[styles.itemGrade, { color: colors.textMuted }]}>{catDetails.itemSpec}</Text>
                  </View>
                  <Text style={[styles.itemAmount, { color: '#059669' }]}>
                    {entry.amount === 0 ? 'Free / ₹0.00' : `₹${totalAmountFormatted}`}
                  </Text>
                </View>

                <View style={styles.itemCalcRow}>
                  <Text style={[styles.itemCalcText, { color: colors.textMuted }]}>
                    {catDetails.metricValue !== '-' ? `${catDetails.metricLabel}: ${catDetails.metricValue}` : ''}
                    {catDetails.rateValue !== '-' ? ` • ${catDetails.rateLabel}: ${catDetails.rateValue}` : ''}
                  </Text>
                  <Text style={[styles.itemStatusText, { color: '#059669' }]}>
                    {entry.amount === 0 ? 'Complimentary' : `${entry.paymentMode.toUpperCase()} Paid`}
                  </Text>
                </View>
              </View>

              {/* Notes */}
              {entry.notes && (
                <View style={[styles.notesWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.notesTitle, { color: colors.textMuted }]}>Notes / Remarks:</Text>
                  <Text style={[styles.notesContent, { color: colors.text }]}>{entry.notes}</Text>
                </View>
              )}

              {/* Computer Generated Notice Banner */}
              <View style={[styles.computerNoticeBox, { backgroundColor: colors.card, borderColor: colors.border, marginTop: entry.notes ? 10 : 6 }]}>
                <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
                <Text style={[styles.computerNoticeText, { color: colors.textMuted }]}>
                  {t('computerGeneratedNotice') || 'This is a computer-generated document and requires no physical signature.'}
                </Text>
              </View>
            </View>

            {/* Actions: WhatsApp & PDF */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                onPress={handleShareWhatsApp}
                style={[styles.whatsappBtn, { backgroundColor: '#25D366' }]}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.whatsappBtnText}>Share on WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSharePdfReceipt}
                disabled={isGeneratingPdf}
                style={[styles.pdfBtn, { backgroundColor: colors.primary }]}
              >
                {isGeneratingPdf ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.pdfBtnText}>Share PDF Receipt</Text>
                  </>
                )}
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '90%',
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
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 16,
  },
  receiptPaper: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  receiptTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  receiptEstateName: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  receiptDocType: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaFieldValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  metaFieldSub: {
    fontSize: 11,
    marginTop: 2,
  },
  itemCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
  },
  itemGrade: {
    fontSize: 11,
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  itemCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  itemCalcText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  notesWrap: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  notesContent: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  actionsContainer: {
    gap: 10,
    marginTop: 18,
    marginBottom: 24,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  pdfBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  standardsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  customGradeInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13.5,
  },
  computerNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  computerNoticeText: {
    flex: 1,
    fontSize: 10.5,
    fontStyle: 'italic',
    lineHeight: 14,
  },
});
