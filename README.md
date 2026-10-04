# 🌿 Farmag - Plantation & Farm Management System

A comprehensive, offline-first mobile and tablet application engineered for multi-estate plantation management, agronomic operations, labor muster, crop curing, and financial accounting. Built with **React Native**, **Expo**, **TypeScript**, and **Firebase Firestore**.

---

## 🚀 Key Modules & Capabilities

### 1. 🌾 Multi-Farm & Estate Management
- Multi-division switching between **Namari Farm**, **Adukidathan Farm**, and a **Consolidated Multi-Estate View**.
- Customizable estate branding (configurable company name, address, contact, and GSTIN).
- Farm acreage tracking and cost-per-acre operational benchmarks.

### 2. 👥 Labor Muster & Attendance
- Daily muster tracking for resident and commuter laborers.
- Shift management: Full-day, half-day, overtime (OT) hours, and daily wage calculations.
- Instant 0ms offline-first caching with background cloud sync to Firebase.
- Worker lifecycle tracking and muster status.

### 3. 🧺 Crop Harvest & Picking Ledger
- Multi-crop support: **Cardamom**, **Black Pepper**, **Coffee**, **Arecanut**, and custom crops.
- Per-flush performance tracking for cardamom (flushes 1 to 4+), tare weight deduction, net yield, and locking mechanism.
- Contractor labor group attribution and productivity benchmarks (kg/worker/day).

### 4. 🔥 Curing Chambers & Pepper Solar Yard
- Cardamom drying kiln tracking: green capsule loading, firing logs, wood/diesel/petrol fuel burn rates, unload dry recovery, and grading standard breakdowns.
- Pepper solar yard tracking: green berry drying cycles and dry black pepper yield.
- Executive season intelligence and historical dryer outturn analytics.

### 5. 🚜 Field Activities & Fertigation Logging
- Standard agronomic tasks: Weeding & trashing, disease spraying, fertilizing, shade lopping, mulching, and estate maintenance.
- **Fertigation logging**: Drum counts, solution volume, application method (spraying, drenching, + custom methods), and application mode (gravity, petrol motor, diesel motor, electric pump).
- Automatic fuel burn logging linked directly to the estate fuel ledger.
- Full activity edit history with immutable before/after audit trail logging.

### 6. 💰 Financials, Expenses & Executive P&L
- Multi-category expense tracking: Labor wages, fuel & energy, fertilizers & crop protection, packaging, equipment maintenance, and curing rentals.
- **Executive Profit & Loss (P&L)**: Revenue inflows, operating expenditures, net operating profit/deficit, and period filtering (Daily, Weekly, Monthly, Quarterly, Annual).
- Equipment asset registry: Machinery lifespan, service age, and physical muster audits.

### 7. 📸 Multi-Item Invoice OCR Scanner
- Photographed invoice structured data extraction powered by Gemini Vision AI / Unstract.
- Automatically extracts biller name, invoice number, date, tax rate, and itemized line items.
- Full-screen high-resolution thumbnail inspection and 1-tap bulk item logging.

### 8. 🧾 Produce Sale Buyer Receipts & WhatsApp Sharing
- Tailored revenue capture for produce sales, farm tours, educational visits, curing rentals, and scrap sales.
- Support for zero-amount / complimentary visits (university students, goodwill delegations).
- Clean, computer-generated PDF receipts (no physical signature required).
- 1-tap WhatsApp sharing directly to buyer/trader contact numbers.

### 9. 🌐 Full Vernacular Localization
- Complete three-language support: **English**, **Tamil (தமிழ்)**, and **Malayalam (മലയാളം)**.
- Localized calendar engine with native day and month names.
- Dynamic domain translation dictionary for agricultural terminology.

---

## 🛠️ Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Styling**: Context-based dynamic light & dark agricultural themes
- **Icons**: Expo Vector Icons (`Ionicons`)
- **Backend / Storage**: Firebase Firestore, Firebase Auth, React Native AsyncStorage
- **Reporting & Export**: Expo Print, Expo Sharing, FileSystem
- **Camera & Media**: Expo ImagePicker, Expo DocumentPicker

---

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/farmag-plantation-app.git
   cd farmag-plantation-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Firebase configuration credentials and Google OAuth Client IDs.

4. **Start the development server**:
   ```bash
   npx expo start
   ```

---

## 📄 License

This project is licensed under the MIT License.
