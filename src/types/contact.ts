export type ContactCategory =
  | 'party_client'        // Rental Curing Client / Grower
  | 'trader'              // Produce Buyer / Spices Trader
  | 'consultant'          // Field Consultant / Agronomist
  | 'chemical_rep'        // Fertilizer & Chemical Company Representative
  | 'tourist'             // Farm Tour / Visitor
  | 'educational'         // College / Institution
  | 'govt_scientist'      // Government Official / Spices Board / Scientist
  | 'waste_collector'     // Garbage Collector / Rag Picker / Scrap Buyer
  | 'contractor'          // Labor Contractor / Maintenance
  | 'supplier'            // Agricultural Store / Hardware Supplier
  | 'other';

export interface EstateContact {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  address?: string;
  category: ContactCategory;
  companyOrOrg?: string;
  notes?: string;
  lastInteractionDate?: string;
  createdAt: string;
}
