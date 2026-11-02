const SCHEMA_SQL = `

CREATE TABLE IF NOT EXISTS users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL DEFAULT '',
    email           text UNIQUE NOT NULL,
    password_hash   text NOT NULL,
    created_at      timestamp with time zone DEFAULT now(),
    updated_at      timestamp with time zone DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash      text PRIMARY KEY,
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at      timestamp with time zone NOT NULL,
    created_at      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user
ON password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS company_settings (
    user_id         uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_name    text NOT NULL DEFAULT '',
    logo_url        text NOT NULL DEFAULT '',
    address         text NOT NULL DEFAULT '',
    email           text NOT NULL DEFAULT '',
    phone           text NOT NULL DEFAULT '',
    currency        text NOT NULL DEFAULT 'USD',
    tax_rate        numeric(6,3) NOT NULL DEFAULT 0,
    invoice_prefix  text NOT NULL DEFAULT 'INV',
    next_seq        integer NOT NULL DEFAULT 1,
    accent_color    text NOT NULL DEFAULT '',
    created_at      timestamp with time zone DEFAULT now(),
    updated_at      timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            text NOT NULL,
    email           text UNIQUE NOT NULL,
    company         text NOT NULL DEFAULT '',
    phone           text NOT NULL DEFAULT '',
    address         text NOT NULL DEFAULT '',
    notes           text NOT NULL DEFAULT '',
    created_at      timestamp with time zone DEFAULT now(),
    updated_at      timestamp with time zone DEFAULT now()
);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS company text NOT NULL DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS invoices (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    invoice_number  text NOT NULL,
    status          text NOT NULL DEFAULT 'draft',
    issue_date      date NOT NULL DEFAULT CURRENT_DATE,
    due_date        date NOT NULL DEFAULT CURRENT_DATE + interval '30 days',
    currency        text NOT NULL DEFAULT 'USD',
    tax_rate        numeric(6,3) NOT NULL DEFAULT 0,
    discount        numeric(12,2) NOT NULL DEFAULT 0,
    subtotal        numeric(12,2) NOT NULL DEFAULT 0,
    tax_amount      numeric(12,2) NOT NULL DEFAULT 0,
    total           numeric(12,2) NOT NULL DEFAULT 0,
    notes           text NOT NULL DEFAULT '',
    terms           text NOT NULL DEFAULT '',
    paid_at         timestamp with time zone,
    created_at      timestamp with time zone DEFAULT now(),
    updated_at      timestamp with time zone DEFAULT now()
);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);

CREATE TABLE IF NOT EXISTS invoice_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description     text NOT NULL,
    quantity        numeric(12,2) NOT NULL DEFAULT 1,
    rate            numeric(12,2) NOT NULL DEFAULT 0,
    amount          numeric(12,2) NOT NULL DEFAULT 0,
    position        integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice
ON invoice_items(invoice_id);

-- Reusable products / services catalog

CREATE TABLE IF NOT EXISTS catalog_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            text NOT NULL,
    description     text NOT NULL DEFAULT '',
    rate            numeric(12,2) NOT NULL DEFAULT 0,
    unit            text NOT NULL DEFAULT '',
    created_at      timestamp with time zone DEFAULT now(),
    updated_at      timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_user
ON catalog_items(user_id);

-- Business expenses

CREATE TABLE IF NOT EXISTS expenses (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor          text NOT NULL,
    category        text NOT NULL DEFAULT '',
    expense_date    date NOT NULL DEFAULT CURRENT_DATE,
    amount          numeric(12,2) NOT NULL DEFAULT 0,
    currency        text NOT NULL DEFAULT 'USD',
    notes           text NOT NULL DEFAULT '',
    created_at      timestamp with time zone DEFAULT now(),
    updated_at      timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user
ON expenses(user_id);

-- Payments recorded against invoices

CREATE TABLE IF NOT EXISTS payments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_id      uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount          numeric(12,2) NOT NULL DEFAULT 0,
    method          text NOT NULL DEFAULT '',
    paid_on         date NOT NULL DEFAULT CURRENT_DATE,
    notes           text NOT NULL DEFAULT '',
    created_at      timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user
ON payments(user_id);

CREATE INDEX IF NOT EXISTS idx_payments_invoice
ON payments(invoice_id);

`;

module.exports = { SCHEMA_SQL };