# Seed Data & Synthetic Graph Dataset

This directory contains the synthetic graph generator, ground truth registry, exported datasets, and database seeding scripts for the **Collaborative Graph-Based Fraud Detection Console**.

---

## 📁 Generated Files

| File | Type | Description |
|---|---|---|
| [`accounts.csv`](file:///c:/Users/surya/Desktop/OUTR/4TH%20YEAR/7TH%20SEM/PPD/collaborative-fraud-console/database/seed/accounts.csv) | CSV | 700 account records with accountId, accountType, riskScore, status, balance, createdAt, ownerName, country. |
| [`transactions.csv`](file:///c:/Users/surya/Desktop/OUTR/4TH%20YEAR/7TH%20SEM/PPD/collaborative-fraud-console/database/seed/transactions.csv) | CSV | 3,200 transaction records with transactionId, senderAccountId, receiverAccountId, amount, timestamp, transactionType, status. |
| [`ground_truth.json`](file:///c:/Users/surya/Desktop/OUTR/4TH%20YEAR/7TH%20SEM/PPD/collaborative-fraud-console/database/seed/ground_truth.json) | JSON | Ground truth registry with planted suspicious patterns (cycles, smurfing, dispersion, communities, layering), account & transaction labels for model evaluation (Precision, Recall, F1). |
| [`default_dataset.json`](file:///c:/Users/surya/Desktop/OUTR/4TH%20YEAR/7TH%20SEM/PPD/collaborative-fraud-console/database/seed/default_dataset.json) | JSON | Self-contained dataset bundle with all accounts, transactions, sample users (with bcrypt password hashes), demo investigations, findings, notes, and ground truth for in-memory and database seeding. |
| [`template_transactions.csv`](file:///c:/Users/surya/Desktop/OUTR/4TH%20YEAR/7TH%20SEM/PPD/collaborative-fraud-console/database/seed/template_transactions.csv) | CSV | Sample transaction CSV template for user uploads in the Data Management page. |

---

## 🎯 Planted Fraud Topologies

1. **Circular Fund Routing (3 Cycles)**:
   - **3-Hop Cycle**: `ACC-CYCLE-01` ➔ `ACC-CYCLE-02` ➔ `ACC-CYCLE-03` ➔ `ACC-CYCLE-01` ($48.5k ➔ $47.2k ➔ $46k within 22h, 2.5% fee depletion).
   - **4-Hop Cycle**: `ACC-RING-01` ➔ `ACC-RING-02` ➔ `ACC-RING-03` ➔ `ACC-RING-04` ➔ `ACC-RING-01` ($85k ➔ $83.3k ➔ $81.8k ➔ $80.2k within 38h, crypto-fiat cross-border carousel).
   - **5-Hop Cycle**: `ACC-CIRC-01` ➔ `ACC-CIRC-02` ➔ `ACC-CIRC-03` ➔ `ACC-CIRC-04` ➔ `ACC-CIRC-05` ➔ `ACC-CIRC-01` ($125k washing through BVI-Liechtenstein-Luxembourg-London-Singapore).

2. **Structuring / Smurfing (Fan-In)**:
   - Aggregator: `ACC-SMURF-AGG-01` (Consolidated Wholesale Imports LLC).
   - 10 Mules (`ACC-SMURF-01` through `ACC-SMURF-10`) depositing sub-threshold amounts ($9,150 – $9,900) into aggregator within 48h (Total: $95,550).

3. **Dispersion (Fan-Out)**:
   - Source Hub: `ACC-DISP-SRC-01` (Vanguard Global Distribution Ltd).
   - Distributes rapid payments to 15 different accounts within 24 hours (Total: ~$95,000).

4. **Dense Coordinated Communities**:
   - **Community Alpha**: 10 offshore accounts (`ACC-COMM1-01` – `ACC-COMM1-10`) with 28 internal transactions moving $15k–$65k.
   - **Community Beta**: 12 accounts (`ACC-COMM2-01` – `ACC-COMM2-12`) with 38 internal transactions moving $20k–$75k in a dense mesh.

5. **Multi-Hop Layering**:
   - 5-Hop linear chain (`ACC-LAYER-01` ➔ `ACC-LAYER-02` ➔ `ACC-LAYER-03` ➔ `ACC-LAYER-04` ➔ `ACC-LAYER-05` ➔ `ACC-LAYER-06`).
   - $250k initial amount with 1.5% fee peeling per intermediary hop.

---

## 👥 Default User Accounts

| Role | Name | Email | Password |
|---|---|---|---|
| **ADMIN** | Chief Investigator Sarah Lin | `admin@fraudconsole.internal` | `Admin@123` |
| **INVESTIGATOR** | Marcus Vance | `investigator@fraudconsole.internal` | `Investigator@123` |
| **INVESTIGATOR** | Elena Rostova | `elena@fraudconsole.internal` | `Investigator@123` |
| **VIEWER** | Audit Observer Dave | `viewer@fraudconsole.internal` | `Viewer@123` |

---

## 🛠️ CLI Seeding Scripts

Run any script using `npm` or `npx ts-node`:

```bash
# Run master seed (generates dataset, seeds Postgres, seeds Neo4j)
npm run seed

# Regenerate dataset files only (CSV, JSON, Ground Truth)
npm run seed:generate

# Seed PostgreSQL only (migrations + users + cases + findings + notes)
npm run seed:postgres

# Seed Neo4j only (constraints + account nodes + TRANSFERRED_TO edges)
npm run seed:neo4j
```
