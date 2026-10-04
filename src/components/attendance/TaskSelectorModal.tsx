import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedWorkerName, getLocalizedTaskName } from '../../utils/localizationUtils';

interface Props {
  visible: boolean;
  workerName: string;
  currentTask: string;
  onClose: () => void;
  onSelectTask: (task: string) => void;
}

const COMMON_ESTATE_TASKS = [
  { id: 'card_pick_2', label: 'Cardamom Picking (2nd Flush)', icon: 'leaf-outline', crop: 'Cardamom' },
  { id: 'card_pick_1', label: 'Cardamom Picking (1st Flush)', icon: 'leaf-outline', crop: 'Cardamom' },
  { id: 'pep_pluck', label: 'Pepper Plucking & Spikes', icon: 'basket-outline', crop: 'Pepper' },
  { id: 'pep_thresh', label: 'Pepper Threshing & Drying Yard', icon: 'sunny-outline', crop: 'Pepper' },
  { id: 'spray_bordeaux', label: 'Bordeaux Mixture Spraying', icon: 'color-wand-outline', crop: 'Maintenance' },
  { id: 'spray_foliar', label: 'Foliar Nutrient Spraying', icon: 'water-outline', crop: 'Maintenance' },
  { id: 'weeding_basin', label: 'Weeding, Mulching & Basin Clearing', icon: 'cut-outline', crop: 'Maintenance' },
  { id: 'curing_firing', label: 'Curing Furnace Firing & Loading', icon: 'flame-outline', crop: 'Processing' },
  { id: 'shade_lopping', label: 'Shade Tree Lopping & Standards', icon: 'git-branch-outline', crop: 'Maintenance' },
  { id: 'general_labor', label: 'General Estate & Heavy Trenching', icon: 'construct-outline', crop: 'General' },
];

export const TaskSelectorModal: React.FC<Props> = ({
  visible,
  workerName,
  currentTask,
  onClose,
  onSelectTask,
}) => {
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();
  const [customTask, setCustomTask] = useState('');

  const handleSelect = (task: string) => {
    onSelectTask(task);
    onClose();
  };

  const handleCustomSubmit = () => {
    if (customTask.trim()) {
      handleSelect(customTask.trim());
      setCustomTask('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                {language === 'ta'
                  ? 'இன்றைய வேலையை ஒதுக்கீடு செய்'
                  : language === 'ml'
                  ? 'ഇന്നത്തെ ജോലി നിശ്ചയിക്കുക'
                  : "Allocate Today's Work"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.primary }]}>
                {getLocalizedWorkerName(workerName, language)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Task List */}
          <ScrollView style={styles.taskList} contentContainerStyle={{ paddingBottom: 20 }}>
            {COMMON_ESTATE_TASKS.map((task) => {
              const isSelected = currentTask === task.label;
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskItem,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                    isSelected && [styles.taskItemActive, { borderColor: colors.primary, backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }],
                  ]}
                  onPress={() => handleSelect(task.label)}
                >
                  <Ionicons
                    name={task.icon as any}
                    size={18}
                    color={isSelected ? colors.primary : colors.textMuted}
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskLabel, { color: isSelected ? colors.primary : colors.text }]}>
                      {getLocalizedTaskName(task.label, language)}
                    </Text>
                    <Text style={[styles.cropTag, { color: colors.textMuted }]}>{task.crop}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}

            {/* Custom Task Input */}
            <View style={[styles.customBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              <Text style={[styles.customLabel, { color: colors.text }]}>Or enter custom activity:</Text>
              <View style={styles.customRow}>
                <TextInput
                  style={[styles.customInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.cardBorder }]}
                  placeholder="e.g., Road repair, firewood stacking"
                  placeholderTextColor={colors.textMuted}
                  value={customTask}
                  onChangeText={setCustomTask}
                />
                <TouchableOpacity
                  style={[styles.customBtn, { backgroundColor: colors.primary }]}
                  onPress={handleCustomSubmit}
                >
                  <Text style={styles.customBtnText}>Assign</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  taskList: {
    padding: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  taskItemActive: {
    borderWidth: 1.5,
  },
  taskLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  cropTag: {
    fontSize: 11,
    marginTop: 2,
  },
  customBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  customLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  customRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 13,
  },
  customBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  customBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
