// Neo4j indexes for performance
// Run after constraints

// Accounts
CREATE INDEX account_name_idx IF NOT EXISTS FOR (a:Account) ON (a.name);
CREATE INDEX account_risk_idx IF NOT EXISTS FOR (a:Account) ON (a.riskScore);
CREATE INDEX account_created_idx IF NOT EXISTS FOR (a:Account) ON (a.createdAt);

// Transactions
CREATE INDEX transaction_amount_idx IF NOT EXISTS FOR (t:Transaction) ON (t.amount);
CREATE INDEX transaction_timestamp_idx IF NOT EXISTS FOR (t:Transaction) ON (t.timestamp);
CREATE INDEX transaction_status_idx IF NOT EXISTS FOR (t:Transaction) ON (t.status);
CREATE INDEX transaction_flagged_idx IF NOT EXISTS FOR (t:Transaction) ON (t.isFraudulent);

// Merchants
CREATE INDEX merchant_category_idx IF NOT EXISTS FOR (m:Merchant) ON (m.category);
CREATE INDEX merchant_risk_idx IF NOT EXISTS FOR (m:Merchant) ON (m.riskScore);

// Full-text search indexes
CREATE FULLTEXT INDEX account_fulltext IF NOT EXISTS
FOR (a:Account) ON EACH [a.name, a.email, a.phone];
