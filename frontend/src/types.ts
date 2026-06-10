export interface User {
  id: number; name: string; email: string; role: string; active: boolean;
}

export interface Property {
  id: number; code?: string; name: string; address?: string; monthly_rent: number;
  contract_start?: string; contract_end?: string; type: string;
  owner_name?: string; owner_contact?: string; status: string;
  notes?: string; created_at?: string;
}

export interface PropertyProfile extends Property {
  total_receita: number; total_expenses: number;
  resultado: number; margin_pct: number;
  expenses_by_category: Record<string, number>;
  revenue_by_month: Array<{month: string; receita: number}>;
  expenses_by_month: Array<{month: string; total: number}>;
  clients: Array<{id: number; name: string; status: string; check_in?: string; check_out?: string}>;
}

export interface Client {
  id: number; code?: string; name: string; email?: string; phone?: string;
  nationality?: string; birth_date?: string; document_id?: string;
  status: string; property_id?: number; property_name?: string;
  check_in?: string; check_out?: string; monthly_value: number;
  payment_method?: string; notes?: string; created_at?: string;
}

export interface TransactionIn {
  id: number; date: string; description?: string; method?: string;
  amount: number;
  category?: string; property_id?: number; property_name?: string;
  competencia_month?: number; competencia_year?: number;
  invoice?: string; lodgement?: string; created_at?: string;
}

export interface TransactionOut {
  id: number; date: string; description?: string; method?: string;
  total_paid: number; category?: string; property_id?: number;
  property_name?: string; competencia_month?: number;
  competencia_year?: number; created_at?: string;
}

export interface Contract {
  id: number; type: string; client_id?: number; client_name?: string;
  client_ids?: number[]; client_names?: string[];
  clients?: { id: number; name: string; email?: string }[];
  property_id?: number; property_name?: string; start_date?: string;
  end_date?: string; value: number; status: string; file_url?: string;
  signed: boolean; signature_licensee?: string; signature_licensor?: string;
  notes?: string; created_at?: string;
}

export interface Alert {
  id: number; type: string; severity: string; message: string;
  entity_type?: string; entity_id?: number; read: boolean;
  created_at?: string;
}

export interface DashboardKPIs {
  receita_bruta: number; total_opex: number; ebitda: number;
  pro_labore: number; resultado: number; capex: number;
  free_cash_flow: number; margem_ebitda_pct: number;
  margem_fcf_pct: number; total_properties: number;
  total_clients: number; aluguel_fixo_total: number;
}

export interface PnLRow {
  month: number; year: number; label: string;
  receita: number;
  total_revenue: number; opex_by_category: Record<string, number>;
  total_opex: number; ebitda: number; pro_labore: number;
  resultado: number; capex: number; free_cash_flow: number;
  margem_ebitda_pct: number; margem_fcf_pct: number;
}

export interface RankingProperty {
  id: number; name: string;
  total_receita: number; total_despesas: number; resultado: number;
  margin_pct: number; classification: string;
}

export interface MaintenanceRequest {
  id: number; property_id: number; property_name?: string;
  title: string; description?: string; status: string;
  priority: string; cost: number; created_by?: string;
  created_at?: string; updated_at?: string; resolved_at?: string;
}
