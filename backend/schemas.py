from pydantic import BaseModel
from typing import Optional, List, Union
import datetime as _dt
from models import (
    UserRole, PropertyType, PropertyStatus, ClientStatus,
    ContractType, ContractStatus, AlertSeverity, AlertType,
    RoomType
)


# ── User (moved up for forward reference) ─────────────
class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    active: bool
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    active: Optional[bool] = None


# ── Auth ───────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole = UserRole.VISUALIZADOR


# ── Property ───────────────────────────────────────────
class PropertyCreate(BaseModel):
    name: str
    address: Optional[str] = None
    monthly_rent: float = 0
    contract_start: Optional[_dt.date] = None
    contract_end: Optional[_dt.date] = None
    type: PropertyType = PropertyType.APARTAMENTO
    owner_name: Optional[str] = None
    owner_contact: Optional[str] = None
    landlord_id: Optional[int] = None
    status: PropertyStatus = PropertyStatus.ATIVO
    notes: Optional[str] = None

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    monthly_rent: Optional[float] = None
    contract_start: Optional[_dt.date] = None
    contract_end: Optional[_dt.date] = None
    type: Optional[PropertyType] = None
    owner_name: Optional[str] = None
    owner_contact: Optional[str] = None
    landlord_id: Optional[int] = None
    status: Optional[PropertyStatus] = None
    notes: Optional[str] = None

class PropertyOut(BaseModel):
    id: int
    code: Optional[str] = None
    name: str
    address: Optional[str]
    monthly_rent: float
    contract_start: Optional[_dt.date]
    contract_end: Optional[_dt.date]
    type: PropertyType
    owner_name: Optional[str]
    owner_contact: Optional[str]
    landlord_id: Optional[int] = None
    landlord_name: Optional[str] = None
    status: PropertyStatus
    notes: Optional[str]
    created_at: Optional[_dt.datetime]
    class Config:
        from_attributes = True

class PropertyProfile(PropertyOut):
    total_receita: float = 0
    total_expenses: float = 0
    resultado: float = 0
    margin_pct: float = 0
    expenses_by_category: dict = {}
    revenue_by_month: list = []
    expenses_by_month: list = []
    clients: list = []
    contracts: list = []
    documents: list = []
    rooms: list = []
    remarks: list = []


# ── Room & Bed ────────────────────────────────────────
class BedCreate(BaseModel):
    name: str
    monthly_value: float = 0
    notes: Optional[str] = None

class BedOut(BaseModel):
    id: int
    room_id: int
    name: str
    monthly_value: float
    notes: Optional[str]
    occupant_name: Optional[str] = None
    occupant_id: Optional[int] = None
    class Config:
        from_attributes = True

class RoomCreate(BaseModel):
    property_id: int
    name: str
    room_type: RoomType = RoomType.INDIVIDUAL
    num_beds: int = 1
    monthly_value: float = 0
    notes: Optional[str] = None
    beds: List[BedCreate] = []
    auto_create_beds: bool = False

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    room_type: Optional[RoomType] = None
    num_beds: Optional[int] = None
    monthly_value: Optional[float] = None
    notes: Optional[str] = None

class RoomOut(BaseModel):
    id: int
    property_id: int
    property_name: Optional[str] = None
    name: str
    room_type: RoomType
    num_beds: int
    monthly_value: float
    notes: Optional[str]
    beds: List[BedOut] = []
    occupancy: int = 0
    capacity: int = 0
    class Config:
        from_attributes = True


# ── Client ─────────────────────────────────────────────
class ClientCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    nationality: Optional[str] = None
    birth_date: Optional[_dt.date] = None
    document_id: Optional[str] = None
    referencia: Optional[str] = None
    status: ClientStatus = ClientStatus.ATIVO
    property_id: Optional[int] = None
    room_id: Optional[int] = None
    bed_id: Optional[int] = None
    check_in: Optional[_dt.date] = None
    check_out: Optional[_dt.date] = None
    monthly_value: float = 0
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    nationality: Optional[str] = None
    birth_date: Optional[_dt.date] = None
    document_id: Optional[str] = None
    referencia: Optional[str] = None
    status: Optional[ClientStatus] = None
    property_id: Optional[int] = None
    room_id: Optional[int] = None
    bed_id: Optional[int] = None
    check_in: Optional[_dt.date] = None
    check_out: Optional[_dt.date] = None
    monthly_value: Optional[float] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class ClientOut(BaseModel):
    id: int
    code: Optional[str] = None
    name: str
    email: Optional[str]
    phone: Optional[str]
    nationality: Optional[str]
    birth_date: Optional[_dt.date]
    document_id: Optional[str]
    referencia: Optional[str] = None
    status: ClientStatus
    property_id: Optional[int]
    property_name: Optional[str] = None
    room_id: Optional[int] = None
    room_name: Optional[str] = None
    bed_id: Optional[int] = None
    bed_name: Optional[str] = None
    check_in: Optional[_dt.date]
    check_out: Optional[_dt.date]
    monthly_value: float
    payment_method: Optional[str]
    notes: Optional[str]
    created_at: Optional[_dt.datetime]
    class Config:
        from_attributes = True


class ClientProfileMonthSummary(BaseModel):
    month: int
    year: int
    label: str
    revenue: float = 0
    total_revenue: float = 0
    total_expenses: float = 0
    resultado: float = 0


class ClientProfileData(ClientOut):
    total_revenue: float = 0
    total_expenses: float = 0
    resultado: float = 0
    margin_pct: float = 0
    contracts: list = []
    financial_by_month: List[ClientProfileMonthSummary] = []
    documents: list = []


# ── Transactions ───────────────────────────────────────
class TransactionInCreate(BaseModel):
    date: _dt.date
    description: Optional[str] = None
    method: Optional[str] = None
    amount: float = 0
    category: Optional[str] = None
    property_id: Optional[int] = None
    client_id: Optional[int] = None
    room_id: Optional[int] = None
    bed_id: Optional[int] = None
    competencia_month: Optional[int] = None
    competencia_year: Optional[int] = None
    invoice: Optional[str] = None
    lodgement: Optional[str] = None

class TransactionInUpdate(BaseModel):
    date: Optional[_dt.date] = None
    description: Optional[str] = None
    method: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    property_id: Optional[int] = None
    client_id: Optional[int] = None
    room_id: Optional[int] = None
    bed_id: Optional[int] = None
    competencia_month: Optional[int] = None
    competencia_year: Optional[int] = None
    invoice: Optional[str] = None
    lodgement: Optional[str] = None

class TransactionInOut(BaseModel):
    id: int
    date: _dt.date
    description: Optional[str]
    method: Optional[str]
    amount: float
    category: Optional[str]
    property_id: Optional[int]
    property_name: Optional[str] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    room_id: Optional[int] = None
    room_name: Optional[str] = None
    bed_id: Optional[int] = None
    bed_name: Optional[str] = None
    competencia_month: Optional[int]
    competencia_year: Optional[int]
    invoice: Optional[str]
    lodgement: Optional[str]
    created_at: Optional[_dt.datetime]
    class Config:
        from_attributes = True

class TransactionOutCreate(BaseModel):
    date: _dt.date
    description: Optional[str] = None
    method: Optional[str] = None
    total_paid: float = 0
    category: Optional[str] = None
    property_id: Optional[int] = None
    competencia_month: Optional[int] = None
    competencia_year: Optional[int] = None

class TransactionOutUpdate(BaseModel):
    date: Optional[_dt.date] = None
    description: Optional[str] = None
    method: Optional[str] = None
    total_paid: Optional[float] = None
    category: Optional[str] = None
    property_id: Optional[int] = None
    competencia_month: Optional[int] = None
    competencia_year: Optional[int] = None

class TransactionOutOut(BaseModel):
    id: int
    date: _dt.date
    description: Optional[str]
    method: Optional[str]
    total_paid: float
    category: Optional[str]
    property_id: Optional[int]
    property_name: Optional[str] = None
    competencia_month: Optional[int]
    competencia_year: Optional[int]
    created_at: Optional[_dt.datetime]
    class Config:
        from_attributes = True


# ── Contract ───────────────────────────────────────────
class ContractClientOut(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    class Config:
        from_attributes = True

class ContractCreate(BaseModel):
    type: ContractType = ContractType.HOSPEDAGEM
    client_id: Optional[int] = None
    client_ids: Optional[List[int]] = None  # multiple clients (e.g. couple)
    property_id: Optional[int] = None
    start_date: Optional[_dt.date] = None
    end_date: Optional[_dt.date] = None
    value: float = 0
    status: ContractStatus = ContractStatus.PENDENTE
    signed: bool = False
    notes: Optional[str] = None

class ContractUpdate(BaseModel):
    type: Optional[ContractType] = None
    client_id: Optional[int] = None
    client_ids: Optional[List[int]] = None  # update shared clients
    property_id: Optional[int] = None
    start_date: Optional[_dt.date] = None
    end_date: Optional[_dt.date] = None
    value: Optional[float] = None
    status: Optional[ContractStatus] = None
    signed: Optional[bool] = None
    signature_licensee: Optional[str] = None
    signature_licensor: Optional[str] = None
    notes: Optional[str] = None

class ContractOut(BaseModel):
    id: int
    type: ContractType
    client_id: Optional[int]
    client_name: Optional[str] = None
    client_ids: List[int] = []
    client_names: List[str] = []
    clients: List[ContractClientOut] = []
    property_id: Optional[int]
    property_name: Optional[str] = None
    start_date: Optional[_dt.date]
    end_date: Optional[_dt.date]
    value: float
    status: ContractStatus
    file_url: Optional[str]
    signed: bool
    sign_token: Optional[str] = None
    signature_licensee: Optional[str] = None
    signature_licensor: Optional[str] = None
    notes: Optional[str]
    created_at: Optional[_dt.datetime]
    class Config:
        from_attributes = True


# ── Document ───────────────────────────────────────────
class DocumentOut(BaseModel):
    id: int
    name: str
    type: Optional[str]
    category: Optional[str]
    file_url: Optional[str]
    file_size: int
    property_id: Optional[int]
    property_name: Optional[str] = None
    client_id: Optional[int]
    client_name: Optional[str] = None
    uploaded_at: Optional[_dt.datetime]
    class Config:
        from_attributes = True


# ── Alert ──────────────────────────────────────────────
class AlertOut(BaseModel):
    id: int
    type: AlertType
    severity: AlertSeverity
    message: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    read: bool
    created_at: Optional[_dt.datetime]
    class Config:
        from_attributes = True


# ── Dashboard ──────────────────────────────────────────
class DashboardKPIs(BaseModel):
    receita_bruta: float = 0
    total_opex: float = 0
    ebitda: float = 0
    pro_labore: float = 0
    resultado: float = 0
    capex: float = 0
    free_cash_flow: float = 0
    margem_ebitda_pct: float = 0
    margem_fcf_pct: float = 0
    total_properties: int = 0
    total_clients: int = 0
    aluguel_fixo_total: float = 0

class PnLRow(BaseModel):
    month: int
    year: int
    label: str
    receita: float = 0
    total_revenue: float = 0
    opex_by_category: dict = {}
    total_opex: float = 0
    ebitda: float = 0
    pro_labore: float = 0
    resultado: float = 0
    capex: float = 0
    free_cash_flow: float = 0
    margem_ebitda_pct: float = 0
    margem_fcf_pct: float = 0

class RankingProperty(BaseModel):
    id: int
    code: Optional[str] = None
    name: str
    total_receita: float = 0
    total_despesas: float = 0
    resultado: float = 0
    margin_pct: float = 0
    classification: str = "S/Dados"


# ── Deposit Summary ───────────────────────────────────
class DepositSummaryRow(BaseModel):
    property_id: int
    property_name: str
    deposits_received: float = 0
    deposits_returned: float = 0
    net_balance: float = 0

class DepositSummary(BaseModel):
    total_received: float = 0
    total_returned: float = 0
    total_balance: float = 0
    rows: list[DepositSummaryRow] = []


# ── Client Remarks ────────────────────────────────────
class RemarkCreate(BaseModel):
    text: str

class RemarkOut(BaseModel):
    id: int
    client_id: int
    text: str
    created_by: Optional[str] = None
    created_at: Optional[_dt.datetime] = None
    class Config:
        from_attributes = True


# ── Landlord ──────────────────────────────────────────
class LandlordCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    iban: Optional[str] = None
    notes: Optional[str] = None

class LandlordUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    iban: Optional[str] = None
    notes: Optional[str] = None

class LandlordOut(BaseModel):
    id: int
    code: Optional[str] = None
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    iban: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[_dt.datetime] = None
    property_count: int = 0
    class Config:
        from_attributes = True


# ── HR: Employee ──────────────────────────────────────
class EmployeeCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role_title: Optional[str] = None
    status: str = "ativo"
    hire_date: Optional[_dt.date] = None
    hourly_rate: float = 0
    monthly_salary: float = 0
    vacation_days_year: int = 22
    document_id: Optional[str] = None
    iban: Optional[str] = None
    notes: Optional[str] = None

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role_title: Optional[str] = None
    status: Optional[str] = None
    hire_date: Optional[_dt.date] = None
    hourly_rate: Optional[float] = None
    monthly_salary: Optional[float] = None
    vacation_days_year: Optional[int] = None
    document_id: Optional[str] = None
    iban: Optional[str] = None
    notes: Optional[str] = None

class EmployeeOut(BaseModel):
    id: int
    code: Optional[str] = None
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role_title: Optional[str] = None
    status: str = "ativo"
    hire_date: Optional[_dt.date] = None
    hourly_rate: float = 0
    monthly_salary: float = 0
    vacation_days_year: int = 22
    document_id: Optional[str] = None
    iban: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[_dt.datetime] = None
    class Config:
        from_attributes = True

class TimesheetCreate(BaseModel):
    employee_id: int
    date: _dt.date
    hours: float = 0
    property_id: Optional[int] = None
    description: Optional[str] = None

class TimesheetOut(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    date: _dt.date
    hours: float
    property_id: Optional[int] = None
    property_name: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[_dt.datetime] = None
    class Config:
        from_attributes = True

class PayrollCreate(BaseModel):
    employee_id: int
    month: int
    year: int
    base_salary: float = 0
    hours_worked: float = 0
    hourly_amount: float = 0
    bonus: float = 0
    deductions: float = 0
    total_paid: float = 0
    paid: bool = False
    paid_date: Optional[_dt.date] = None
    notes: Optional[str] = None

class PayrollOut(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    month: int
    year: int
    base_salary: float = 0
    hours_worked: float = 0
    hourly_amount: float = 0
    bonus: float = 0
    deductions: float = 0
    total_paid: float = 0
    paid: bool = False
    paid_date: Optional[_dt.date] = None
    notes: Optional[str] = None
    created_at: Optional[_dt.datetime] = None
    class Config:
        from_attributes = True


# ── Time Off ──────────────────────────────────────────
class TimeOffCreate(BaseModel):
    employee_id: int
    type: str = "ferias"
    start_date: _dt.date
    end_date: _dt.date
    days: int = 1
    reason: Optional[str] = None

class TimeOffUpdate(BaseModel):
    status: Optional[str] = None
    approved_by: Optional[str] = None

class TimeOffOut(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    type: str
    status: str
    start_date: _dt.date
    end_date: _dt.date
    days: int
    reason: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: Optional[_dt.datetime] = None
    class Config:
        from_attributes = True


# ── Email ─────────────────────────────────────────────
class SendContractEmail(BaseModel):
    contract_id: int
    to_email: str
    subject: Optional[str] = "Contrato Ferri Sistem - Para Assinatura"
    message: Optional[str] = None
