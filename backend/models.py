from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, DateTime, Text,
    ForeignKey, Enum as SQLEnum, Table
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


# -- Enums --
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    FINANCEIRO = "financeiro"
    OPERACIONAL = "operacional"
    VISUALIZADOR = "visualizador"
    CLIENTE = "cliente"

class PropertyType(str, enum.Enum):
    CASA = "casa"
    APARTAMENTO = "apartamento"
    QUARTO = "quarto"
    ESTUDIO = "estudio"
    OUTRO = "outro"

class PropertyStatus(str, enum.Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"
    EM_NEGOCIACAO = "em_negociacao"

class ClientStatus(str, enum.Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"
    PROSPECTO = "prospecto"
    ENCERRADO = "encerrado"

class ContractType(str, enum.Enum):
    ALUGUEL = "aluguel"
    HOSPEDAGEM = "hospedagem"
    PARCERIA = "parceria"

class ContractStatus(str, enum.Enum):
    VIGENTE = "vigente"
    EXPIRADO = "expirado"
    CANCELADO = "cancelado"
    PENDENTE = "pendente"

class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class AlertType(str, enum.Enum):
    CONTRATO_VENCENDO = "contrato_vencendo"
    PROPRIEDADE_ATENCAO = "propriedade_atencao"
    PAGAMENTO_ATRASADO = "pagamento_atrasado"
    CHECKOUT_PROXIMO = "checkout_proximo"
    DESPESA_ACIMA_MEDIA = "despesa_acima_media"
    DOCUMENTO_PENDENTE = "documento_pendente"
    PROPRIEDADE_VAZIA = "propriedade_vazia"
    ALUGUEL_FIXO_PENDENTE = "aluguel_fixo_pendente"

class MaintenanceStatus(str, enum.Enum):
    ABERTO = "aberto"
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDO = "concluido"
    CANCELADO = "cancelado"

class MaintenancePriority(str, enum.Enum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    URGENTE = "urgente"

class RoomType(str, enum.Enum):
    INDIVIDUAL = "individual"
    CASAL = "casal"
    COMPARTILHADO = "compartilhado"
    STUDIO = "studio"
    CASA_INTEIRA = "casa_inteira"


# -- Models --
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # nullable for social-only users
    role = Column(SQLEnum(UserRole), default=UserRole.VISUALIZADOR)
    active = Column(Boolean, default=True)
    social_provider = Column(String(50), nullable=True)  # "google" or "apple"
    social_id = Column(String(255), nullable=True)  # provider's user ID or token
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Property(Base):
    __tablename__ = "properties"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True)
    name = Column(String(200), nullable=False)
    address = Column(String(300))
    monthly_rent = Column(Float, default=0)
    contract_start = Column(Date)
    contract_end = Column(Date)
    type = Column(SQLEnum(PropertyType), default=PropertyType.APARTAMENTO)
    owner_name = Column(String(150))
    owner_contact = Column(String(200))
    landlord_id = Column(Integer, ForeignKey("landlords.id"), nullable=True)
    status = Column(SQLEnum(PropertyStatus), default=PropertyStatus.ATIVO, index=True)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    landlord = relationship("Landlord", back_populates="properties")
    clients = relationship("Client", back_populates="property")
    transactions_in = relationship("TransactionIn", back_populates="property")
    transactions_out = relationship("TransactionOut", back_populates="property")
    contracts = relationship("Contract", back_populates="property")
    documents = relationship("Document", back_populates="property")
    rooms = relationship("Room", back_populates="property", cascade="all, delete-orphan")
    remarks = relationship("PropertyRemark", back_populates="property", order_by="PropertyRemark.created_at.desc()")


class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    room_type = Column(SQLEnum(RoomType), default=RoomType.INDIVIDUAL)
    num_beds = Column(Integer, default=1)
    monthly_value = Column(Float, default=0)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    property = relationship("Property", back_populates="rooms")
    beds = relationship("Bed", back_populates="room", cascade="all, delete-orphan")
    clients = relationship("Client", back_populates="room")
    payments = relationship("TransactionIn", back_populates="room")


class Bed(Base):
    __tablename__ = "beds"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    monthly_value = Column(Float, default=0)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    room = relationship("Room", back_populates="beds")
    clients = relationship("Client", back_populates="bed")
    payments = relationship("TransactionIn", back_populates="bed")


class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150))
    phone = Column(String(50))
    nationality = Column(String(80))
    birth_date = Column(Date)
    document_id = Column(String(50))
    status = Column(SQLEnum(ClientStatus), default=ClientStatus.ATIVO, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True, index=True)
    bed_id = Column(Integer, ForeignKey("beds.id"), nullable=True, index=True)
    check_in = Column(Date)
    check_out = Column(Date)
    monthly_value = Column(Float, default=0)
    payment_method = Column(String(50))
    referencia = Column(String(200))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    property = relationship("Property", back_populates="clients")
    room = relationship("Room", back_populates="clients")
    bed = relationship("Bed", back_populates="clients")
    contracts = relationship("Contract", back_populates="client")
    documents = relationship("Document", back_populates="client")
    payments = relationship("TransactionIn", back_populates="client")
    remarks = relationship("ClientRemark", back_populates="client", order_by="ClientRemark.created_at.desc()")


class TransactionIn(Base):
    __tablename__ = "transactions_in"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    description = Column(String(300))
    method = Column(String(50))
    amount = Column(Float, default=0)
    category = Column(String(80), index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True, index=True)
    bed_id = Column(Integer, ForeignKey("beds.id"), nullable=True, index=True)
    competencia_month = Column(Integer, index=True)
    competencia_year = Column(Integer, index=True)
    invoice = Column(String(100))
    lodgement = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    property = relationship("Property", back_populates="transactions_in")
    client = relationship("Client", back_populates="payments")
    room = relationship("Room", back_populates="payments")
    bed = relationship("Bed", back_populates="payments")


class TransactionOut(Base):
    __tablename__ = "transactions_out"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    description = Column(String(300))
    method = Column(String(50))
    total_paid = Column(Float, default=0)
    category = Column(String(80), index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True, index=True)
    competencia_month = Column(Integer, index=True)
    competencia_year = Column(Integer, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    property = relationship("Property", back_populates="transactions_out")


# Many-to-many: contracts can have multiple clients (e.g. couples sharing a room)
contract_clients = Table(
    "contract_clients",
    Base.metadata,
    Column("contract_id", Integer, ForeignKey("contracts.id", ondelete="CASCADE"), primary_key=True),
    Column("client_id", Integer, ForeignKey("clients.id", ondelete="CASCADE"), primary_key=True),
)


class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(SQLEnum(ContractType), default=ContractType.HOSPEDAGEM)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True, index=True)  # primary client (backward compat)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True, index=True)
    start_date = Column(Date)
    end_date = Column(Date)
    value = Column(Float, default=0)
    status = Column(SQLEnum(ContractStatus), default=ContractStatus.PENDENTE, index=True)
    file_url = Column(String(500))
    signed = Column(Boolean, default=False)
    sign_token = Column(String(64), unique=True, nullable=True, index=True)  # token unico para link publico de assinatura
    signature_licensee = Column(Text, nullable=True)  # base64 PNG da assinatura do licensee
    signature_licensor = Column(Text, nullable=True)  # base64 PNG da assinatura do licensor
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    client = relationship("Client", back_populates="contracts", foreign_keys=[client_id])
    property = relationship("Property", back_populates="contracts")
    clients = relationship("Client", secondary=contract_clients, backref="shared_contracts")


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    type = Column(String(80))
    category = Column(String(80))
    file_url = Column(String(500))
    file_size = Column(Integer, default=0)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True, index=True)
    uploaded_at = Column(DateTime, server_default=func.now())
    property = relationship("Property", back_populates="documents")
    client = relationship("Client", back_populates="documents")


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(SQLEnum(AlertType))
    severity = Column(SQLEnum(AlertSeverity), default=AlertSeverity.INFO)
    message = Column(String(500), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class ClientRemark(Base):
    __tablename__ = "client_remarks"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    created_by = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    client = relationship("Client", back_populates="remarks")


class PropertyRemark(Base):
    __tablename__ = "property_remarks"
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    created_by = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    property = relationship("Property", back_populates="remarks")


class Landlord(Base):
    __tablename__ = "landlords"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(150))
    phone = Column(String(50))
    address = Column(String(300))
    iban = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    properties = relationship("Property", back_populates="landlord")


class EmployeeStatus(str, enum.Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"
    FERIAS = "ferias"
    DESLIGADO = "desligado"

class TimeOffType(str, enum.Enum):
    FERIAS = "ferias"
    SICK_DAY = "sick_day"
    LICENCA = "licenca"
    FOLGA = "folga"

class TimeOffStatus(str, enum.Enum):
    PENDENTE = "pendente"
    APROVADO = "aprovado"
    REJEITADO = "rejeitado"
    CANCELADO = "cancelado"


class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(150))
    phone = Column(String(50))
    role_title = Column(String(100))  # e.g. "Cleaning", "Maintenance", "Manager"
    status = Column(SQLEnum(EmployeeStatus), default=EmployeeStatus.ATIVO)
    hire_date = Column(Date)
    hourly_rate = Column(Float, default=0)
    monthly_salary = Column(Float, default=0)
    document_id = Column(String(50))
    iban = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    vacation_days_year = Column(Integer, default=22)  # annual vacation allowance
    timesheets = relationship("Timesheet", back_populates="employee", cascade="all, delete-orphan")
    payrolls = relationship("Payroll", back_populates="employee", cascade="all, delete-orphan")
    time_offs = relationship("TimeOff", back_populates="employee", cascade="all, delete-orphan")
    employee_documents = relationship("EmployeeDocument", back_populates="employee", cascade="all, delete-orphan")
    employee_remarks = relationship("EmployeeRemark", back_populates="employee", cascade="all, delete-orphan")
    performance_reviews = relationship("PerformanceReview", back_populates="employee", cascade="all, delete-orphan")


class Timesheet(Base):
    __tablename__ = "timesheets"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    hours = Column(Float, default=0)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True, index=True)
    description = Column(String(300))
    created_at = Column(DateTime, server_default=func.now())
    employee = relationship("Employee", back_populates="timesheets")
    property = relationship("Property")


class Payroll(Base):
    __tablename__ = "payrolls"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    base_salary = Column(Float, default=0)
    hours_worked = Column(Float, default=0)
    hourly_amount = Column(Float, default=0)
    bonus = Column(Float, default=0)
    deductions = Column(Float, default=0)
    total_paid = Column(Float, default=0)
    paid = Column(Boolean, default=False)
    paid_date = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    employee = relationship("Employee", back_populates="payrolls")


class TimeOff(Base):
    __tablename__ = "time_offs"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    type = Column(SQLEnum(TimeOffType), default=TimeOffType.FERIAS)
    status = Column(SQLEnum(TimeOffStatus), default=TimeOffStatus.PENDENTE)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days = Column(Integer, default=1)
    reason = Column(String(300))
    approved_by = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    employee = relationship("Employee", back_populates="time_offs")


class EmployeeDocument(Base):
    __tablename__ = "employee_documents"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    name = Column(String(200), nullable=False)
    type = Column(String(80))
    file_url = Column(String(500))
    file_size = Column(Integer, default=0)
    uploaded_at = Column(DateTime, server_default=func.now())
    employee = relationship("Employee", back_populates="employee_documents")


class EmployeeRemark(Base):
    __tablename__ = "employee_remarks"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    text = Column(Text, nullable=False)
    created_by = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    employee = relationship("Employee", back_populates="employee_remarks")


class PerformanceReview(Base):
    __tablename__ = "performance_reviews"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    reviewer_name = Column(String(100))
    period = Column(String(50))  # e.g. "2026-Q1", "2026-01"
    rating = Column(Integer, default=3)  # 1-5
    punctuality = Column(Integer, default=3)
    quality = Column(Integer, default=3)
    teamwork = Column(Integer, default=3)
    communication = Column(Integer, default=3)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    employee = relationship("Employee", back_populates="performance_reviews")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String(100))
    action = Column(String(50), nullable=False)  # create, update, delete
    entity_type = Column(String(50), nullable=False)  # client, property, contract, etc
    entity_id = Column(Integer)
    details = Column(Text)
    ip_address = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())


class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text)
    category = Column(String(50))


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(SQLEnum(MaintenanceStatus), default=MaintenanceStatus.ABERTO)
    priority = Column(SQLEnum(MaintenancePriority), default=MaintenancePriority.MEDIA)
    cost = Column(Float, default=0)
    created_by = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    resolved_at = Column(DateTime, nullable=True)
    property = relationship("Property")


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    sender_type = Column(String(20), nullable=False)  # "client" or "admin"
    sender_name = Column(String(200))
    subject = Column(String(500))
    body = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    client = relationship("Client", backref="messages")


class News(Base):
    __tablename__ = "news"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    category = Column(String(100), default="geral")  # geral, manutencao, evento, promo
    image_url = Column(String(500))
    published = Column(Boolean, default=True)
    created_by = Column(String(200))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class RewardPoints(Base):
    __tablename__ = "reward_points"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False, unique=True)
    total_points = Column(Integer, default=0)
    level = Column(String(50), default="Bronze")  # Bronze, Silver, Gold, Platinum
    streak_months = Column(Integer, default=0)  # consecutive months paid on time
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    client = relationship("Client", backref="reward_points")


class RewardTransaction(Base):
    __tablename__ = "reward_transactions"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    points = Column(Integer, nullable=False)  # positive = earned, negative = redeemed
    type = Column(String(50), nullable=False)  # rent_payment, on_time_bonus, referral, redemption, streak_bonus
    description = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())

    client = relationship("Client", backref="reward_transactions")


class CheckInOut(Base):
    __tablename__ = "checkinouts"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    type = Column(String(20), nullable=False)  # "check_in" or "check_out"
    date = Column(DateTime, server_default=func.now())
    notes = Column(Text)
    confirmed_by_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    client = relationship("Client", backref="checkinouts")
    property = relationship("Property", backref="checkinouts")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text)
    category = Column(String(100), default="geral")  # geral, limpeza, localizacao, conforto, atendimento
    created_at = Column(DateTime, server_default=func.now())

    client = relationship("Client", backref="reviews")
    property = relationship("Property", backref="reviews")

class FAQ(Base):
    __tablename__ = "faqs"
    id = Column(Integer, primary_key=True, index=True)
    question = Column(String(1000), nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String(100), default="geral")  # geral, pagamentos, manutencao, regras, zona
    order = Column(Integer, default=0)
    published = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class Referral(Base):
    __tablename__ = "referrals"
    id = Column(Integer, primary_key=True, index=True)
    referrer_client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    referred_name = Column(String(200), nullable=False)
    referred_email = Column(String(200))
    referred_phone = Column(String(50))
    status = Column(String(50), default="pending")  # pending, contacted, converted, expired
    bonus_points = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    referrer = relationship("Client", backref="referrals")
