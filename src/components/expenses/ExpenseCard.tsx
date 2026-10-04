import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { ExpenseEntry } from '../../types/expense';
import { Language } from '../../i18n/translations';

interface ExpenseCardProps {
  entry: ExpenseEntry;
  onEdit: (entry: ExpenseEntry) => void;
  onDelete: (id: string) => void;
}

const NOTE_TRANSLATIONS: Record<string, { ta: string; ml: string }> = {
  'Fuel loaded into main storage drum for curing flush.': {
    ta: 'பதப்படுத்தும் முறைக்காக முதன்மை சேமிப்பு பீப்பாயில் எரிபொருள் நிரப்பப்பட்டது.',
    ml: 'ക്യൂറിംഗ് ഫ്ലഷിനായി പ്രധാന സംഭരണ ഡ്രമ്മിൽ ഇന്ധനം നിറച്ചു.',
  },
  'For inter-row weed trimming ahead of picking.': {
    ta: 'அறுவடைக்கு முன் வரிசைகளுக்கு இடையேயான களைகளை வெட்டுவதற்கு.',
    ml: 'വിളവെടുപ്പിന് മുന്നോടിയായി നിരകൾക്കിടയിലെ കളകൾ നീക്കം ചെയ്യാൻ.',
  },
  'Periodic maintenance oil change.': {
    ta: 'வழக்கமான பராமரிப்பு எண்ணெய் மாற்றம்.',
    ml: 'ആവർത്തന മെയിന്റനൻസ് ഓയിൽ മാറ്റം.',
  },
  'Well-seasoned hardwood logs for optimal dryer temperature stability.': {
    ta: 'உலர்த்தி வெப்பநிலை நிலைத்தன்மைக்கான நன்கு உலர்ந்த மரக்கட்டைகள்.',
    ml: 'ഡ്രയർ താപനില സ്ഥിരതയ്ക്കായി ഉണങ്ങിയ വിറകുകൾ.',
  },
  'Pre-monsoon booster dose for cardamom clumps.': {
    ta: 'ஏலக்காய் தூறல்களுக்கான பருவமழைக்கு முந்தைய உர ஊட்டம்.',
    ml: 'ഏലം തടങ്ങൾക്ക് മൺസൂണിന് മുമ്പുള്ള ബൂസ്റ്റർ ഡോസ്.',
  },
  'Harvest labor group advance payout.': {
    ta: 'அறுவடை தொழிலாளர் குழு முன்பண பட்டுவாடா.',
    ml: 'വിളവെടുപ്പ് തൊഴിലാളി സംഘത്തിനുള്ള അഡ്വാൻസ് പേഔട്ട്.',
  },
};

const TITLE_TRANSLATIONS: Record<string, { ta: string; ml: string }> = {
  'Diesel for Cardamom Dryer Generator & Blower': {
    ta: 'ஏலக்காய் உலர்த்தி ஜெனரேட்டர் மற்றும் ப்ளோவருக்கான டீசல்',
    ml: 'ഏലം ഡ്രയർ ജനറേറ്ററിനും ബ്ലോവറിനുമുള്ള ഡീസൽ',
  },
  'Petrol for Brush Cutters & Power Sprayers': {
    ta: 'களை வெட்டி மற்றும் பவர் ஸ்ப்ரேயர்களுக்கான பெட்ரோல்',
    ml: 'ബ്രഷ് കട്ടറുകൾക്കും പവർ സ്പ്രേയറുകൾക്കുമുള്ള പെട്രോൾ',
  },
  'Engine Oil 20W40 for Generator & Pumps': {
    ta: 'ஜெனரேட்டர் மற்றும் பம்புகளுக்கான என்ஜின் ஆயில் 20W40',
    ml: 'ജനറേറ്ററുകൾക്കും പമ്പുകൾക്കുമുള്ള എഞ്ചിൻ ഓയിൽ 20W40',
  },
  'Dry Jungle Hardwood Logs for Curing Bhatti': {
    ta: 'உலர்த்தி பட்டிக்கு உலர்ந்த விறகுக் கட்டைகள்',
    ml: 'ക്യൂറിംഗ് ഭട്ടിക്കായി ഉണങ്ങിയ കാട്ടുതടി ലോഗുകൾ',
  },
  'DAP (18-46-0) + MOP Potash 5 Bags': {
    ta: 'DAP (18-46-0) + MOP பொட்டாஷ் 5 மூட்டைகள்',
    ml: 'DAP (18-46-0) + MOP പൊട്ടാഷ് 5 ചാക്കുകൾ',
  },
  'Boopathi Contractor Gang 1st Flush Advance': {
    ta: 'பூபதி ஒப்பந்ததாரர் குழு 1-வது பறிப்பு முன்பணம்',
    ml: 'ഭൂപതി കോൺട്രാക്ടർ ടീം ഒന്നാം ഫ്ലഷ് അഡ്വാൻസ്',
  },
};

function translateExpenseNote(note: string | undefined | null, language: Language): string {
  if (!note) return '';
  if (language === 'en') return note;

  const trimmed = note.trim();
  const exact = NOTE_TRANSLATIONS[trimmed];
  if (exact && exact[language]) {
    return exact[language];
  }

  if (trimmed.startsWith('Auto-logged from Visitors Log')) {
    const act = trimmed.split('Activity in field:')[1] || '';
    if (language === 'ta') {
      return `பார்வையாளர்கள் பதிவேட்டிலிருந்து தானாகப் பதிவு செய்யப்பட்டது.${act ? ` கள செயல்பாடு:${act}` : ''}`;
    }
    if (language === 'ml') {
      return `സന്ദർശക ലോഗിൽ നിന്ന് സ്വയമേവ രേഖപ്പെടുത്തി.${act ? ` ഫീൽഡ് പ്രവർത്തനം:${act}` : ''}`;
    }
  }

  if (trimmed.toLowerCase().includes('restocked expendable inventory')) {
    if (language === 'ta') return 'பயன்பாட்டு இருப்புப் பொருள் மீண்டும் நிரப்பப்பட்டது.';
    if (language === 'ml') return 'ഉപഭോഗ ഇൻവെന്ററി ഇനം വീണ്ടും സംഭരിച്ചു.';
  }

  return note;
}

function translateExpenseTitle(title: string, language: Language): string {
  if (!title || language === 'en') return title;
  const exact = TITLE_TRANSLATIONS[title.trim()];
  if (exact && exact[language]) {
    return exact[language];
  }
  return title;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  fuel: { bg: '#FEF3C7', text: '#B45309', icon: 'speedometer' },
  labor: { bg: '#EDE9FE', text: '#6D28D9', icon: 'people' },
  fertilizer: { bg: '#DCFCE7', text: '#15803D', icon: 'leaf' },
  chemicals: { bg: '#E0F2FE', text: '#0369A1', icon: 'flask' },
  maintenance: { bg: '#F3F4F6', text: '#374151', icon: 'build' },
  packaging: { bg: '#FFEDD5', text: '#C2410C', icon: 'cube' },
  curingRental: { bg: '#FEE2E2', text: '#B91C1C', icon: 'flame' },
  infrastructure: { bg: '#E0E7FF', text: '#4338CA', icon: 'construct' },
  adminMisc: { bg: '#F1F5F9', text: '#475569', icon: 'receipt' },
};

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  entry,
  onEdit,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();

  const catStyle = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.adminMisc;
  const formattedAmount = Number(entry.amount || 0).toLocaleString('en-IN');

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {/* Top Row: Date, Category Badge, Crop Tag, Actions */}
      <View style={styles.topRow}>
        <View style={styles.badgesLeft}>
          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: catStyle.bg }]}>
            <Ionicons name={catStyle.icon as any} size={12} color={catStyle.text} style={{ marginRight: 4 }} />
            <Text style={[styles.categoryText, { color: catStyle.text }]}>
              {t(entry.category as any) || entry.category}
            </Text>
          </View>

          {/* Fuel Sub-Type Pill */}
          {entry.category === 'fuel' && entry.fuelType && (
            <View style={[styles.fuelPill, { backgroundColor: '#FDE68A' }]}>
              <Text style={styles.fuelPillText}>
                {t(entry.fuelType as any) || entry.fuelType}
              </Text>
            </View>
          )}

          {/* Crop Badge */}
          {entry.cropId && entry.cropId !== 'all' && (
            <View style={[styles.cropBadge, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={[styles.cropBadgeText, { color: colors.textMuted }]}>
                {entry.cropId.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Edit & Delete Actions */}
        <View style={styles.actionsRight}>
          <TouchableOpacity
            onPress={() => onEdit(entry)}
            style={[styles.iconActionBtn, { backgroundColor: colors.surfaceSubtle }]}
            accessibilityLabel="Edit expense"
          >
            <Ionicons name="pencil" size={13} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(entry.id)}
            style={[styles.iconActionBtn, { backgroundColor: isDark ? '#3B1C1C' : '#FEE2E2' }]}
            accessibilityLabel="Delete expense"
          >
            <Ionicons name="trash-outline" size={13} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Middle: Title & Amount */}
      <View style={styles.middleRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {translateExpenseTitle(entry.title, language)}
          </Text>
          {entry.quantity ? (
            <Text style={[styles.qtyText, { color: colors.textMuted }]}>
              Qty: <Text style={{ fontWeight: '700', color: colors.text }}>{entry.quantity} {entry.unit || ''}</Text>
            </Text>
          ) : null}
        </View>

        <View style={styles.amountBox}>
          <Text style={[styles.amountText, { color: colors.text }]}>
            ₹{formattedAmount}
          </Text>
        </View>
      </View>

      {/* Bottom Meta: Purchased From, Bill No, Payment Mode, Date */}
      <View style={[styles.metaRow, { borderTopColor: colors.cardBorder }]}>
        <View style={styles.metaLeft}>
          <View style={styles.metaItem}>
            <Ionicons name="business-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
              {entry.purchasedFrom}
            </Text>
          </View>

          {entry.billNumber && (
            <View style={styles.metaItem}>
              <Ionicons name="receipt-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                {entry.billNumber}
              </Text>
            </View>
          )}

          {entry.billImageUri && (
            <View style={styles.metaItem}>
              <Ionicons name="attach" size={12} color="#059669" />
              <Text style={[styles.metaLabel, { color: '#059669', fontWeight: '700' }]}>
                Bill Attached
              </Text>
            </View>
          )}
        </View>

        <View style={styles.metaRight}>
          {/* Payment Mode Pill */}
          <View style={[styles.paymentModePill, { backgroundColor: colors.surfaceSubtle }]}>
            <Text style={[styles.paymentModeText, { color: colors.text }]}>
              {t(entry.paymentMode as any) || entry.paymentMode}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {entry.date}
          </Text>
        </View>
      </View>

      {/* Notes if present */}
      {entry.notes ? (
        <View style={[styles.notesBox, { backgroundColor: colors.surfaceSubtle }]}>
          <Text style={[styles.notesText, { color: colors.textMuted }]}>
            {translateExpenseNote(entry.notes, language)}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fuelPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fuelPillText: {
    color: '#78350F',
    fontSize: 10,
    fontWeight: '800',
  },
  cropBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cropBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  qtyText: {
    fontSize: 11,
    marginTop: 2,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 17,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentModePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paymentModeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  notesBox: {
    padding: 6,
    borderRadius: 6,
    marginTop: -2,
  },
  notesText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});
