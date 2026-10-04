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
import { FarmId, FARM_OPTIONS } from '../../types/farm';
import { CuringBatch, DryerType } from '../../types/harvest';
import { formatDate } from '../../utils/date';
import { getCustomDryerChambers, addCustomDryerChamber } from '../../services/harvestService';
import { ThemedDatePickerModal } from '../common/ThemedDatePickerModal';
import { ContactPickerModal } from '../common/ContactPickerModal';
import { upsertContactFromPartyOrVisitor } from '../../services/contactService';
import { logAuditEvent } from '../../services/auditService';

interface NewCuringBatchModalProps {
  visible: boolean;
  onClose: () => void;
  defaultFarmId?: FarmId;
  defaultBenchmark: number;
  batchToEdit?: CuringBatch | null;
  onCreateBatch: (
    batchData: Omit<
      CuringBatch,
      'id' | 'createdAt' | 'status' | 'firingLogs' | 'totalFirewoodConsumed'
    >
  ) => void;
  onUpdateBatch?: (batch: CuringBatch) => void;
}

export const NewCuringBatchModal: React.FC<NewCuringBatchModalProps> = ({
  visible,
  onClose,
  defaultFarmId = 'namari',
  defaultBenchmark = 20.0,
  batchToEdit,
  onCreateBatch,
  onUpdateBatch,
}) => {
  const { colors, isDark } = useTheme();
  const isEditing = Boolean(batchToEdit);

  const [farmId, setFarmId] = useState<FarmId>(
    defaultFarmId === 'consolidated' ? 'namari' : defaultFarmId
  );
  const [seasonYear, setSeasonYear] = useState('2026-27');
  const [dryerType, setDryerType] = useState<DryerType>('own');
  const [ownChamberName, setOwnChamberName] = useState('');
  const [chambersList, setChambersList] = useState<string[]>([]);
  const [newChamberText, setNewChamberText] = useState('');
  const [showAddChamberInput, setShowAddChamberInput] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const [rentedDryerName, setRentedDryerName] = useState('');
  const [rentedContact, setRentedContact] = useState('');
  const [rentalCostPerKg, setRentalCostPerKg] = useState('');

  // Rental Client / Party Details
  const [partyName, setPartyName] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyAddress, setPartyAddress] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('pending');

  const [greenWeight, setGreenWeight] = useState('');
  const [ripenedFruitLoaded, setRipenedFruitLoaded] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [benchmark, setBenchmark] = useState(String(defaultBenchmark));
  const [loadDate, setLoadDate] = useState('');
  const [runningDays, setRunningDays] = useState('1.5');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      const loadChambers = async () => {
        const loaded = await getCustomDryerChambers('plantation_org_namari_adukidathan');
        setChambersList(loaded);
        if (!batchToEdit && loaded.length > 0) {
          setOwnChamberName(loaded[0]);
        }
      };
      loadChambers();

      if (batchToEdit) {
        setFarmId(batchToEdit.farmId);
        setSeasonYear(batchToEdit.seasonYear || '2026-27');
        setDryerType(batchToEdit.dryerType);
        if (batchToEdit.dryerType === 'own') {
          setOwnChamberName(batchToEdit.dryerName);
        } else {
          setRentedDryerName(batchToEdit.dryerName);
          setRentedContact(batchToEdit.rentedDryerContact || '');
          setRentalCostPerKg(batchToEdit.rentalCostPerKg ? String(batchToEdit.rentalCostPerKg) : '');
          setPartyName(batchToEdit.partyName || '');
          setPartyPhone(batchToEdit.partyPhone || batchToEdit.rentedDryerContact || '');
          setPartyAddress(batchToEdit.partyAddress || '');
          setPaymentStatus(batchToEdit.paymentStatus || 'pending');
        }
        setGreenWeight(String(batchToEdit.greenWeightKg));
        setRipenedFruitLoaded(batchToEdit.ripenedFruitLoadedKg ? String(batchToEdit.ripenedFruitLoadedKg) : '');
        setBenchmark(String(batchToEdit.benchmarkOutturnPercentage));
        setLoadDate(batchToEdit.loadDate);
        setRunningDays(String(batchToEdit.runningDays || 1.5));
        setNotes(batchToEdit.notes || '');
      } else {
        setFarmId(defaultFarmId === 'consolidated' ? 'namari' : defaultFarmId);
        setDryerType('own');
        setOwnChamberName('');
        setRentedDryerName('');
        setRentedContact('');
        setRentalCostPerKg('');
        setPartyName('');
        setPartyPhone('');
        setPartyAddress('');
        setPaymentStatus('pending');
        setGreenWeight('');
        setRipenedFruitLoaded('');
        setBenchmark(String(defaultBenchmark));
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setLoadDate(`${formatDate()} ${timeStr}`);
        setRunningDays('1.5');
        setNotes('');
      }
      setError('');
    }
  }, [visible, defaultFarmId, defaultBenchmark, batchToEdit]);

  const handleSave = () => {
    const weight = parseFloat(greenWeight);
    if (!weight || weight <= 0) {
      setError('Please enter valid green cardamom loaded weight in kg');
      return;
    }

    const facilityName =
      dryerType === 'own'
        ? ownChamberName.trim() || 'Estate Dryer Chamber'
        : (rentedDryerName.trim() || partyName.trim() || 'Commercial Dryer');

    if (dryerType === 'rented' && !facilityName) {
      setError('Please enter the Dryer Name or Customer Name');
      return;
    }

    const ripeWeight = parseFloat(ripenedFruitLoaded) || undefined;

    const batchPayload = {
      orgId: 'plantation_org_namari_adukidathan',
      farmId,
      seasonYear,
      dryerType,
      dryerName: facilityName,
      rentedDryerContact: dryerType === 'rented' ? (partyPhone.trim() || rentedContact.trim() || undefined) : undefined,
      rentalCostPerKg: dryerType === 'rented' ? parseFloat(rentalCostPerKg) || undefined : undefined,
      partyName: dryerType === 'rented' ? partyName.trim() || undefined : undefined,
      partyPhone: dryerType === 'rented' ? (partyPhone.trim() || rentedContact.trim() || undefined) : undefined,
      partyAddress: dryerType === 'rented' ? partyAddress.trim() || undefined : undefined,
      paymentStatus: dryerType === 'rented' ? paymentStatus : undefined,
      greenWeightKg: weight,
      ripenedFruitLoadedKg: ripeWeight,
      loadDate,
      benchmarkOutturnPercentage: parseFloat(benchmark) || 20.0,
      notes: notes.trim() || undefined,
      runningDays: parseFloat(runningDays) || 1.0,
      fuelConsumed: batchToEdit?.fuelConsumed || {
        firewoodBundles: 0,
        dieselLiters: 0,
        petrolLiters: 0,
        engineOilLiters: 0,
      },
    };

    if (dryerType === 'rented' && partyName.trim() && partyPhone.trim()) {
      upsertContactFromPartyOrVisitor(
        'plantation_org_namari_adukidathan',
        partyName.trim(),
        partyPhone.trim(),
        partyAddress.trim() || undefined,
        'party_client'
      );
    }

    if (isEditing && batchToEdit && onUpdateBatch) {
      onUpdateBatch({
        ...batchToEdit,
        ...batchPayload,
      });
      logAuditEvent({
        orgId: 'plantation_org_namari_adukidathan',
        performedByUid: 'user_local',
        performedByName: 'Supervisor',
        action: 'update',
        entityType: 'curing',
        title: 'Curing Batch Updated',
        details: `${batchToEdit.id} (${batchPayload.dryerName}) - ${batchPayload.greenWeightKg} kg Green Cardamom`,
      });
    } else {
      onCreateBatch(batchPayload);
      logAuditEvent({
        orgId: 'plantation_org_namari_adukidathan',
        performedByUid: 'user_local',
        performedByName: 'Supervisor',
        action: 'create',
        entityType: 'curing',
        title: 'New Curing Batch Started',
        details: `${batchPayload.dryerName} (${batchPayload.greenWeightKg} kg Green) at ${farmId.toUpperCase()}`,
      });
    }

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
              <Ionicons name="flame" size={22} color="#D97706" />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isEditing ? 'Edit Cardamom Curing Batch' : 'New Cardamom Curing Batch'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: '#EF444420' }]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Farm Selector */}
            <Text style={[styles.label, { color: colors.text }]}>Plantation Division</Text>
            <View style={styles.farmRow}>
              {FARM_OPTIONS.filter((f) => f.id !== 'consolidated').map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setFarmId(f.id)}
                  style={[
                    styles.chip,
                    {
                      borderColor: farmId === f.id ? '#D97706' : colors.border,
                      backgroundColor:
                        farmId === f.id
                          ? isDark
                            ? '#78350F'
                            : '#FEF3C7'
                          : colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: farmId === f.id ? '#D97706' : colors.textMuted,
                        fontWeight: farmId === f.id ? '700' : '500',
                      },
                    ]}
                  >
                    {f.label} ({f.shortCode})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Dryer Facility Type */}
            <Text style={[styles.label, { color: colors.text }]}>Dryer Facility</Text>
            <View style={[styles.dryerToggle, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => setDryerType('own')}
                style={[
                  styles.dryerOption,
                  dryerType === 'own' && {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Ionicons
                  name="home"
                  size={15}
                  color={dryerType === 'own' ? '#FFFFFF' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.dryerOptionText,
                    { color: dryerType === 'own' ? '#FFFFFF' : colors.text },
                  ]}
                >
                  Own Dryer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDryerType('rented')}
                style={[
                  styles.dryerOption,
                  dryerType === 'rented' && {
                    backgroundColor: '#D97706',
                  },
                ]}
              >
                <Ionicons
                  name="business"
                  size={15}
                  color={dryerType === 'rented' ? '#FFFFFF' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.dryerOptionText,
                    { color: dryerType === 'rented' ? '#FFFFFF' : colors.text },
                  ]}
                >
                  Rented Dryer
                </Text>
              </TouchableOpacity>
            </View>

            {/* OWN DRYER CHAMBER SELECTOR */}
            {dryerType === 'own' ? (
              <View style={styles.ownChamberBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                    Dryer Chamber *
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAddChamberInput((prev) => !prev)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Ionicons name="add-circle" size={15} color={colors.primary} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                      + Add Chamber
                    </Text>
                  </TouchableOpacity>
                </View>

                {showAddChamberInput && (
                  <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
                    <TextInput
                      style={[
                        styles.input,
                        { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                      ]}
                      placeholder="e.g. Chamber 1, Upper Shed Chamber"
                      placeholderTextColor={colors.textMuted}
                      value={newChamberText}
                      onChangeText={setNewChamberText}
                    />
                    <TouchableOpacity
                      onPress={async () => {
                        if (!newChamberText.trim()) return;
                        const added = newChamberText.trim();
                        const updated = await addCustomDryerChamber('plantation_org_namari_adukidathan', added);
                        setChambersList(updated);
                        setOwnChamberName(added);
                        setNewChamberText('');
                        setShowAddChamberInput(false);
                      }}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 14,
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>Save</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {chambersList.length === 0 ? (
                  <View style={[styles.emptyChamberBox, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                    <Text style={[styles.emptyChamberText, { color: colors.textMuted }]}>
                      No chambers added yet. Tap '+ Add Chamber' above to register your estate dryer.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.chamberRow}>
                    {chambersList.map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setOwnChamberName(c)}
                        style={[
                          styles.chamberChip,
                          {
                            borderColor: ownChamberName === c ? colors.primary : colors.border,
                            backgroundColor:
                              ownChamberName === c
                                ? isDark
                                  ? '#1B3D2F'
                                  : '#DCFCE7'
                                : colors.background,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color:
                                ownChamberName === c
                                  ? isDark
                                    ? colors.primaryLight
                                    : colors.primary
                                  : colors.textMuted,
                              fontWeight: ownChamberName === c ? '700' : '500',
                            },
                          ]}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              /* RENTED DRYER & PARTY DETAILS */
              <View style={styles.rentedBox}>
                <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                  Dryer Facility / Commercial House Name *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="e.g. Mani Commercial Dryer, Vandiperiyar"
                  placeholderTextColor={colors.textMuted}
                  value={rentedDryerName}
                  onChangeText={setRentedDryerName}
                />

                {/* Rental Client / Party Details Header with Contact Log Picker */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 6 }}>
                  <Text style={[styles.subLabel, { color: colors.textMuted, marginBottom: 0, fontWeight: '700' }]}>
                    Rental Client / Party Details
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowContactPicker(true)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: colors.surfaceSubtle,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
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

                <View style={styles.rowTwoCols}>
                  <View style={styles.col}>
                    <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                      Party / Customer Name
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                      ]}
                      placeholder="e.g. K.R. Ramanathan"
                      placeholderTextColor={colors.textMuted}
                      value={partyName}
                      onChangeText={setPartyName}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                      Contact Phone
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                      ]}
                      placeholder="e.g. +91 94470..."
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      value={partyPhone}
                      onChangeText={setPartyPhone}
                    />
                  </View>
                </View>

                <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                  Address / Location
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="e.g. Vandiperiyar Road, Kumily"
                  placeholderTextColor={colors.textMuted}
                  value={partyAddress}
                  onChangeText={setPartyAddress}
                />

                <View style={styles.rowTwoCols}>
                  <View style={styles.col}>
                    <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                      Rental Fee (₹/kg)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                      ]}
                      placeholder="e.g. 12"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      value={rentalCostPerKg}
                      onChangeText={setRentalCostPerKg}
                    />
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                      Paid Status
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                      {(['paid', 'pending', 'partial'] as const).map((st) => {
                        const isSel = paymentStatus === st;
                        const badgeColor =
                          st === 'paid' ? '#10B981' : st === 'pending' ? '#F59E0B' : '#3B82F6';
                        return (
                          <TouchableOpacity
                            key={st}
                            onPress={() => setPaymentStatus(st)}
                            style={[
                              styles.payStatusChip,
                              {
                                borderColor: isSel ? badgeColor : colors.border,
                                backgroundColor: isSel
                                  ? isDark
                                    ? badgeColor + '30'
                                    : badgeColor + '20'
                                  : colors.background,
                              },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: isSel ? '800' : '600',
                                color: isSel ? badgeColor : colors.textMuted,
                                textTransform: 'capitalize',
                              }}
                            >
                              {st}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Fresh Green Weight Loaded */}
            <Text style={[styles.label, { color: colors.text }]}>
              Fresh Green Cardamom (kg) *
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: -2, marginBottom: 6 }}>
              Fresh raw green cardamom capsules harvested from the field loaded onto standard dryer tiers.
            </Text>
            <View style={styles.weightInputWrapper}>
              <TextInput
                style={[
                  styles.weightInput,
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="e.g. 950.0"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={greenWeight}
                onChangeText={setGreenWeight}
              />
              <Text style={[styles.weightUnitSuffix, { color: colors.primary }]}>kg (Fresh)</Text>
            </View>

            {/* Ripened Fruit / Cardamom Fruit (Dried Separately with Separator) */}
            <View style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="layers" size={16} color="#D97706" />
                <Text style={[styles.label, { color: colors.text, marginTop: 0, marginBottom: 0 }]}>
                  Ripened Fruit / Separator Tray (kg)
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2, marginBottom: 6 }}>
                Yellow/red cardamom fruit separated and dried with separator tray for independent recovery calculation.
              </Text>
              <View style={styles.weightInputWrapper}>
                <TextInput
                  style={[
                    styles.weightInput,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="e.g. 45.0 (Optional)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={ripenedFruitLoaded}
                  onChangeText={setRipenedFruitLoaded}
                />
                <Text style={[styles.weightUnitSuffix, { color: '#D97706' }]}>kg (Ripe)</Text>
              </View>
            </View>

            {/* Benchmark Outturn % */}
            <View style={styles.rowTwoCols}>
              <View style={styles.col}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Benchmark Outturn %
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="20.0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={benchmark}
                  onChangeText={setBenchmark}
                />
              </View>

              <View style={styles.col}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Drying Days
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="1.5"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={runningDays}
                  onChangeText={setRunningDays}
                />
              </View>
            </View>

            {/* Load Date/Time with Date Picker */}
            <Text style={[styles.label, { color: colors.text }]}>Loaded Date & Time</Text>
            <TouchableOpacity
              onPress={() => setIsDatePickerVisible(true)}
              style={[
                styles.dateTriggerBtn,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Ionicons name="calendar-outline" size={16} color="#D97706" />
              <Text style={[styles.dateTriggerText, { color: colors.text }]}>
                {loadDate || 'Select Date'}
              </Text>
            </TouchableOpacity>

            {/* Operational Notes */}
            <Text style={[styles.label, { color: colors.text }]}>Operational Notes</Text>
            <TextInput
              style={[
                styles.notesInput,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="e.g. Fired with seasoned dry silver-oak firewood, rain during picking"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.btnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: '#D97706' }]}
              >
                <Text style={styles.saveBtnText}>
                  {isEditing ? 'Update Curing Batch' : 'Start Curing Cycle'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      <ThemedDatePickerModal
        visible={isDatePickerVisible}
        onClose={() => setIsDatePickerVisible(false)}
        selectedDate={loadDate}
        onSelectDate={(formattedDate) => {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          setLoadDate(`${formattedDate} ${timeStr}`);
        }}
        title="Select Loaded Date"
      />

      <ContactPickerModal
        visible={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        orgId="plantation_org_namari_adukidathan"
        title="Load Party from Contact Log"
        defaultCategory="party_client"
        onSelectContact={(c) => {
          if (c.name) setPartyName(c.name);
          if (c.phone) setPartyPhone(c.phone);
          if (c.address) setPartyAddress(c.address);
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
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  body: {
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
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  subLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  farmRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
  },
  dryerToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    marginTop: 2,
    marginBottom: 6,
  },
  dryerOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dryerOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ownChamberBox: {
    marginTop: 4,
    marginBottom: 4,
  },
  chamberRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chamberChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  rentedBox: {
    marginTop: 4,
    gap: 6,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  col: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  weightInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 22,
    fontWeight: '800',
  },
  weightUnitSuffix: {
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 45,
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
  dateTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dateTriggerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyChamberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  emptyChamberText: {
    fontSize: 12,
    flex: 1,
  },
  payStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
});
