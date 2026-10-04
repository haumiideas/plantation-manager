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
import { VisitorEntry, VisitorCategory, VisitorFinanceType } from '../../types/visitor';
import { PaymentMode } from '../../types/expense';
import { formatDate } from '../../utils/date';
import { ThemedDatePickerModal } from '../common/ThemedDatePickerModal';
import { ContactPickerModal } from '../common/ContactPickerModal';

interface LogVisitorModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: Omit<VisitorEntry, 'id' | 'createdAt'>) => void;
  editingEntry?: VisitorEntry | null;
  defaultFarmId?: string;
  orgId: string;
}

const VISITOR_CATEGORIES: {
  id: VisitorCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { id: 'field_consultant', label: 'Field Consultant', icon: 'ribbon', color: '#6366F1' },
  { id: 'chemical_rep', label: 'Chemical / Fertilizer Rep', icon: 'flask', color: '#EC4899' },
  { id: 'produce_buyer', label: 'Produce Buyer / Trader', icon: 'cart', color: '#F59E0B' },
  { id: 'tourist', label: 'Farm Tour / Tourist', icon: 'camera', color: '#14B8A6' },
  { id: 'educational', label: 'Educational / Student', icon: 'school', color: '#8B5CF6' },
  { id: 'govt_scientist', label: 'Govt / Spices Board', icon: 'shield-checkmark', color: '#3B82F6' },
  { id: 'waste_collector', label: 'Waste Collector / Rag Picker', icon: 'trash', color: '#64748B' },
  { id: 'other', label: 'Other Visitor', icon: 'person', color: '#94A3B8' },
];

export const LogVisitorModal: React.FC<LogVisitorModalProps> = ({
  visible,
  onClose,
  onSave,
  editingEntry,
  defaultFarmId = 'namari',
  orgId,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [farmId, setFarmId] = useState(defaultFarmId);
  const [date, setDate] = useState(formatDate());
  const [time, setTime] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState<VisitorCategory>('field_consultant');
  const [fieldActivity, setFieldActivity] = useState('');
  const [personsCount, setPersonsCount] = useState('1');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [financeType, setFinanceType] = useState<VisitorFinanceType>('none');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [transactionNotes, setTransactionNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingEntry) {
        setFarmId(editingEntry.farmId);
        setDate(editingEntry.date);
        setTime(editingEntry.time || '');
        setVisitorName(editingEntry.visitorName);
        setPhone(editingEntry.phone);
        setOrganization(editingEntry.organization || '');
        setAddress(editingEntry.address || '');
        setCategory(editingEntry.category);
        setFieldActivity(editingEntry.fieldActivity);
        setPersonsCount(editingEntry.personsCount ? String(editingEntry.personsCount) : '1');
        setVehicleNumber(editingEntry.vehicleNumber || '');
        setFinanceType(editingEntry.financeType);
        setAmount(editingEntry.amount ? String(editingEntry.amount) : '');
        setPaymentMode(editingEntry.paymentMode || 'upi');
        setTransactionNotes(editingEntry.transactionNotes || '');
        setNotes(editingEntry.notes || '');
      } else {
        setFarmId(defaultFarmId === 'consolidated' ? 'namari' : defaultFarmId);
        setDate(formatDate());
        const now = new Date();
        const timeStr = `${String(now.getHours() % 12 || 12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
        setTime(timeStr);
        setVisitorName('');
        setPhone('');
        setOrganization('');
        setAddress('');
        setCategory('field_consultant');
        setFieldActivity('');
        setPersonsCount('1');
        setVehicleNumber('');
        setFinanceType('none');
        setAmount('');
        setPaymentMode('upi');
        setTransactionNotes('');
        setNotes('');
      }
      setError('');
    }
  }, [visible, editingEntry, defaultFarmId]);

  const handleSave = () => {
    if (!visitorName.trim()) {
      setError('Please enter visitor name');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter contact phone number');
      return;
    }
    if (!fieldActivity.trim()) {
      setError('Please describe their activity in the field');
      return;
    }

    const parsedAmount = parseFloat(amount) || 0;
    if (financeType !== 'none' && parsedAmount <= 0) {
      setError('Please enter a valid amount for financial transaction');
      return;
    }

    onSave({
      orgId,
      farmId,
      date,
      time: time.trim() || undefined,
      visitorName: visitorName.trim(),
      phone: phone.trim(),
      organization: organization.trim() || undefined,
      address: address.trim() || undefined,
      category,
      fieldActivity: fieldActivity.trim(),
      personsCount: parseInt(personsCount, 10) || 1,
      vehicleNumber: vehicleNumber.trim() || undefined,
      financeType,
      amount: financeType !== 'none' ? parsedAmount : undefined,
      paymentMode: financeType !== 'none' ? paymentMode : undefined,
      transactionNotes: transactionNotes.trim() || undefined,
      notes: notes.trim() || undefined,
      linkedExpenseId: editingEntry?.linkedExpenseId,
      linkedIncomeId: editingEntry?.linkedIncomeId,
    });
    onClose();
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
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {editingEntry ? 'Edit Visitor Entry' : 'Log Field Visitor'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: '#EF444420' }]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Farm Selector Chips */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Estate Location *</Text>
            <View style={styles.chipRow}>
              {[
                { id: 'namari', label: 'Namari Estate' },
                { id: 'adukidathan', label: 'Adukidathan Farm' },
              ].map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setFarmId(f.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: farmId === f.id ? colors.primary : colors.surfaceSubtle,
                      borderColor: farmId === f.id ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: farmId === f.id ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date & Time Row */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Visit Date *</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[
                    styles.dateSelectBtn,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={[styles.dateText, { color: colors.text }]}>{date}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Time of Visit</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="e.g. 10:30 AM"
                  placeholderTextColor={colors.textMuted}
                  value={time}
                  onChangeText={setTime}
                />
              </View>
            </View>

            {/* Visitor Details Header with Contact Log Picker */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 12,
                marginBottom: 6,
              }}
            >
              <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 0 }]}>
                Visitor Profile *
              </Text>
              <TouchableOpacity
                onPress={() => setShowContactPicker(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: colors.surfaceSubtle,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <Ionicons name="people" size={13} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                  Select Contact (Phone / Log)
                </Text>
              </TouchableOpacity>

            </View>

            <View style={styles.row}>
              <View style={{ flex: 1.2 }}>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="Visitor Name *"
                  placeholderTextColor={colors.textMuted}
                  value={visitorName}
                  onChangeText={setVisitorName}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="Contact Phone *"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="Company / Institution / Org"
                  placeholderTextColor={colors.textMuted}
                  value={organization}
                  onChangeText={setOrganization}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="Location / Address"
                  placeholderTextColor={colors.textMuted}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>

            {/* Category Selector */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>
              Visitor Category *
            </Text>
            <View style={styles.chipRow}>
              {VISITOR_CATEGORIES.map((cat) => {
                const isSel = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSel ? cat.color : colors.surfaceSubtle,
                        borderColor: isSel ? cat.color : colors.cardBorder,
                      },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={13}
                      color={isSel ? '#FFFFFF' : cat.color}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSel ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Field Activity Description */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>
              Activity in the Field *
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: -2, marginBottom: 6 }}>
              Detail what they inspected, tested, purchased, toured, or collected in the field.
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
              ]}
              placeholder="e.g. Inspected cardamom canopy for shoot fly, sampled fresh picking, chemical spray demo, scrap metal clearance..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              value={fieldActivity}
              onChangeText={setFieldActivity}
            />

            {/* Persons & Vehicle */}
            <View style={styles.row}>
              <View style={{ flex: 0.8 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Party Size</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="Persons"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={personsCount}
                  onChangeText={setPersonsCount}
                />
              </View>
              <View style={{ flex: 1.2 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Vehicle Number</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="e.g. KL-06-E-1234"
                  placeholderTextColor={colors.textMuted}
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                />
              </View>
            </View>

            {/* Financial Transaction Section */}
            <View
              style={[
                styles.financeBox,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 4 }]}>
                Financial Transaction (Ledger Integration)
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>
                Auto-syncs costs paid to the Expense Tracker or receipts to the Income Tracker.
              </Text>

              {/* Finance Type Selector */}
              <View style={styles.financeTypeRow}>
                {[
                  { id: 'none', label: 'No Payment', icon: 'remove-circle-outline', color: '#64748B' },
                  { id: 'paid_expense', label: 'Paid to Visitor (Expense)', icon: 'arrow-down-circle', color: '#EF4444' },
                  { id: 'received_income', label: 'Received (Income)', icon: 'arrow-up-circle', color: '#10B981' },
                ].map((ft) => {
                  const isSel = financeType === ft.id;
                  return (
                    <TouchableOpacity
                      key={ft.id}
                      onPress={() => setFinanceType(ft.id as VisitorFinanceType)}
                      style={[
                        styles.financeTypeBtn,
                        {
                          backgroundColor: isSel ? ft.color + '20' : colors.card,
                          borderColor: isSel ? ft.color : colors.border,
                        },
                      ]}
                    >
                      <Ionicons name={ft.icon as any} size={15} color={isSel ? ft.color : colors.textMuted} />
                      <Text
                        style={[
                          styles.financeTypeBtnText,
                          { color: isSel ? ft.color : colors.text, fontWeight: isSel ? '700' : '500' },
                        ]}
                      >
                        {ft.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {financeType !== 'none' && (
                <View style={{ marginTop: 10, gap: 10 }}>
                  <View style={styles.row}>
                    <View style={{ flex: 1.2 }}>
                      <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                        Amount (₹) *
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                        ]}
                        placeholder="0.00"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                        value={amount}
                        onChangeText={setAmount}
                      />
                    </View>
                    <View style={{ flex: 1.2 }}>
                      <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                        Payment Mode
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                        {(['upi', 'cash', 'bank_transfer'] as const).map((pm) => (
                          <TouchableOpacity
                            key={pm}
                            onPress={() => setPaymentMode(pm)}
                            style={[
                              styles.payModeChip,
                              {
                                backgroundColor: paymentMode === pm ? colors.primary : colors.card,
                                borderColor: paymentMode === pm ? colors.primary : colors.border,
                              },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '700',
                                color: paymentMode === pm ? '#FFFFFF' : colors.text,
                                textTransform: 'uppercase',
                              }}
                            >
                              {pm === 'bank_transfer' ? 'Bank' : pm}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                    ]}
                    placeholder="Transaction remarks (e.g. Consult fee, scrap advance, tour tickets)"
                    placeholderTextColor={colors.textMuted}
                    value={transactionNotes}
                    onChangeText={setTransactionNotes}
                  />

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor:
                        financeType === 'paid_expense' ? '#FEE2E2' : '#DCFCE7',
                      padding: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color={financeType === 'paid_expense' ? '#DC2626' : '#16A34A'}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        color: financeType === 'paid_expense' ? '#991B1B' : '#166534',
                        flex: 1,
                      }}
                    >
                      {financeType === 'paid_expense'
                        ? 'Will automatically add a payment entry to the Expense Tracker.'
                        : 'Will automatically add a receipt entry to the Income Tracker.'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* General Notes */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>General Notes</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
              ]}
              placeholder="e.g. Next visit scheduled next month, trial report awaited"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
            />

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.saveBtnText}>
                  {editingEntry ? 'Update Visitor Entry' : 'Save Visitor Entry'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      <ThemedDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={date}
        onSelectDate={setDate}
        title="Select Visit Date"
      />

      <ContactPickerModal
        visible={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        orgId={orgId}
        title="Load Visitor from Contact Log"
        onSelectContact={(c) => {
          if (c.name) setVisitorName(c.name);
          if (c.phone) setPhone(c.phone);
          if (c.companyOrOrg) setOrganization(c.companyOrOrg);
          if (c.address) setAddress(c.address);
          if (c.category) {
            const mappedCat: VisitorCategory =
              c.category === 'trader'
                ? 'produce_buyer'
                : c.category === 'consultant'
                ? 'field_consultant'
                : c.category === 'chemical_rep'
                ? 'chemical_rep'
                : c.category === 'govt_scientist'
                ? 'govt_scientist'
                : c.category === 'waste_collector'
                ? 'waste_collector'
                : c.category === 'tourist'
                ? 'tourist'
                : c.category === 'educational'
                ? 'educational'
                : 'other';
            setCategory(mappedCat);
          }
        }}
      />
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
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  scrollBody: {
    maxHeight: 520,
  },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  textArea: {
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  financeBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 10,
  },
  financeTypeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  financeTypeBtn: {
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
  financeTypeBtnText: {
    fontSize: 10,
    textAlign: 'center',
  },
  payModeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
