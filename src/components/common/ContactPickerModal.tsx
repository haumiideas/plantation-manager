import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts/legacy';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { EstateContact, ContactCategory } from '../../types/contact';
import { getEstateContacts, saveEstateContact, deleteEstateContact } from '../../services/contactService';

type ContactSourceTab = 'app_log' | 'device_phone' | 'manual_input';

interface ContactPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectContact: (contact: {
    name: string;
    phone: string;
    address?: string;
    companyOrOrg?: string;
    category?: ContactCategory;
  }) => void;
  orgId: string;
  title?: string;
  defaultCategory?: ContactCategory;
}

const CATEGORY_META: Record<
  ContactCategory,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  party_client: { label: 'Curing Client', icon: 'business', color: '#10B981' },
  trader: { label: 'Produce Trader', icon: 'cart', color: '#F59E0B' },
  consultant: { label: 'Field Consultant', icon: 'ribbon', color: '#6366F1' },
  chemical_rep: { label: 'Chemical / Fertilizer Rep', icon: 'flask', color: '#EC4899' },
  tourist: { label: 'Farm Tour / Tourist', icon: 'camera', color: '#14B8A6' },
  educational: { label: 'Educational / Student', icon: 'school', color: '#8B5CF6' },
  govt_scientist: { label: 'Govt / Spices Board', icon: 'shield-checkmark', color: '#3B82F6' },
  waste_collector: { label: 'Scrap / Waste Collector', icon: 'trash', color: '#64748B' },
  contractor: { label: 'Labor Contractor', icon: 'people', color: '#F97316' },
  supplier: { label: 'Hardware / Store', icon: 'hammer', color: '#06B6D4' },
  other: { label: 'Other Contact', icon: 'person', color: '#94A3B8' },
};

export const ContactPickerModal: React.FC<ContactPickerModalProps> = ({
  visible,
  onClose,
  onSelectContact,
  orgId,
  title = 'Pick Contact (Phone / App Log)',
  defaultCategory,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<ContactSourceTab>('app_log');

  // App Directory state
  const [contacts, setContacts] = useState<EstateContact[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<ContactCategory | 'all'>(
    defaultCategory || 'all'
  );

  // Phone Contacts state
  const [deviceContacts, setDeviceContacts] = useState<Contacts.Contact[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoadingPhoneContacts, setIsLoadingPhoneContacts] = useState(false);

  // Manual Input state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newOrg, setNewOrg] = useState('');
  const [newCategory, setNewCategory] = useState<ContactCategory>(
    defaultCategory || 'party_client'
  );

  useEffect(() => {
    if (visible) {
      loadAppContacts();
      setSearch('');
      if (activeTab === 'device_phone') {
        loadDevicePhoneContacts();
      }
    }
  }, [visible, orgId, activeTab]);

  const loadAppContacts = async () => {
    const list = await getEstateContacts(orgId);
    setContacts(list);
  };

  const loadDevicePhoneContacts = async () => {
    setIsLoadingPhoneContacts(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        setHasPermission(true);
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Emails,
            Contacts.Fields.Addresses,
            Contacts.Fields.Company,
          ],
        });
        const valid = (data || []).filter(
          (c) => c.name && c.phoneNumbers && c.phoneNumbers.length > 0
        );
        setDeviceContacts(valid);
      } else {
        setHasPermission(false);
      }
    } catch {
      setHasPermission(false);
    } finally {
      setIsLoadingPhoneContacts(false);
    }
  };

  // Filter App Contacts
  const filteredAppContacts = contacts.filter((c) => {
    const matchesCategory =
      selectedFilter === 'all' || c.category === selectedFilter;
    const q = search.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.companyOrOrg && c.companyOrOrg.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  // Filter Device Contacts
  const filteredDeviceContacts = deviceContacts.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = c.name ? c.name.toLowerCase().includes(q) : false;
    const phoneMatch = c.phoneNumbers?.some((p) => p.number?.includes(q)) || false;
    const companyMatch = c.company ? c.company.toLowerCase().includes(q) : false;
    return nameMatch || phoneMatch || companyMatch;
  });

  const handleSelectAppContact = (c: EstateContact) => {
    onSelectContact({
      name: c.name,
      phone: c.phone,
      address: c.address,
      companyOrOrg: c.companyOrOrg,
      category: c.category,
    });
    onClose();
  };

  const handleSelectDeviceContact = async (c: Contacts.Contact) => {
    const primaryPhone = c.phoneNumbers?.[0]?.number || '';
    const cleanPhone = primaryPhone.replace(/[\s-]/g, '');
    const addr = c.addresses?.[0]
      ? `${c.addresses[0].city || ''} ${c.addresses[0].region || ''}`.trim()
      : undefined;

    // Cache to App Directory for instant reuse
    try {
      await saveEstateContact(orgId, {
        orgId,
        name: c.name || 'Unnamed',
        phone: cleanPhone,
        address: addr,
        companyOrOrg: c.company || undefined,
        category: defaultCategory || 'party_client',
      });
    } catch {
      // ignore
    }

    onSelectContact({
      name: c.name || 'Unnamed',
      phone: cleanPhone,
      address: addr,
      companyOrOrg: c.company || undefined,
      category: defaultCategory || 'party_client',
    });
    onClose();
  };

  const handleSaveManualContact = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    const created = await saveEstateContact(orgId, {
      orgId,
      name: newName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim() || undefined,
      companyOrOrg: newOrg.trim() || undefined,
      category: newCategory,
    });
    setContacts((prev) => [created, ...prev]);
    onSelectContact({
      name: created.name,
      phone: created.phone,
      address: created.address,
      companyOrOrg: created.companyOrOrg,
      category: created.category,
    });
    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setNewOrg('');
    onClose();
  };

  const handleDeleteContact = async (contactId: string) => {
    await deleteEstateContact(orgId, contactId);
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
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
              <Ionicons name="call" size={20} color={colors.primary} />
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  Pick from Phone, Saved App Log, or Input Directly
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

          {/* Source Tabs */}
          <View style={[styles.tabBar, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
            <TouchableOpacity
              onPress={() => setActiveTab('app_log')}
              style={[
                styles.tabBtn,
                activeTab === 'app_log' && [styles.tabBtnActive, { backgroundColor: colors.card }],
              ]}
            >
              <Ionicons
                name="folder-open"
                size={14}
                color={activeTab === 'app_log' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'app_log' ? colors.primary : colors.textMuted },
                ]}
              >
                App Directory ({contacts.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveTab('device_phone');
                if (hasPermission === null) {
                  loadDevicePhoneContacts();
                }
              }}
              style={[
                styles.tabBtn,
                activeTab === 'device_phone' && [styles.tabBtnActive, { backgroundColor: colors.card }],
              ]}
            >
              <Ionicons
                name="phone-portrait"
                size={14}
                color={activeTab === 'device_phone' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'device_phone' ? colors.primary : colors.textMuted },
                ]}
              >
                Phone Contacts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('manual_input')}
              style={[
                styles.tabBtn,
                activeTab === 'manual_input' && [styles.tabBtnActive, { backgroundColor: colors.card }],
              ]}
            >
              <Ionicons
                name="person-add"
                size={14}
                color={activeTab === 'manual_input' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'manual_input' ? colors.primary : colors.textMuted },
                ]}
              >
                Manual Input
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar for App Log & Device Phone */}
          {activeTab !== 'manual_input' && (
            <View
              style={[
                styles.searchBox,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Ionicons name="search" size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={
                  activeTab === 'app_log'
                    ? 'Search saved clients, buyers, consultants...'
                    : 'Search device contacts by name or phone...'
                }
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* TAB 1: APP DIRECTORY */}
          {activeTab === 'app_log' && (
            <>
              {/* Category Filter Chips */}
              <View style={styles.filtersScroll}>
                <TouchableOpacity
                  onPress={() => setSelectedFilter('all')}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selectedFilter === 'all' ? colors.primary : colors.surfaceSubtle,
                      borderColor: selectedFilter === 'all' ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selectedFilter === 'all' ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    All ({contacts.length})
                  </Text>
                </TouchableOpacity>

                {(Object.keys(CATEGORY_META) as ContactCategory[]).map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const count = contacts.filter((c) => c.category === cat).length;
                  if (count === 0 && selectedFilter !== cat) return null;
                  const isSel = selectedFilter === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedFilter(cat)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isSel ? meta.color : colors.surfaceSubtle,
                          borderColor: isSel ? meta.color : colors.cardBorder,
                        },
                      ]}
                    >
                      <Ionicons
                        name={meta.icon}
                        size={12}
                        color={isSel ? '#FFFFFF' : meta.color}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: isSel ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {meta.label} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Contacts List */}
              <FlatList
                data={filteredAppContacts}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <Ionicons name="people-outline" size={36} color={colors.textMuted} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                      No contacts found
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                      Switch to 'Phone Contacts' to pick from your device or use 'Manual Input'.
                    </Text>
                    <TouchableOpacity
                      onPress={() => setActiveTab('manual_input')}
                      style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                        + Add Contact Manually
                      </Text>
                    </TouchableOpacity>
                  </View>
                }
                renderItem={({ item }) => {
                  const meta = CATEGORY_META[item.category] || CATEGORY_META.other;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSelectAppContact(item)}
                      style={[
                        styles.contactCard,
                        { backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    >
                      <View style={[styles.catIconWrap, { backgroundColor: `${meta.color}20` }]}>
                        <Ionicons name={meta.icon} size={18} color={meta.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.contactName, { color: colors.text }]}>
                            {item.name}
                          </Text>
                          <View
                            style={[
                              styles.catBadge,
                              { backgroundColor: `${meta.color}15`, borderColor: `${meta.color}30` },
                            ]}
                          >
                            <Text style={[styles.catBadgeText, { color: meta.color }]}>
                              {meta.label}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.contactPhone, { color: colors.textMuted }]}>
                          📞 {item.phone}
                        </Text>
                        {(item.companyOrOrg || item.address) && (
                          <Text style={[styles.contactOrg, { color: colors.textMuted }]} numberOfLines={1}>
                            {[item.companyOrOrg, item.address].filter(Boolean).join(' • ')}
                          </Text>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <TouchableOpacity
                          onPress={() => handleDeleteContact(item.id)}
                          style={{ padding: 6 }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        </TouchableOpacity>
                        <View style={[styles.selectBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.selectBadgeText}>Select</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </>
          )}

          {/* TAB 2: DEVICE PHONE CONTACTS */}
          {activeTab === 'device_phone' && (
            <View style={{ flex: 1 }}>
              {isLoadingPhoneContacts ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                    Accessing device phonebook...
                  </Text>
                </View>
              ) : hasPermission === false ? (
                <View style={styles.permissionBox}>
                  <Ionicons name="shield-outline" size={44} color={colors.accent} />
                  <Text style={[styles.permTitle, { color: colors.text }]}>
                    Phone Contacts Permission Needed
                  </Text>
                  <Text style={[styles.permDesc, { color: colors.textMuted }]}>
                    Grant contacts permission so you can load contacts directly from your phone address book into Farmag App.
                  </Text>
                  <TouchableOpacity
                    onPress={loadDevicePhoneContacts}
                    style={[styles.grantBtn, { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="key-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.grantBtnText}>Grant Contacts Access</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setActiveTab('manual_input')}
                    style={[styles.secondaryBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                      Enter Contact Manually Instead
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={filteredDeviceContacts}
                  keyExtractor={(item, index) => (item as any).id || item.name || String(index)}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                  ListEmptyComponent={
                    <View style={styles.emptyBox}>
                      <Ionicons name="search-outline" size={36} color={colors.textMuted} />
                      <Text style={[styles.emptyTitle, { color: colors.text }]}>
                        No matching phone contacts
                      </Text>
                      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                        Try searching by first name, last name, or number.
                      </Text>
                    </View>
                  }
                  renderItem={({ item }) => {
                    const phone = item.phoneNumbers?.[0]?.number || 'No phone';
                    return (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleSelectDeviceContact(item)}
                        style={[
                          styles.contactCard,
                          { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                      >
                        <View style={[styles.catIconWrap, { backgroundColor: '#10B98120' }]}>
                          <Ionicons name="person" size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.contactName, { color: colors.text }]}>
                            {item.name || 'Unnamed Contact'}
                          </Text>
                          <Text style={[styles.contactPhone, { color: colors.textMuted }]}>
                            📱 {phone}
                          </Text>
                          {item.company ? (
                            <Text style={[styles.contactOrg, { color: colors.textMuted }]} numberOfLines={1}>
                              🏢 {item.company}
                            </Text>
                          ) : null}
                        </View>
                        <View style={[styles.selectBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.selectBadgeText}>Load</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>
          )}

          {/* TAB 3: MANUAL INPUT */}
          {activeTab === 'manual_input' && (
            <FlatList
              data={[1]}
              keyExtractor={() => 'form'}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, paddingTop: 10 }}
              renderItem={() => (
                <View
                  style={[
                    styles.newFormBox,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.formSubhead, { color: colors.text }]}>
                    New Contact Profile
                  </Text>
                  <Text style={[styles.formSubtitle, { color: colors.textMuted }]}>
                    Enter party details below. Saved contacts are stored in the Estate Directory for 1-tap reuse.
                  </Text>

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                    ]}
                    placeholder="e.g. Mani Commercial Dryer or S. Ramanathan"
                    placeholderTextColor={colors.textMuted}
                    value={newName}
                    onChangeText={setNewName}
                  />

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                    ]}
                    placeholder="e.g. +91 94470 12345"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    value={newPhone}
                    onChangeText={setNewPhone}
                  />

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Organization / Company</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                    ]}
                    placeholder="e.g. Munnar Spices Syndicate / Agri University"
                    placeholderTextColor={colors.textMuted}
                    value={newOrg}
                    onChangeText={setNewOrg}
                  />

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Address / Location</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                    ]}
                    placeholder="e.g. Vandanmedu, Idukki"
                    placeholderTextColor={colors.textMuted}
                    value={newAddress}
                    onChangeText={setNewAddress}
                  />

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
                  <View style={styles.catChipsRow}>
                    {(Object.keys(CATEGORY_META) as ContactCategory[]).map((cat) => {
                      const meta = CATEGORY_META[cat];
                      const isSel = newCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setNewCategory(cat)}
                          style={[
                            styles.catSelectChip,
                            {
                              backgroundColor: isSel ? meta.color : colors.surfaceSubtle,
                              borderColor: isSel ? meta.color : colors.cardBorder,
                            },
                          ]}
                        >
                          <Ionicons
                            name={meta.icon}
                            size={12}
                            color={isSel ? '#FFFFFF' : meta.color}
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={[
                              styles.catSelectChipText,
                              { color: isSel ? '#FFFFFF' : colors.text },
                            ]}
                          >
                            {meta.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    onPress={handleSaveManualContact}
                    disabled={!newName.trim() || !newPhone.trim()}
                    style={[
                      styles.saveContactBtn,
                      {
                        backgroundColor:
                          newName.trim() && newPhone.trim() ? colors.primary : colors.textMuted,
                      },
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.saveContactBtnText}>Save & Select Contact</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
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
    height: '88%',
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
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 2,
  },
  filtersScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  catIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  contactPhone: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  contactOrg: {
    fontSize: 11,
    marginTop: 1,
  },
  selectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 13,
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 12,
  },
  permTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  permDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  grantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  newFormBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  formSubhead: {
    fontSize: 15,
    fontWeight: '800',
  },
  formSubtitle: {
    fontSize: 11,
    marginBottom: 10,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
  },
  catChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 14,
  },
  catSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  catSelectChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  saveContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveContactBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
