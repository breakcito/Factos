export interface User {
  id: number;
  name: string;
  email: string;
  role: "superadmin" | "developer" | "admin";
  is_active: boolean;
  companies_count?: number;
  companies?: Company[];
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: number;
  user_id: number;
  name: string;
  key: string;
  is_active: boolean;
  last_used_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Company {
  id: string;
  user_id: number;
  ruc: string;
  business_name: string;
  trademark_name?: string | null;
  address?: string | null;
  ubigeo?: string | null;
  department?: string | null;
  province?: string | null;
  district?: string | null;
  establishment_code?: string | null;
  sol_user: string;
  sol_pass?: string;
  client_id?: string | null;
  client_secret?: string;
  certificate_path?: string | null;
  certificate_pass?: string;
  webhook_url?: string | null;
  webhook_secret?: string | null;
  is_production: boolean;
  is_active: boolean;
  email_notifications_active: boolean;
  company_copy_emails?: string[] | null;
  send_to_client_email: boolean;
  email_template_settings?: {
    color?: string;
    footer_text?: string;
  } | null;
  mail_host?: string | null;
  mail_port?: number | null;
  mail_username?: string | null;
  mail_password?: string;
  mail_encryption?: string | null;
  mail_from_address?: string | null;
  mail_from_name?: string | null;
  created_at: string;
  updated_at: string;
  documents_count?: number;
  webhook_deliveries_count?: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface DocumentItem {
  id: number;
  item_index?: number;
  internal_code?: string | null;
  code?: string | null;
  description: string;
  unit_code: string;
  quantity: number | string;
  unit_value: number | string;
  unit_price: number | string;
  igv_type?: string;
  igv_affectation_type?: string;
  igv_amount: number | string;
  total: number | string;
}

export interface Document {
  id: string;
  company_id: string;
  external_id?: string | null;
  type_code: string;
  document_type?: string;
  operation_type?: string;
  series: string;
  correlative: string;
  document_number?: string;
  status:
    | "pending"
    | "waiting_sunat"
    | "processing"
    | "accepted"
    | "rejected"
    | "voided"
    | "void_pending";
  issue_date: string;
  issue_time: string;
  due_date?: string | null;
  currency: string;
  payment_method?: string;
  total_taxable?: number | string;
  total_unaffected?: number | string;
  total_exonerated?: number | string;
  total_free?: number | string;
  total_igv?: number | string;
  total_discount?: number | string;
  total: number | string;
  client_doc_type: string;
  client_doc_number: string;
  client_name: string;
  client_address?: string | null;
  client_email?: string | null;
  sunat_code?: string | null;
  sunat_description?: string | null;
  sunat_notes?: string[] | null;
  void_ticket?: string | null;
  void_reason?: string | null;
  void_sunat_code?: string | null;
  void_sunat_description?: string | null;
  voided_at?: string | null;
  xml_path?: string | null;
  cdr_path?: string | null;
  pdf_path?: string | null;
  void_xml_path?: string | null;
  void_cdr_path?: string | null;
  links?: {
    xml?: string | null;
    cdr?: string | null;
    pdf?: string | null;
    void_xml?: string | null;
    void_cdr?: string | null;
  };
  created_at: string;
  updated_at: string;
  company?: Company;
  items?: DocumentItem[];
}

export interface DespatchItem {
  id: number;
  item_index: number;
  code?: string | null;
  description: string;
  unit_code: string;
  quantity: number;
}

export interface Despatch {
  id: string;
  company_id: string;
  external_id?: string | null;
  type_code: string;
  series: string;
  correlative: string;
  document_number?: string;
  status:
    | "pending"
    | "waiting_sunat"
    | "processing"
    | "accepted"
    | "rejected"
    | "voided"
    | "void_pending";
  issue_date: string;
  issue_time: string;
  transfer_date: string;
  transport_mode: string;
  transfer_reason: string;
  total_weight: number;
  weight_unit: string;
  packages_count: number;
  recipient_doc_type: string;
  recipient_doc_number: string;
  recipient_name: string;
  recipient_address?: string | null;
  recipient_email?: string | null;
  origin_ubigeo: string;
  origin_address: string;
  destination_ubigeo: string;
  destination_address: string;
  sunat_code?: string | null;
  sunat_description?: string | null;
  sunat_notes?: string[] | null;
  created_at: string;
  updated_at: string;
  company?: Company;
  items?: DespatchItem[];
}

export interface DashboardStats {
  is_superadmin?: boolean;
  role?: string;
  companies: {
    total: number;
    active: number;
    production: number;
    beta: number;
  };
  documents: {
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
    voided: number;
    total_pen: number;
    total_usd: number;
  };
  despatches: {
    total: number;
    accepted: number;
  };
  users: {
    total: number;
    developers: number;
  };
  api_keys?: {
    total: number;
    active: number;
  };
  recent_documents: Document[];
  recent_companies: Company[];
}

export interface SystemSettingsData {
  mail: {
    mail_mailer: string;
    mail_host: string;
    mail_port: number;
    mail_username: string;
    mail_password: string;
    has_password: boolean;
    mail_encryption: string;
    mail_from_address: string;
    mail_from_name: string;
  };
  apisperu: {
    api_key_dni_ruc: string;
    api_key_tc: string;
    dni_ruc_url: string;
    exchange_rate_url: string;
  };
}
