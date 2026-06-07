// Core domain types for SnapDocket — generated from DB schema

export type UUID = string;

export type TenantStatus = "active" | "suspended" | "trial";

export interface Tenant {
  id: UUID;
  name: string;
  slug: string;
  status: TenantStatus;
  branding: TenantBranding | null;
  settings: TenantSettings | null;
  created_at: string;
  updated_at: string;
}

export interface TenantBranding {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  font_family?: string;
  company_name?: string;
  tagline?: string;
}

export interface TenantSettings {
  currency: string;
  timezone: string;
  invoice_prefix: string;
  tax_rate: number;
  payment_terms_days: number;
  /** Optional custom service catalogue for Quick Job */
  services?: Array<{
    id: string;
    label: string;
    description?: string;
    unitPrice: number;
    category: "core" | "addon";
  }>;
}

export type UserRole = "owner" | "admin" | "technician" | "viewer";

export interface Profile {
  id: UUID;
  tenant_id: UUID;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CustomerStatus = "active" | "inactive" | "prospect";

export interface Customer {
  id: UUID;
  tenant_id: UUID;
  name: string;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country: string;
  status: CustomerStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type JobStatus = "pending" | "scheduled" | "in_progress" | "completed" | "cancelled";

export type JobPriority = "low" | "medium" | "high" | "urgent";

export interface Job {
  id: UUID;
  tenant_id: UUID;
  customer_id: UUID;
  assigned_to: UUID | null;
  title: string;
  description: string | null;
  status: JobStatus;
  priority: JobPriority;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  site_address: string | null;
  notes: string | null;
  customer?: Customer;
  assignee?: Profile;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = "draft" | "sent" | "viewed" | "partial" | "paid" | "overdue" | "void";

export interface Invoice {
  id: UUID;
  tenant_id: UUID;
  customer_id: UUID;
  job_id: UUID | null;
  invoice_number: string;
  status: InvoiceStatus;
  issued_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  notes: string | null;
  terms: string | null;
  customer?: Customer;
  items?: InvoiceItem[];
  payments?: Payment[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: UUID;
  invoice_id: UUID;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
  sort_order: number;
  created_at: string;
}

export type PaymentMethod = "cash" | "card" | "bank_transfer" | "cheque" | "other";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
  id: UUID;
  tenant_id: UUID;
  invoice_id: UUID;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "view"
  | "export"
  | "send";

export interface AuditLog {
  id: UUID;
  tenant_id: UUID;
  user_id: UUID | null;
  resource_type: string;
  resource_id: UUID | null;
  action: AuditAction;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Utility types for forms
export type CreateCustomerInput = Omit<Customer, "id" | "tenant_id" | "created_at" | "updated_at">;
export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export type CreateJobInput = Omit<
  Job,
  "id" | "tenant_id" | "created_at" | "updated_at" | "customer" | "assignee"
>;
export type UpdateJobInput = Partial<CreateJobInput>;

export type CreateInvoiceInput = Omit<
  Invoice,
  "id" | "tenant_id" | "created_at" | "updated_at" | "customer" | "items" | "payments"
> & {
  items: Omit<InvoiceItem, "id" | "invoice_id" | "created_at">[];
};
export type UpdateInvoiceInput = Partial<CreateInvoiceInput>;

export type CreatePaymentInput = Omit<Payment, "id" | "tenant_id" | "created_at">;

// API response wrappers
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

// Theme types
export interface ThemeTokens {
  colorPrimary: string;
  colorPrimaryForeground: string;
  colorSecondary: string;
  colorSecondaryForeground: string;
  colorAccent: string;
  colorAccentForeground: string;
  colorBackground: string;
  colorForeground: string;
  colorMuted: string;
  colorMutedForeground: string;
  colorBorder: string;
  colorDestructive: string;
  colorSuccess: string;
  radius: string;
  fontSans: string;
}
