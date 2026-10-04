import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Linking,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { VisitorEntry, VisitorCategory } from '../../types/visitor';
import { ThemedConfirmModal } from '../common/ThemedConfirmModal';

interface VisitorsListProps {
  visitors: VisitorEntry[];
  onAddVisitor: () => void;
  onEditVisitor: (visitor: VisitorEntry) => void;
  onDeleteVisitor: (id: string) => void;
}

const CATEGORY_META: Record<
  VisitorCategory,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  field_consultant: { label: 'Field Consultant', icon: 'ribbon', color: '#6366F1' },
  chemical_rep: { label: 'Chemical / Fertilizer Rep', icon: 'flask', color: '#EC4899' },
  produce_buyer: { label: 'Produce Buyer / Trader', icon: 'cart', color: '#F59E0B' },
  tourist: { label: 'Farm Tour / Tourist', icon: 'camera', color: '#14B8A6' },
  educational: { label: 'Educational / Student', icon: 'school', color: '#8B5CF6' },
  govt_scientist: { label: 'Govt / Spices Board', icon: 'shield-checkmark', color: '#3B82F6' },
  waste_collector: { label: 'Scrap / Waste Collector', icon: 'trash', color: '#64748B' },
  other: { label: 'Other Visitor', icon: 'person', color: '#94A3B8' },
};

export const VisitorsList: React.FC<VisitorsListProps> = ({
  visitors,
  onAddVisitor,
  onEditVisitor,
  onDeleteVisitor,
}) => {
  const { colors, isDark } = useTheme();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VisitorCategory | 'all'>('all');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Financial metrics
  const totalPaidExpenses = visitors
    .filter((v) => v.financeType === 'paid_expense' && v.amount)
    .reduce((sum, v) => sum + (v.amount || 0), 0);

  const totalReceivedIncome = visitors
    .filter((v) => v.financeType === 'received_income' && v.amount)
    .reduce((sum, v) => sum + (v.amount || 0), 0);

  const filteredVisitors = visitors.filter((v) => {
    const matchesCat =
      selectedCategory === 'all' || v.category === selectedCategory;
    const q = search.toLowerCase().trim();
    if (!q) return matchesCat;

    const matchesSearch =
      v.visitorName.toLowerCase().includes(q) ||
      v.phone.toLowerCase().includes(q) ||
      (v.organization && v.organization.toLowerCase().includes(q)) ||
      (v.fieldActivity && v.fieldActivity.toLowerCase().includes(q)) ||
      (v.vehicleNumber && v.vehicleNumber.toLowerCase().includes(q));

    return matchesCat && matchesSearch;
  });

  const handleCall = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/[\s-]/g, '');
    Linking.openURL(`tel:${cleaned}`);
  };

  return (
    <View style={styles.container}>
      {/* Financial & Volume Pulse Summary */}
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Total Visitors
          </Text>
          <Text style={[styles.summaryVal, { color: colors.text }]}>
            {visitors.length}
          </Text>
          <Text style={[styles.summarySub, { color: colors.textMuted }]}>
            Recorded visits
          </Text>
        </View>

        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: '#EF4444' }]}>
            Costs Paid (Expenses)
          </Text>
          <Text style={[styles.summaryVal, { color: '#EF4444' }]}>
            ₹{totalPaidExpenses.toLocaleString()}
          </Text>
          <Text style={[styles.summarySub, { color: colors.textMuted }]}>
            Consulting / services
          </Text>
        </View>

        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: '#10B981' }]}>
            Received (Income)
          </Text>
          <Text style={[styles.summaryVal, { color: '#10B981' }]}>
            ₹{totalReceivedIncome.toLocaleString()}
          </Text>
          <Text style={[styles.summarySub, { color: colors.textMuted }]}>
            Produce, tours, scrap
          </Text>
        </View>
      </View>

      {/* Action Header: Search & Log Visitor Button */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search visitor, phone, company, activity..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={onAddVisitor}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="person-add" size={15} color="#FFFFFF" />
          <Text style={styles.addBtnText}>+ Log Visitor</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoryFilters}>
        <TouchableOpacity
          onPress={() => setSelectedCategory('all')}
          style={[
            styles.filterChip,
            {
              backgroundColor: selectedCategory === 'all' ? colors.primary : colors.surfaceSubtle,
              borderColor: selectedCategory === 'all' ? colors.primary : colors.cardBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.filterChipText,
              { color: selectedCategory === 'all' ? '#FFFFFF' : colors.text },
            ]}
          >
            All ({visitors.length})
          </Text>
        </TouchableOpacity>

        {(Object.keys(CATEGORY_META) as VisitorCategory[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const count = visitors.filter((v) => v.category === cat).length;
          if (count === 0 && selectedCategory !== cat) return null;
          const isSel = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
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
                size={11}
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

      {/* Visitor Cards */}
      <FlatList
        data={filteredVisitors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No visitors recorded</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {search
                ? `No visitors matching "${search}"`
                : 'Log visits by agronomists, traders, tour groups, scientists, and contractors.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = CATEGORY_META[item.category] || CATEGORY_META.other;
          return (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              {/* Card Header: Avatar, Name, Category, Actions */}
              <View style={styles.cardHeader}>
                <View style={[styles.avatarCircle, { backgroundColor: meta.color + '20' }]}>
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.visitorName, { color: colors.text }]}>
                      {item.visitorName}
                    </Text>
                    <View style={[styles.catBadge, { backgroundColor: meta.color + '20' }]}>
                      <Text style={[styles.catBadgeText, { color: meta.color }]}>
                        {meta.label}
                      </Text>
                    </View>
                  </View>

                  {item.organization ? (
                    <Text style={[styles.orgText, { color: colors.textMuted }]} numberOfLines={1}>
                      {item.organization}
                    </Text>
                  ) : null}

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>
                      📅 {item.date} {item.time ? `• ${item.time}` : ''}
                    </Text>
                    <Text style={[styles.metaText, { color: colors.primary }]}>
                      📍 {item.farmId === 'namari' ? 'Namari' : 'Adukidathan'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Field Activity Box */}
              <View
                style={[
                  styles.activityBox,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <Ionicons name="leaf-outline" size={13} color={colors.primary} />
                  <Text style={[styles.activityHeading, { color: colors.primary }]}>
                    Activity in Field:
                  </Text>
                </View>
                <Text style={[styles.activityText, { color: colors.text }]}>
                  {item.fieldActivity}
                </Text>
              </View>

              {/* Additional Meta: Persons, Vehicle, Address */}
              <View style={styles.additionalMetaRow}>
                {item.personsCount && item.personsCount > 1 ? (
                  <View style={[styles.metaPill, { backgroundColor: colors.surfaceSubtle }]}>
                    <Ionicons name="people" size={11} color={colors.textMuted} />
                    <Text style={[styles.metaPillText, { color: colors.textMuted }]}>
                      {item.personsCount} persons
                    </Text>
                  </View>
                ) : null}

                {item.vehicleNumber ? (
                  <View style={[styles.metaPill, { backgroundColor: colors.surfaceSubtle }]}>
                    <Ionicons name="car" size={11} color={colors.textMuted} />
                    <Text style={[styles.metaPillText, { color: colors.textMuted }]}>
                      {item.vehicleNumber}
                    </Text>
                  </View>
                ) : null}

                {item.address ? (
                  <View style={[styles.metaPill, { backgroundColor: colors.surfaceSubtle }]}>
                    <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                    <Text style={[styles.metaPillText, { color: colors.textMuted }]} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Financial Transaction Badge */}
              <View style={styles.financeFooter}>
                {item.financeType === 'paid_expense' && item.amount ? (
                  <View style={[styles.financeTag, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                    <Ionicons name="arrow-down-circle" size={14} color="#DC2626" />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#DC2626' }}>
                      Paid: ₹{item.amount.toLocaleString()} ({item.paymentMode?.toUpperCase() || 'CASH'})
                    </Text>
                    <Text style={{ fontSize: 10, color: '#B91C1C' }}>• Auto-logged in Expense</Text>
                  </View>
                ) : item.financeType === 'received_income' && item.amount ? (
                  <View style={[styles.financeTag, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
                    <Ionicons name="arrow-up-circle" size={14} color="#16A34A" />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#16A34A' }}>
                      Received: ₹{item.amount.toLocaleString()} ({item.paymentMode?.toUpperCase() || 'CASH'})
                    </Text>
                    <Text style={{ fontSize: 10, color: '#15803D' }}>• Auto-logged in Income</Text>
                  </View>
                ) : (
                  <View style={[styles.financeTag, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
                    <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      No Financial Transaction
                    </Text>
                  </View>
                )}

                {/* Action Buttons: Call, Edit, Delete */}
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    onPress={() => handleCall(item.phone)}
                    style={[styles.circleBtn, { backgroundColor: '#10B98120' }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="call" size={15} color="#10B981" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => onEditVisitor(item)}
                    style={[styles.circleBtn, { backgroundColor: colors.surfaceSubtle }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="pencil" size={15} color={colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setDeleteTargetId(item.id)}
                    style={[styles.circleBtn, { backgroundColor: '#EF444420' }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={15} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      <ThemedConfirmModal
        visible={!!deleteTargetId}
        onCancel={() => setDeleteTargetId(null)}
        title="Delete Visitor Entry"
        message="Are you sure you want to delete this visitor log entry? Any linked expense or income record will also be removed."
        confirmText="Delete Entry"
        type="delete"
        onConfirm={() => {
          if (deleteTargetId) {
            onDeleteVisitor(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  summaryVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  summarySub: {
    fontSize: 9,
    marginTop: 1,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitorName: {
    fontSize: 15,
    fontWeight: '800',
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orgText: {
    fontSize: 12,
    marginTop: 1,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  activityBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  activityHeading: {
    fontSize: 11,
    fontWeight: '700',
  },
  activityText: {
    fontSize: 12,
    lineHeight: 18,
  },
  additionalMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  financeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
    gap: 8,
  },
  financeTag: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    flexWrap: 'wrap',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
