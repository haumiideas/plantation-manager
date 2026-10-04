import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFarm } from '../../context/FarmContext';
import { ExpenseEntry, ExpenseCategory, FuelType, PaymentMode } from '../../types/expense';
import { CropType } from '../../types/crop';
import { formatDate } from '../../utils/date';
import { ThemedDatePickerModal } from '../common/ThemedDatePickerModal';
import { logAuditEvent } from '../../services/auditService';
import { getCustomExpenseCrops, addCustomExpenseCrop, deleteCustomExpenseCrop } from '../../services/harvestService';
import {
  parseInvoiceWithAi,
  getSampleAgroInvoice,
  getOcrConfig,
  saveOcrConfig,
  OcrConfig,
} from '../../services/invoiceOcrService';

export interface ParsedBillItem {
  id: string;
  title: string;
  category: ExpenseCategory;
  quantity?: number;
  unit?: string;
  rate?: number;
  amount: number;
}

interface LogExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: ExpenseEntry, replenishStock: boolean) => void;
  onSaveMultiple?: (entries: ExpenseEntry[], replenishStock: boolean) => void;
  editingEntry?: ExpenseEntry | null;
  orgId: string;
}

const CATEGORIES: { id: ExpenseCategory; icon: string; labelKey: string }[] = [
  { id: 'fuel', icon: 'speedometer', labelKey: 'fuel' },
  { id: 'labor', icon: 'people', labelKey: 'labor' },
  { id: 'fertilizer', icon: 'leaf', labelKey: 'fertilizer' },
  { id: 'chemicals', icon: 'flask', labelKey: 'chemicals' },
  { id: 'maintenance', icon: 'build', labelKey: 'maintenance' },
  { id: 'packaging', icon: 'cube', labelKey: 'packaging' },
  { id: 'curingRental', icon: 'flame', labelKey: 'curingRental' },
  { id: 'infrastructure', icon: 'construct', labelKey: 'infrastructure' },
  { id: 'adminMisc', icon: 'receipt', labelKey: 'adminMisc' },
];

export const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  {
    defaultUnit: string;
    suggestedUnits: string[];
    descriptionPlaceholder: string;
  }
> = {
  fuel: {
    defaultUnit: 'Litres',
    suggestedUnits: ['Litres', 'bundles', 'cans', 'barrels'],
    descriptionPlaceholder: 'e.g. Diesel 50L for tractor / pump generator',
  },
  labor: {
    defaultUnit: 'Man days',
    suggestedUnits: ['Man days', 'Mandays', 'workers', 'shifts'],
    descriptionPlaceholder: 'e.g. Weeding gang wages - 6 workers',
  },
  fertilizer: {
    defaultUnit: 'bags',
    suggestedUnits: ['bags', 'kg', 'sacks', 'tonnes'],
    descriptionPlaceholder: 'e.g. 19:19:19 NPK 5 bags (50kg each)',
  },
  chemicals: {
    defaultUnit: 'Litres',
    suggestedUnits: ['Litres', 'bottles', 'kg', 'packs'],
    descriptionPlaceholder: 'e.g. Monocrotophos / Fungicide 2L spray',
  },
  maintenance: {
    defaultUnit: 'nos',
    suggestedUnits: ['nos', 'service', 'sets', 'hours'],
    descriptionPlaceholder: 'e.g. Sprayer pump seal replacement & servicing',
  },
  packaging: {
    defaultUnit: 'sacks',
    suggestedUnits: ['sacks', 'gunny bags', 'plastic liners', 'nos'],
    descriptionPlaceholder: 'e.g. 50 Polypropylene picking sacks',
  },
  curingRental: {
    defaultUnit: 'kg',
    suggestedUnits: ['kg', 'batches', 'days', 'hours'],
    descriptionPlaceholder: 'e.g. Rent for 200kg green cardamom curing',
  },
  infrastructure: {
    defaultUnit: 'nos',
    suggestedUnits: ['nos', 'meters', 'feet', 'bundles'],
    descriptionPlaceholder: 'e.g. PVC pipe 2 inch fitting repair for irrigation',
  },
  adminMisc: {
    defaultUnit: 'items',
    suggestedUnits: ['items', 'months', 'bills', 'nos'],
    descriptionPlaceholder: 'e.g. Electricity bill / office stationery ledger',
  },
};

const FUEL_TYPES: { id: FuelType; labelKey: string; defaultUnit: string; icon: string }[] = [
  { id: 'petrol', labelKey: 'petrol', defaultUnit: 'Litres', icon: 'speedometer' },
  { id: 'diesel', labelKey: 'diesel', defaultUnit: 'Litres', icon: 'speedometer' },
  { id: 'engineOil', labelKey: 'engineOil', defaultUnit: 'Litres', icon: 'water' },
  { id: 'firewood', labelKey: 'woodenLogs', defaultUnit: 'bundles', icon: 'bonfire' },
];

const PAYMENT_MODES: { id: PaymentMode; labelKey: string; icon: string }[] = [
  { id: 'cash', labelKey: 'cash', icon: 'cash-outline' },
  { id: 'upi', labelKey: 'upi', icon: 'phone-portrait-outline' },
  { id: 'bank_transfer', labelKey: 'bank_transfer', icon: 'business-outline' },
  { id: 'credit', labelKey: 'credit', icon: 'time-outline' },
];

export const LogExpenseModal: React.FC<LogExpenseModalProps> = ({
  visible,
  onClose,
  onSave,
  onSaveMultiple,
  editingEntry,
  orgId,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { options, selectedFarm } = useFarm();

  const [farmId, setFarmId] = useState<string>(selectedFarm || 'namari');
  const [cropId, setCropId] = useState<CropType | 'all' | string>('all');
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [fuelType, setFuelType] = useState<FuelType>('diesel');

  // Dynamic Custom Crops
  const [customCrops, setCustomCrops] = useState<string[]>([]);
  const [showAddCropInput, setShowAddCropInput] = useState(false);
  const [newCropText, setNewCropText] = useState('');

  const [date, setDate] = useState(formatDate());
  const [paymentDate, setPaymentDate] = useState(formatDate());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isPaymentDatePickerVisible, setIsPaymentDatePickerVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Litres');
  const [purchasedFrom, setPurchasedFrom] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [notes, setNotes] = useState('');
  const [replenishInventory, setReplenishInventory] = useState(true);

  // OCR & Camera Bill Scanner State
  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [showImageFullModal, setShowImageFullModal] = useState(false);
  const [showOcrConfigModal, setShowOcrConfigModal] = useState(false);
  const [ocrApiKey, setOcrApiKey] = useState('');
  const [ocrEndpoint, setOcrEndpoint] = useState('');

  // Multi-Item Parsed Items from Bill
  const [parsedItems, setParsedItems] = useState<ParsedBillItem[]>([]);
  const [selectedParsedItemId, setSelectedParsedItemId] = useState<string | null>(null);

  useEffect(() => {
    getOcrConfig().then((cfg) => {
      if (cfg.apiKey) setOcrApiKey(cfg.apiKey);
      if (cfg.unstractEndpoint) setOcrEndpoint(cfg.unstractEndpoint);
    }).catch(() => {});
  }, []);

  const handleLoadSampleBill = () => {
    const sample = getSampleAgroInvoice();
    const items: ParsedBillItem[] = sample.lineItems.map((li) => ({
      id: li.id,
      title: li.title,
      category: li.category,
      quantity: li.quantity,
      unit: li.unit,
      rate: li.rate,
      amount: li.amount,
    }));
    setParsedItems(items);
    if (items.length > 0) {
      setSelectedParsedItemId(items[0].id);
      setTitle(items[0].title);
      setAmount(String(items[0].amount));
      setQuantity(String(items[0].quantity));
      setUnit(items[0].unit || 'nos');
      setCategory(items[0].category);
    }
    setPurchasedFrom(sample.billerName);
    setBillNumber(sample.invoiceNumber || 'INV-IAC-2026-8841');
    setDate(sample.invoiceDate || formatDate());
    setScanFeedback(
      `${t('sampleInvoiceLoaded')} (${items.length} items • ₹${sample.grandTotal.toLocaleString('en-IN')})`
    );
  };

  const handleScanBill = async (source: 'camera' | 'gallery') => {
    try {
      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera access is required to photograph physical bills and vouchers.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.5, // 50% JPEG compression protects low-RAM devices
          base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Photo gallery access is required to select bill images.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.5,
          base64: true,
        });
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setScannedImageUri(asset.uri);
      setIsScanning(true);
      setScanFeedback(null);

      // AI Multimodal OCR Pipeline (Gemini 1.5 Flash Vision / Unstract Engine)
      const ocrResult = await parseInvoiceWithAi(asset.uri, asset.base64 || undefined);
      setIsScanning(false);

      if (ocrResult.success && ocrResult.data) {
        const data = ocrResult.data;
        const items: ParsedBillItem[] = (data.lineItems || []).map((li, idx) => ({
          id: li.id || `bill_item_${Date.now()}_${idx}`,
          title: li.title,
          category: li.category,
          quantity: li.quantity,
          unit: li.unit || 'nos',
          rate: li.rate,
          amount: li.amount,
        }));

        setParsedItems(items);
        if (items.length > 0) {
          setSelectedParsedItemId(items[0].id);
          setTitle(items[0].title);
          setAmount(String(items[0].amount));
          setQuantity(items[0].quantity ? String(items[0].quantity) : '');
          setUnit(items[0].unit || 'nos');
          setCategory(items[0].category);
        }
        if (data.billerName) setPurchasedFrom(data.billerName);
        if (data.invoiceNumber) setBillNumber(data.invoiceNumber);
        if (data.invoiceDate) setDate(data.invoiceDate);

        const totalAmt = items.reduce((acc, it) => acc + it.amount, 0);
        setScanFeedback(
          `${t('billScannedSuccess')} (${items.length} line items detected totaling ₹${totalAmt.toLocaleString('en-IN')})`
        );
      } else {
        if (ocrResult.error === 'NO_API_KEY') {
          Alert.alert(
            t('ocrSettings'),
            'AI OCR requires a Gemini API Key or Unstract endpoint. You can configure one in OCR Settings, or load a sample bill to test.',
            [
              { text: t('loadSampleInvoice'), onPress: () => handleLoadSampleBill() },
              { text: t('ocrSettings'), onPress: () => setShowOcrConfigModal(true) },
              { text: t('cancel'), style: 'cancel' },
            ]
          );
        } else {
          Alert.alert(
            'Scan Result',
            `AI extraction notice: ${ocrResult.error || 'Unable to parse invoice'}. You can fill details manually or configure OCR settings.`
          );
        }
      }
    } catch (err: any) {
      console.warn('Bill scan error:', err);
      Alert.alert('Scan Notice', 'Failed to capture bill. You can type the fields manually.');
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (visible) {
      const loadCrops = async () => {
        const list = await getCustomExpenseCrops(orgId || 'plantation_org_namari_adukidathan');
        setCustomCrops(list);
      };
      loadCrops();
    }

    if (editingEntry) {
      setFarmId(editingEntry.farmId || selectedFarm);
      setCropId(editingEntry.cropId || 'all');
      setCategory(editingEntry.category || 'fuel');
      if (editingEntry.fuelType) setFuelType(editingEntry.fuelType);
      setDate(editingEntry.date || formatDate());
      setPaymentDate(editingEntry.paymentDate || editingEntry.date || formatDate());
      setTitle(editingEntry.title || '');
      setAmount(editingEntry.amount ? String(editingEntry.amount) : '');
      setQuantity(editingEntry.quantity ? String(editingEntry.quantity) : '');
      setUnit(editingEntry.unit || (editingEntry.category === 'fuel' ? 'Litres' : ''));
      setPurchasedFrom(editingEntry.purchasedFrom || '');
      setBillNumber(editingEntry.billNumber || '');
      setPaymentMode(editingEntry.paymentMode || 'upi');
      setNotes(editingEntry.notes || '');
      setScannedImageUri(editingEntry.billImageUri || null);
      setScanFeedback(editingEntry.billImageUri ? t('invoiceCaptured') : null);
      setReplenishInventory(false); // don't re-replenish on edit by default
    } else {
      resetForm();
    }
  }, [editingEntry, visible]);

  const resetForm = () => {
    setFarmId(selectedFarm || 'namari');
    setCropId('all');
    setCategory('fuel');
    setFuelType('diesel');
    setDate(formatDate());
    setPaymentDate(formatDate());
    setTitle('');
    setAmount('');
    setQuantity('');
    setUnit('Litres');
    setPurchasedFrom('');
    setBillNumber('');
    setPaymentMode('upi');
    setNotes('');
    setReplenishInventory(true);
    setScannedImageUri(null);
    setIsScanning(false);
    setScanFeedback(null);
    setParsedItems([]);
    setSelectedParsedItemId(null);
  };

  const handleSelectParsedItem = (item: ParsedBillItem) => {
    setSelectedParsedItemId(item.id);
    setTitle(item.title);
    setAmount(String(item.amount));
    setQuantity(item.quantity ? String(item.quantity) : '');
    setUnit(item.unit || (item.category === 'fuel' ? 'Litres' : 'nos'));
    setCategory(item.category);
  };

  const handleLogAllParsed = () => {
    if (parsedItems.length === 0) return;
    const entries: ExpenseEntry[] = parsedItems.map((item, idx) => ({
      id: `exp_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      orgId,
      farmId,
      cropId,
      category: item.category,
      title: item.title,
      amount: item.amount,
      quantity: item.quantity,
      unit: item.unit,
      purchasedFrom: purchasedFrom.trim() || 'Idukki Agro Chemicals & Farm Supplies Nedumkandam',
      billNumber: billNumber.trim() || undefined,
      date: date.trim() || formatDate(),
      paymentDate: paymentDate.trim() || date.trim() || formatDate(),
      paymentMode,
      notes: `Invoice line item: ${item.quantity} ${item.unit} @ ₹${item.rate}/unit`,
      billImageUri: scannedImageUri || undefined,
      createdAt: new Date().toISOString(),
    }));

    if (onSaveMultiple) {
      onSaveMultiple(entries, replenishInventory);
    } else {
      entries.forEach((e) => onSave(e, replenishInventory));
    }

    logAuditEvent({
      orgId,
      performedByUid: 'user_local',
      performedByName: 'Supervisor',
      action: 'create',
      entityType: 'expense',
      title: 'Batch Invoice Line Items Logged',
      details: `Logged ${entries.length} items from Bill #${billNumber} totaling ₹${parsedItems.reduce((acc, it) => acc + it.amount, 0)}`,
    });

    onClose();
  };

  const handleCategorySelect = (cat: ExpenseCategory) => {
    setCategory(cat);
    const cfg = CATEGORY_CONFIG[cat];
    if (cat === 'fuel') {
      setUnit(fuelType === 'firewood' ? 'bundles' : 'Litres');
    } else {
      setUnit(cfg?.defaultUnit || 'nos');
    }
  };

  const handleFuelTypeSelect = (ft: FuelType) => {
    setFuelType(ft);
    if (ft === 'firewood') {
      setUnit('bundles');
    } else {
      setUnit('Litres');
    }
  };

  const handleSubmit = () => {
    const amtNum = parseFloat(amount) || 0;
    const qtyNum = quantity ? parseFloat(quantity) : undefined;

    const entryTitle =
      title.trim() ||
      (category === 'fuel'
        ? `${(fuelType === 'firewood' ? t('woodenLogs') : (t as any)(fuelType)) || fuelType} purchase`
        : `${t(category as any) || category} expense`);

    const entry: ExpenseEntry = {
      id: editingEntry?.id || `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      orgId,
      farmId,
      cropId,
      category,
      fuelType: category === 'fuel' ? fuelType : undefined,
      title: entryTitle,
      amount: amtNum,
      quantity: qtyNum,
      unit: unit.trim() || undefined,
      purchasedFrom: purchasedFrom.trim() || 'Direct / Local Supplier',
      billNumber: billNumber.trim() || undefined,
      date: date.trim() || formatDate(),
      paymentDate: paymentDate.trim() || date.trim() || formatDate(),
      paymentMode,
      notes: notes.trim() || undefined,
      billImageUri: scannedImageUri || undefined,
      createdAt: editingEntry?.createdAt || new Date().toISOString(),
    };

    onSave(entry, replenishInventory);

    logAuditEvent({
      orgId,
      performedByUid: 'user_local',
      performedByName: 'Supervisor',
      action: editingEntry ? 'update' : 'create',
      entityType: 'expense',
      title: editingEntry ? 'Expense Record Updated' : 'Expense Record Logged',
      details: `₹${entry.amount} for ${entry.title} [${entry.category.toUpperCase()}] - Paid via ${entry.paymentMode.toUpperCase()}`,
    });

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="receipt" size={20} color="#D97706" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {editingEntry ? t('editExpense') : t('addExpense')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {t('logExpenseSubtitle')}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Farm Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('farm')}</Text>
              <View style={styles.pillRow}>
                {options.map((opt) => {
                  const isSelected = farmId === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setFarmId(opt.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                          borderColor: isSelected ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Smart Bill / Invoice Scanner (Camera / Gallery) */}
            <View
              style={[
                styles.ocrCard,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="camera" size={17} color={colors.primary} />
                  <Text style={[styles.ocrCardTitle, { color: colors.text }]}>
                    {t('scanBillTitle')}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setShowOcrConfigModal(true)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <Ionicons name="settings-outline" size={13} color={colors.primary} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                      {t('ocrSettings')}
                    </Text>
                  </TouchableOpacity>
                  {scannedImageUri && (
                    <TouchableOpacity onPress={() => { setScannedImageUri(null); setScanFeedback(null); }}>
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Text style={[styles.ocrCardSubtitle, { color: colors.textMuted }]}>
                {t('scanBillSubtitle')}
              </Text>

              {scannedImageUri ? (
                <View style={styles.ocrPreviewRow}>
                  <TouchableOpacity
                    onPress={() => setShowImageFullModal(true)}
                    activeOpacity={0.8}
                    style={styles.ocrThumbnailWrap}
                  >
                    <Image source={{ uri: scannedImageUri }} style={styles.ocrThumbnail} resizeMode="cover" />
                    <View style={styles.thumbnailZoomBadge}>
                      <Ionicons name="expand" size={10} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ocrStatusText, { color: '#059669' }]}>
                      {t('invoiceCaptured')}
                    </Text>
                    {scanFeedback ? (
                      <Text style={[styles.ocrFeedbackText, { color: colors.textMuted }]}>
                        {scanFeedback}
                      </Text>
                    ) : null}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                      <TouchableOpacity
                        onPress={() => handleScanBill('camera')}
                        style={[styles.ocrMiniBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                      >
                        <Ionicons name="camera-outline" size={13} color={colors.primary} />
                        <Text style={[styles.ocrMiniBtnText, { color: colors.text }]}>{t('retakePhoto')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleScanBill('gallery')}
                        style={[styles.ocrMiniBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                      >
                        <Ionicons name="images-outline" size={13} color={colors.primary} />
                        <Text style={[styles.ocrMiniBtnText, { color: colors.text }]}>{t('galleryPhoto')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : isScanning ? (
                <View style={{ paddingVertical: 12, alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '600' }}>
                    {t('invoiceAnalyzing')}
                  </Text>
                </View>
              ) : (
                <View style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleScanBill('camera')}
                      style={[styles.ocrActionBtn, { backgroundColor: colors.primary }]}
                    >
                      <Ionicons name="camera" size={15} color="#FFFFFF" />
                      <Text style={styles.ocrActionBtnText}>{t('takePhoto')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleScanBill('gallery')}
                      style={[styles.ocrActionBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }]}
                    >
                      <Ionicons name="images-outline" size={15} color={colors.text} />
                      <Text style={[styles.ocrActionBtnText, { color: colors.text }]}>{t('fromGallery')}</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={handleLoadSampleBill}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      marginTop: 8,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor: `${colors.primary}12`,
                    }}
                  >
                    <Ionicons name="flask-outline" size={13} color={colors.primary} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                      🧪 {t('loadSampleInvoice')} (Test Multi-Item Bill)
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Multi-Item Line Items Detected from Bill */}
            {parsedItems.length > 0 && (
              <View
                style={[
                  styles.parsedDrawer,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.parsedDrawerHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Ionicons name="receipt-outline" size={17} color={colors.primary} />
                    <Text style={[styles.parsedDrawerTitle, { color: colors.text }]}>
                      {t('parsedItemsDetected')} ({parsedItems.length})
                    </Text>
                  </View>
                  <View style={[styles.totalPill, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.totalPillText, { color: colors.primary }]}>
                      Total: ₹{parsedItems.reduce((acc, it) => acc + it.amount, 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.parsedDrawerSub, { color: colors.textMuted }]}>
                  {parsedItems.length} items parsed from bill #{billNumber}. Tap any item to inspect/edit below, or 1-tap save all entries into the ledger.
                </Text>

                {/* Parsed Line Items List */}
                <View style={{ marginTop: 8, gap: 6 }}>
                  {parsedItems.map((item, idx) => {
                    const isSelected = selectedParsedItemId === item.id;
                    const catBadgeColor =
                      item.category === 'fertilizer'
                        ? { bg: '#DCFCE7', text: '#15803D' }
                        : item.category === 'chemicals'
                        ? { bg: '#E0F2FE', text: '#0369A1' }
                        : { bg: '#F3F4F6', text: '#374151' };

                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleSelectParsedItem(item)}
                        style={[
                          styles.parsedItemRow,
                          {
                            backgroundColor: isSelected ? (isDark ? '#1E2D24' : '#F0FDF4') : colors.card,
                            borderColor: isSelected ? colors.primary : colors.cardBorder,
                          },
                        ]}
                      >
                        <View style={{ flex: 1, paddingRight: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={[styles.catMiniBadge, { backgroundColor: catBadgeColor.bg }]}>
                              <Text style={[styles.catMiniBadgeText, { color: catBadgeColor.text }]}>
                                {t(item.category as any) || item.category}
                              </Text>
                            </View>
                            {isSelected && (
                              <View style={[styles.activePill, { backgroundColor: colors.primary }]}>
                                <Text style={styles.activePillText}>Active in Form</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.parsedItemTitle, { color: colors.text }]} numberOfLines={1}>
                            {idx + 1}. {item.title}
                          </Text>
                          <Text style={[styles.parsedItemQty, { color: colors.textMuted }]}>
                            {item.quantity} {item.unit} {item.rate ? `@ ₹${item.rate}` : ''}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                          <Text style={[styles.parsedItemAmount, { color: colors.text }]}>
                            ₹{item.amount.toLocaleString('en-IN')}
                          </Text>
                          <Text style={[styles.parsedItemSelectPrompt, { color: isSelected ? '#059669' : colors.primary }]}>
                            {isSelected ? '✓ Selected' : t('populateThisItem')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 1-Tap Save All Button */}
                <TouchableOpacity
                  onPress={handleLogAllParsed}
                  style={[styles.saveAllBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="flash" size={16} color="#FFFFFF" />
                  <Text style={styles.saveAllBtnText}>
                    ⚡ {t('logAllParsedItems')} ({parsedItems.length} Entries • ₹{parsedItems.reduce((acc, it) => acc + it.amount, 0).toLocaleString('en-IN')})
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('expenseCategory')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => handleCategorySelect(cat.id)}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                          borderColor: isSelected ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={14}
                        color={isSelected ? '#FFFFFF' : colors.primary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.catChipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                        {t(cat.labelKey as any) || cat.id}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Fuel Type Sub-Selector (When Fuel category is selected) */}
            {category === 'fuel' && (
              <View style={[styles.fuelBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
                <Text style={[styles.fuelBoxHeader, { color: colors.text }]}>
                  ⛽ Select Fuel Type (Petrol, Diesel, Engine Oil, Firewood)
                </Text>
                <View style={styles.fuelTypesRow}>
                  {FUEL_TYPES.map((ft) => {
                    const isSelected = fuelType === ft.id;
                    return (
                      <TouchableOpacity
                        key={ft.id}
                        onPress={() => handleFuelTypeSelect(ft.id)}
                        style={[
                          styles.fuelChip,
                          {
                            backgroundColor: isSelected ? '#D97706' : colors.card,
                            borderColor: isSelected ? '#D97706' : colors.cardBorder,
                          },
                        ]}
                      >
                        <Ionicons
                          name={ft.icon as any}
                          size={14}
                          color={isSelected ? '#FFFFFF' : '#D97706'}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.fuelChipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                          {t(ft.labelKey as any)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Plantation Cost Center / Crop Tagging */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 0 }]}>
                  {t('costCenterCrop')}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddCropInput((prev) => !prev)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Ionicons name="add-circle" size={15} color={colors.primary} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                    {t('addCrop')}
                  </Text>
                </TouchableOpacity>
              </View>

              {showAddCropInput && (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  <TextInput
                    style={[
                      styles.textInput,
                      { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                    ]}
                    placeholder={t('cropNamePlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    value={newCropText}
                    onChangeText={setNewCropText}
                  />
                  <TouchableOpacity
                    onPress={async () => {
                      if (!newCropText.trim()) return;
                      const added = newCropText.trim();
                      const updated = await addCustomExpenseCrop(orgId || 'plantation_org_namari_adukidathan', added);
                      setCustomCrops(updated);
                      setCropId(added);
                      setNewCropText('');
                      setShowAddCropInput(false);
                    }}
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: 14,
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>{t('save')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.pillRow}>
                {[
                  { id: 'all' as const, label: t('generalEstateAllCrops') },
                  { id: 'cardamom' as const, label: t('cardamomCrop') },
                ].map((c) => {
                  const isSelected = cropId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setCropId(c.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                          borderColor: isSelected ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {customCrops.map((cc) => {
                  const isSelected = cropId === cc;
                  return (
                    <View
                      key={cc}
                      style={[
                        styles.chip,
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingRight: 6,
                          backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                          borderColor: isSelected ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <TouchableOpacity onPress={() => setCropId(cc)}>
                        <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                          {cc}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={async () => {
                          const updated = await deleteCustomExpenseCrop(orgId || 'plantation_org_namari_adukidathan', cc);
                          setCustomCrops(updated);
                          if (cropId === cc) {
                            setCropId('all');
                          }
                        }}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={15}
                          color={isSelected ? '#FFFFFF' : colors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>


            {/* Amount & Quantity in Row */}
            <View style={styles.row}>
              <View style={{ flex: 1.2 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('totalAmountLabel')} *</Text>
                <View style={[styles.amountBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.rupeeSymbol, { color: colors.primary }]}>₹</Text>
                  <TextInput
                    style={[styles.amountInput, { color: colors.text }]}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>
              </View>

              <View style={{ flex: 0.8 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('quantityLabel')}</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 50"
                  placeholderTextColor={colors.textMuted}
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>

              <View style={{ flex: 0.8 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('unitsLabel')}</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder={CATEGORY_CONFIG[category]?.defaultUnit || 'Litres'}
                  placeholderTextColor={colors.textMuted}
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
            </View>

            {/* Quick Unit Suggestion Chips */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>{t('suggestedUnits')}</Text>
              {CATEGORY_CONFIG[category]?.suggestedUnits.map((su) => (
                <TouchableOpacity
                  key={su}
                  onPress={() => setUnit(su)}
                  style={[
                    styles.quickUnitChip,
                    {
                      backgroundColor: unit.toLowerCase() === su.toLowerCase() ? colors.primary : colors.surfaceSubtle,
                      borderColor: unit.toLowerCase() === su.toLowerCase() ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.quickUnitText,
                      { color: unit.toLowerCase() === su.toLowerCase() ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {su}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description / Item Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('descriptionExpenseTitle')}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder={CATEGORY_CONFIG[category]?.descriptionPlaceholder || 'e.g. Expense description'}
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Purchased From & Bill Number */}
            <View style={styles.row}>
              <View style={{ flex: 1.2 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('purchasedFrom')} *</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. HPCL Petrol Bunk Bodimettu"
                  placeholderTextColor={colors.textMuted}
                  value={purchasedFrom}
                  onChangeText={setPurchasedFrom}
                />
              </View>

              <View style={{ flex: 0.8 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('billNumber')}</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. INV-9214"
                  placeholderTextColor={colors.textMuted}
                  value={billNumber}
                  onChangeText={setBillNumber}
                />
              </View>
            </View>

            {/* Dates: Purchase Date & Payment Date with Date Pickers */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Purchase / Expense Date</Text>
                <TouchableOpacity
                  onPress={() => setIsDatePickerVisible(true)}
                  style={[
                    styles.dateTriggerBtn,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                  <Text style={[styles.dateTriggerText, { color: colors.text }]}>{date}</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('paymentDate')}</Text>
                <TouchableOpacity
                  onPress={() => setIsPaymentDatePickerVisible(true)}
                  style={[
                    styles.dateTriggerBtn,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                  <Text style={[styles.dateTriggerText, { color: colors.text }]}>{paymentDate}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Payment Mode Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('paymentMode')}</Text>
              <View style={styles.pillRow}>
                {PAYMENT_MODES.map((pm) => {
                  const isSelected = paymentMode === pm.id;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      onPress={() => setPaymentMode(pm.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                          borderColor: isSelected ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <Ionicons
                        name={pm.icon as any}
                        size={13}
                        color={isSelected ? '#FFFFFF' : colors.text}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                        {t(pm.labelKey as any)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Add to Inventory Toggle */}
            {(category === 'fuel' || category === 'fertilizer' || category === 'chemicals') && (
              <View style={[styles.switchRow, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.switchTitle, { color: colors.text }]}>{t('addToInventory')}</Text>
                  <Text style={[styles.switchSub, { color: colors.textMuted }]}>
                    Automatically increase available stock balance in Fuel & Expendables ledger
                  </Text>
                </View>
                <Switch
                  value={replenishInventory}
                  onValueChange={setReplenishInventory}
                  thumbColor={replenishInventory ? colors.primaryLight : '#F4F7F4'}
                  trackColor={{ false: '#767577', true: colors.surfaceSubtle }}
                />
              </View>
            )}

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('notes')}</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Optional notes or operational remarks..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>{t('save')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Date Picker Modal for Purchase/Expense Date */}
      <ThemedDatePickerModal
        visible={isDatePickerVisible}
        onClose={() => setIsDatePickerVisible(false)}
        selectedDate={date}
        onSelectDate={(formattedDate) => setDate(formattedDate)}
        title="Select Expense Date"
      />

      {/* Date Picker Modal for Payment Date */}
      <ThemedDatePickerModal
        visible={isPaymentDatePickerVisible}
        onClose={() => setIsPaymentDatePickerVisible(false)}
        selectedDate={paymentDate}
        onSelectDate={(formattedDate) => setPaymentDate(formattedDate)}
        title="Select Payment Date"
      />

      {/* Full-Screen Bill Image Preview Modal */}
      <Modal
        visible={showImageFullModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageFullModal(false)}
      >
        <View style={styles.fullImageOverlay}>
          <TouchableOpacity
            style={styles.fullImageCloseBtn}
            onPress={() => setShowImageFullModal(false)}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          {scannedImageUri && (
            <Image
              source={{ uri: scannedImageUri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* OCR Engine Configuration Modal */}
      <Modal
        visible={showOcrConfigModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOcrConfigModal(false)}
      >
        <View style={styles.ocrConfigOverlay}>
          <View style={[styles.ocrConfigCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="hardware-chip-outline" size={20} color={colors.primary} />
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>{t('ocrSettings')}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowOcrConfigModal(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12, lineHeight: 17 }}>
              Configure Google Gemini Vision or Unstract OCR endpoint to parse agricultural invoices, bills & slips into itemized ledger entries.
            </Text>

            <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
              {t('ocrApiKey')}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, fontSize: 12, height: 42 },
              ]}
              placeholder="Google AI Studio Gemini API Key"
              placeholderTextColor={colors.textMuted}
              value={ocrApiKey}
              onChangeText={setOcrApiKey}
              autoCapitalize="none"
              secureTextEntry
            />

            <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.text, marginTop: 10, marginBottom: 4 }}>
              {t('ocrEndpoint')} (Optional Unstract Endpoint)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, fontSize: 12, height: 42 },
              ]}
              placeholder="https://api.unstract.com/v1/extract..."
              placeholderTextColor={colors.textMuted}
              value={ocrEndpoint}
              onChangeText={setOcrEndpoint}
              autoCapitalize="none"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowOcrConfigModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  await saveOcrConfig({ apiKey: ocrApiKey.trim(), unstractEndpoint: ocrEndpoint.trim() });
                  Alert.alert(t('ocrSettings'), t('ocrKeyConfigured'));
                  setShowOcrConfigModal(false);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>{t('saveSettings')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    maxHeight: 520,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 4,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fuelBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  fuelBoxHeader: {
    fontSize: 13,
    fontWeight: '700',
  },
  fuelTypesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  fuelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  fuelChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
  },
  rupeeSymbol: {
    fontSize: 17,
    fontWeight: '800',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 11,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  switchTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  switchSub: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  textArea: {
    height: 64,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  quickUnitChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickUnitText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateTriggerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ocrCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  ocrCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  ocrCardSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  ocrActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  ocrActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ocrPreviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  ocrThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#00000010',
  },
  ocrStatusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  ocrFeedbackText: {
    fontSize: 10,
    marginTop: 2,
    lineHeight: 13,
  },
  ocrMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  ocrMiniBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ocrThumbnailWrap: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnailZoomBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 4,
    padding: 3,
  },
  parsedDrawer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  parsedDrawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  parsedDrawerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  parsedDrawerSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  totalPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  totalPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  parsedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 9,
  },
  catMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catMiniBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  activePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePillText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  parsedItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  parsedItemQty: {
    fontSize: 10.5,
    marginTop: 1,
  },
  parsedItemAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  parsedItemSelectPrompt: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  saveAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  saveAllBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  fullImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fullImageCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  ocrConfigOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ocrConfigCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});
