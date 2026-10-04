import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ContractorGroupConfig } from '../../types/harvest';

interface ManageLaborGroupsModalProps {
  visible: boolean;
  onClose: () => void;
  contractorGroups: ContractorGroupConfig[];
  onAddGroup: (name: string) => void;
  onDeleteGroup: (id: string) => void;
  onUpdateGroup: (id: string, newName: string) => void;
}

export const ManageLaborGroupsModal: React.FC<ManageLaborGroupsModalProps> = ({
  visible,
  onClose,
  contractorGroups,
  onAddGroup,
  onDeleteGroup,
  onUpdateGroup,
}) => {
  const { colors, isDark } = useTheme();
  const [newGroupName, setNewGroupName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleAdd = () => {
    if (!newGroupName.trim()) return;
    onAddGroup(newGroupName.trim());
    setNewGroupName('');
  };

  const startEdit = (group: ContractorGroupConfig) => {
    setEditingId(group.id);
    setEditingText(group.name);
  };

  const saveEdit = (id: string) => {
    if (editingText.trim()) {
      onUpdateGroup(id, editingText.trim());
    }
    setEditingId(null);
  };

  const confirmDelete = (group: ContractorGroupConfig) => {
    if (group.isOwnEstate) {
      Alert.alert('Cannot Delete', 'The primary Own Estate group cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete Labor Group',
      `Are you sure you want to remove "${group.name}" from the estate contractor roster?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteGroup(group.id) },
      ]
    );
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
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Manage Labor Contractor Teams
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subText, { color: colors.textMuted }]}>
            Configure contractor teams (e.g. Boopathi, Thangamani) to track per-person daily output.
          </Text>

          {/* Add New Group Input */}
          <View style={styles.addBar}>
            <TextInput
              style={[
                styles.addInput,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="e.g. Murugesan workers, Velu Team"
              placeholderTextColor={colors.textMuted}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* List of Groups */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {contractorGroups.map((group) => {
              const isEditingThis = editingId === group.id;

              return (
                <View
                  key={group.id}
                  style={[
                    styles.groupItem,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  {isEditingThis ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={[
                          styles.editInput,
                          { backgroundColor: colors.card, color: colors.text, borderColor: colors.primary },
                        ]}
                        value={editingText}
                        onChangeText={setEditingText}
                        autoFocus
                      />
                      <TouchableOpacity
                        onPress={() => saveEdit(group.id)}
                        style={[styles.smallBtn, { backgroundColor: colors.primary }]}
                      >
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setEditingId(null)}
                        style={[styles.smallBtn, { backgroundColor: colors.border }]}
                      >
                        <Ionicons name="close" size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.displayRow}>
                      <View style={styles.nameCluster}>
                        <Ionicons
                          name={group.isOwnEstate ? 'home' : 'person-circle-outline'}
                          size={16}
                          color={group.isOwnEstate ? colors.primary : '#3B82F6'}
                        />
                        <Text style={[styles.groupName, { color: colors.text }]}>
                          {group.name}
                        </Text>
                        {group.isOwnEstate && (
                          <View style={[styles.ownBadge, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                            <Text style={[styles.ownBadgeText, { color: colors.primary }]}>
                              Primary
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          onPress={() => startEdit(group)}
                          style={styles.iconBtn}
                        >
                          <Ionicons name="pencil-outline" size={16} color={colors.textMuted} />
                        </TouchableOpacity>

                        {!group.isOwnEstate && (
                          <TouchableOpacity
                            onPress={() => confirmDelete(group)}
                            style={styles.iconBtn}
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
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
    maxHeight: '85%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    lineHeight: 17,
  },
  addBar: {
    flexDirection: 'row',
    gap: 8,
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    maxHeight: 300,
  },
  groupItem: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  displayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  groupName: {
    fontSize: 13,
    fontWeight: '700',
  },
  ownBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ownBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 4,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
  },
  smallBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
