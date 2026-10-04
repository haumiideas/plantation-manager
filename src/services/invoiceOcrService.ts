import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpenseCategory } from '../types/expense';

export interface UnstractLineItem {
  id: string;
  title: string;
  category: ExpenseCategory;
  quantity: number;
  unit: string;
  rate: number;
  taxRate?: number;
  amount: number;
}

export interface UnstractInvoiceData {
  billerName: string;
  billerAddress?: string;
  billerPhone?: string;
  billerGstin?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  deliveryLocation?: string;
  lineItems: UnstractLineItem[];
  subtotal?: number;
  taxAmount?: number;
  grandTotal: number;
}

export interface OcrConfig {
  apiKey?: string;
  unstractEndpoint?: string;
  unstractToken?: string;
}

const OCR_CONFIG_KEY = '@farmag_ocr_config';

export async function getOcrConfig(): Promise<OcrConfig> {
  try {
    const raw = await AsyncStorage.getItem(OCR_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
    unstractEndpoint: '',
  };
}

export async function saveOcrConfig(config: OcrConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(OCR_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

/**
 * Returns a high-fidelity reference agro-chemical invoice sample.
 * Clearly demarcated as a demo template for review.
 */
export function getSampleAgroInvoice(): UnstractInvoiceData {
  return {
    billerName: 'Idukki Agro Chemicals & Farm Supplies Nedumkandam',
    billerAddress: 'Main Bazar, Nedumkandam, Idukki District, Kerala - 685553',
    billerPhone: '+91 94472 88410',
    billerGstin: '32AABCI8841C1Z4',
    invoiceNumber: 'INV-IAC-2026-8841',
    invoiceDate: new Date().toISOString().slice(0, 10),
    deliveryLocation: 'Namari Estate Central Shed, Cardamom Division',
    lineItems: [
      {
        id: `sample_1_${Date.now()}`,
        title: '19:19:19 NPK Water Soluble Fertilizer',
        category: 'fertilizer',
        quantity: 2,
        unit: 'bags',
        rate: 1750,
        taxRate: 5,
        amount: 3500,
      },
      {
        id: `sample_2_${Date.now()}`,
        title: 'Mancozeb 75% WP Contact Fungicide',
        category: 'chemicals',
        quantity: 3,
        unit: 'kg',
        rate: 650,
        taxRate: 18,
        amount: 1950,
      },
      {
        id: `sample_3_${Date.now()}`,
        title: 'Monocrotophos 36% SL Insecticide',
        category: 'chemicals',
        quantity: 2,
        unit: 'Litres',
        rate: 850,
        taxRate: 18,
        amount: 1700,
      },
      {
        id: `sample_4_${Date.now()}`,
        title: 'HTP Power Sprayer Delivery Hose 50m',
        category: 'maintenance',
        quantity: 1,
        unit: 'nos',
        rate: 2200,
        taxRate: 18,
        amount: 2200,
      },
      {
        id: `sample_5_${Date.now()}`,
        title: 'High-density Spray Nozzles & Brass Valve',
        category: 'maintenance',
        quantity: 4,
        unit: 'nos',
        rate: 350,
        taxRate: 18,
        amount: 1400,
      },
    ],
    subtotal: 10750,
    taxAmount: 1120,
    grandTotal: 10750,
  };
}

/**
 * Executes structured invoice parsing using multimodal LLM (Gemini / Unstract)
 * on the captured bill image base64 data.
 */
export async function parseInvoiceWithAi(
  imageUri: string,
  base64Data?: string
): Promise<{ success: boolean; data?: UnstractInvoiceData; error?: string }> {
  const config = await getOcrConfig();
  const apiKey = config.apiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  // 1. If custom Unstract endpoint is configured
  if (config.unstractEndpoint && config.unstractEndpoint.trim()) {
    try {
      const response = await fetch(config.unstractEndpoint.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.unstractToken ? { Authorization: `Bearer ${config.unstractToken.trim()}` } : {}),
        },
        body: JSON.stringify({
          image: base64Data,
          mimeType: 'image/jpeg',
          schema: 'invoice_v1',
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json && json.lineItems && json.lineItems.length > 0) {
          return { success: true, data: json };
        }
      }
    } catch (unstractErr: any) {
      console.warn('Custom Unstract OCR call failed:', unstractErr);
    }
  }

  // 2. If Gemini API Key is configured
  if (apiKey && apiKey.trim()) {
    if (!base64Data) {
      return { success: false, error: 'IMAGE_BASE64_MISSING' };
    }

    try {
      const prompt = `You are a specialized agricultural and commercial invoice document extractor (Unstract format).
Analyze this invoice image and extract structured data strictly in JSON format.
Ensure categories are accurately chosen from: "fertilizer", "chemicals", "maintenance", "fuel", "admin_misc", "infrastructure".
Return ONLY valid JSON matching this schema with no markdown formatting:
{
  "billerName": "string",
  "billerAddress": "string",
  "billerPhone": "string",
  "billerGstin": "string",
  "invoiceNumber": "string",
  "invoiceDate": "YYYY-MM-DD",
  "deliveryLocation": "string",
  "lineItems": [
    {
      "title": "string",
      "category": "fertilizer" | "chemicals" | "maintenance" | "fuel" | "admin_misc",
      "quantity": number,
      "unit": "string",
      "rate": number,
      "taxRate": number,
      "amount": number
    }
  ],
  "subtotal": number,
  "taxAmount": number,
  "grandTotal": number
}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
      const payload = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `HTTP ${res.status}`;
        return { success: false, error: msg };
      }

      const resJson = await res.json();
      const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        return { success: false, error: 'EMPTY_AI_RESPONSE' };
      }

      // Parse JSON from text
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed: UnstractInvoiceData = JSON.parse(cleanJson);

      // Add unique IDs to line items
      if (parsed.lineItems && Array.isArray(parsed.lineItems)) {
        parsed.lineItems = parsed.lineItems.map((item, idx) => ({
          ...item,
          id: `item_${Date.now()}_${idx}`,
          category: (item.category || 'maintenance') as ExpenseCategory,
        }));
      }

      return { success: true, data: parsed };
    } catch (apiErr: any) {
      console.warn('Gemini OCR extraction failed:', apiErr);
      return { success: false, error: apiErr?.message || 'EXTRACTION_FAILED' };
    }
  }

  // 3. No API key configured
  return {
    success: false,
    error: 'NO_API_KEY',
  };
}
