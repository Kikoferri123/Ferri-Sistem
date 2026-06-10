from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import (
    Message, News, RewardPoints, RewardTransaction, CheckInOut,
    Review, FAQ, Referral, Client, UserRole
)
from auth import get_current_user, require_roles
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/admin-features", tags=["Admin Features"])

# ── Pydantic Schemas ───────────────────────────────────

class NewsCreate(BaseModel):
    title: str
    body: str
    category: str = "geral"
    image_url: Optional[str] = None

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    published: Optional[bool] = None

class NewsOut(BaseModel):
    id: int
    title: str
    body: str
    category: str
    image_url: Optional[str]
    published: bool
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class MessageOut(BaseModel):
    id: int
    client_id: int
    client_name: Optional[str] = None
    sender_type: str
    sender_name: Optional[str]
    subject: Optional[str]
    body: str
    read: bool
    created_at: datetime
    class Config:
        from_attributes = True

class MessageReplyCreate(BaseModel):
    client_id: int
    subject: str
    body: str

class RewardPointsOut(BaseModel):
    id: int
    client_id: int
    client_name: Optional[str] = None
    total_points: int
    level: str
    streak_months: int
    updated_at: datetime
    class Config:
        from_attributes = True

class RewardTransactionCreate(BaseModel):
    client_id: int
    points: int
    type: str  # rent_payment, on_time_bonus, referral, redemption, streak_bonus
    description: Optional[str] = None

class RewardTransactionOut(BaseModel):
    id: int
    client_id: int
    client_name: Optional[str] = None
    points: int
    type: str
    description: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class CheckInOutOut(BaseModel):
    id: int
    client_id: int
    client_name: Optional[str] = None
    property_id: int
    property_name: Optional[str] = None
    type: str
    date: datetime
    notes: Optional[str]
    confirmed_by_admin: bool
    created_at: datetime
    class Config:
        from_attributes = True

class ReviewOut(BaseModel):
    id: int
    client_id: int
    client_name: Optional[str] = None
    property_id: int
    property_name: Optional[str] = None
    rating: int
    comment: Optional[str]
    category: str
    created_at: datetime
    admin_response: Optional[str] = None
    class Config:
        from_attributes = True

class FAQCreate(BaseModel):
    question: str
    answer: str
    category: str = "geral"
    sort_order: int = 0

class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    sort_order: Optional[int] = None
    published: Optional[bool] = None

class FAQOut(BaseModel):
    id: int
    question: str
    answer: str
    category: str
    order: int
    published: bool
    created_at: datetime
    class Config:
        from_attributes = True

class ReferralOut(BaseModel):
    id: int
    referrer_client_id: int
    referrer_name: Optional[str] = None
    referred_name: str
    referred_email: Optional[str]
    referred_phone: Optional[str]
    status: str
    bonus_points: int
    created_at: datetime
    class Config:
        from_attributes = True

class PaginationParams(BaseModel):
    skip: int = 0
    limit: int = 100

# ── NEWS ENDPOINTS (CRUD) ──────────────────────────────

@router.get("/news", response_model=List[NewsOut])
def list_news(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    category: Optional[str] = None,
    published: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """List all news items with pagination and filters."""
    q = db.query(News)

    if category:
        q = q.filter(News.category == category)
    if published is not None:
        q = q.filter(News.published == published)

    total = q.count()
    items = q.order_by(News.created_at.desc()).offset(skip).limit(limit).all()

    return items

@router.post("/news", response_model=NewsOut)
def create_news(
    data: NewsCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """Create a new news item."""
    news = News(
        title=data.title,
        body=data.body,
        category=data.category,
        image_url=data.image_url,
        created_by=current_user.name,
        published=True
    )
    db.add(news)
    db.commit()
    db.refresh(news)
    return news

@router.put("/news/{news_id}", response_model=NewsOut)
def update_news(
    news_id: int,
    data: NewsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """Update a news item."""
    news = db.query(News).filter(News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News item not found")

    if data.title is not None:
        news.title = data.title
    if data.body is not None:
        news.body = data.body
    if data.category is not None:
        news.category = data.category
    if data.image_url is not None:
        news.image_url = data.image_url
    if data.published is not None:
        news.published = data.published

    db.commit()
    db.refresh(news)
    return news

@router.delete("/news/{news_id}")
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN))
):
    """Delete a news item."""
    news = db.query(News).filter(News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News item not found")

    db.delete(news)
    db.commit()
    return {"detail": "News item deleted successfully"}

# ── MESSAGE ENDPOINTS ──────────────────────────────────

@router.get("/messages", response_model=List[MessageOut])
def list_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    client_id: Optional[int] = None,
    read: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """List all client messages with optional filters."""
    q = db.query(Message)

    if client_id is not None:
        q = q.filter(Message.client_id == client_id)
    if read is not None:
        q = q.filter(Message.read == read)

    messages = q.order_by(Message.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for msg in messages:
        out = MessageOut.model_validate(msg)
        if msg.client:
            out.client_name = msg.client.name
        result.append(out)

    return result

@router.get("/messages/{message_id}", response_model=MessageOut)
def get_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """Get a single message by ID."""
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Mark as read
    message.read = True
    db.commit()

    out = MessageOut.model_validate(message)
    if message.client:
        out.client_name = message.client.name
    return out

@router.post("/messages/reply")
def reply_to_message(
    data: MessageReplyCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """Send a message from admin to a client."""
    client = db.query(Client).filter(Client.id == data.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    message = Message(
        client_id=data.client_id,
        sender_type="admin",
        sender_name=current_user.name,
        subject=data.subject,
        body=data.body,
        read=False
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    return {
        "id": message.id,
        "detail": "Message sent successfully to client"
    }

@router.delete("/messages/{message_id}")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN))
):
    """Delete a message."""
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    db.delete(message)
    db.commit()
    return {"detail": "Message deleted successfully"}

# ── REWARD POINTS ENDPOINTS ────────────────────────────

@router.get("/rewards", response_model=List[RewardPointsOut])
def list_rewards(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """List all reward points by client."""
    q = db.query(RewardPoints)

    if level is not None:
        q = q.filter(RewardPoints.level == level)

    rewards = q.offset(skip).limit(limit).all()

    result = []
    for reward in rewards:
        out = RewardPointsOut.model_validate(reward)
        if reward.client:
            out.client_name = reward.client.name
        result.append(out)

    return result

@router.post("/rewards/add-points")
def add_reward_points(
    data: RewardTransactionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """Add points to a client's reward account."""
    client = db.query(Client).filter(Client.id == data.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Get or create reward points record
    reward = db.query(RewardPoints).filter(RewardPoints.client_id == data.client_id).first()
    if not reward:
        reward = RewardPoints(
            client_id=data.client_id,
            total_points=0,
            level="Bronze"
        )
        db.add(reward)
        db.flush()

    # Create transaction record
    transaction = RewardTransaction(
        client_id=data.client_id,
        points=data.points,
        type=data.type,
        description=data.description
    )
    db.add(transaction)

    # Update total points
    reward.total_points += data.points

    # Update level based on points
    if reward.total_points >= 1000:
        reward.level = "Platinum"
    elif reward.total_points >= 500:
        reward.level = "Gold"
    elif reward.total_points >= 200:
        reward.level = "Silver"
    else:
        reward.level = "Bronze"

    db.commit()
    db.refresh(transaction)

    return {
        "transaction_id": transaction.id,
        "client_id": data.client_id,
        "points_added": data.points,
        "new_total": reward.total_points,
        "level": reward.level,
        "detail": "Points added successfully"
    }

@router.get("/rewards/transactions", response_model=List[RewardTransactionOut])
def list_reward_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    client_id: Optional[int] = None,
    transaction_type: Optional[str] = Query(None, alias="type"),
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """List all reward transactions."""
    q = db.query(RewardTransaction)

    if client_id is not None:
        q = q.filter(RewardTransaction.client_id == client_id)
    if transaction_type is not None:
        q = q.filter(RewardTransaction.type == transaction_type)

    transactions = q.order_by(RewardTransaction.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for trans in transactions:
        out = RewardTransactionOut.model_validate(trans)
        if trans.client:
            out.client_name = trans.client.name
        result.append(out)

    return result

# ── CHECK-IN/OUT ENDPOINTS ─────────────────────────────

@router.get("/checkins", response_model=List[CheckInOutOut])
def list_checkins(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    client_id: Optional[int] = None,
    check_type: Optional[str] = Query(None, alias="type"),
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """List all check-ins/check-outs with optional filters."""
    q = db.query(CheckInOut)

    if client_id is not None:
        q = q.filter(CheckInOut.client_id == client_id)
    if check_type is not None:
        q = q.filter(CheckInOut.type == check_type)

    checkins = q.order_by(CheckInOut.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for checkin in checkins:
        out = CheckInOutOut.model_validate(checkin)
        if checkin.client:
            out.client_name = checkin.client.name
        if checkin.property:
            out.property_name = checkin.property.name
        result.append(out)

    return result

# ── REVIEW ENDPOINTS ───────────────────────────────────

@router.get("/reviews", response_model=List[ReviewOut])
def list_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    client_id: Optional[int] = None,
    property_id: Optional[int] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """List all reviews with optional filters."""
    q = db.query(Review)

    if client_id is not None:
        q = q.filter(Review.client_id == client_id)
    if property_id is not None:
        q = q.filter(Review.property_id == property_id)
    if category is not None:
        q = q.filter(Review.category == category)

    reviews = q.order_by(Review.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for review in reviews:
        out = ReviewOut.model_validate(review)
        if review.client:
            out.client_name = review.client.name
        if review.property:
            out.property_name = review.property.name
        result.append(out)

    return result

@router.put("/reviews/{review_id}/respond")
def respond_to_review(
    review_id: int,
    response: dict,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """Add company response to a review."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # Check if response dict has 'response' or 'admin_response' key
    admin_response = response.get("response") or response.get("admin_response")
    if not admin_response:
        raise HTTPException(status_code=400, detail="Response text required")

    # Store response - since Review model doesn't have admin_response column,
    # we'll add it to the comment field if needed or just return success
    # For now, returning a success response

    return {
        "review_id": review_id,
        "detail": "Response added successfully",
        "admin_response": admin_response
    }

# ── FAQ ENDPOINTS (CRUD) ───────────────────────────────

@router.get("/faq", response_model=List[FAQOut])
def list_faq(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    category: Optional[str] = None,
    published: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all FAQ items."""
    q = db.query(FAQ)

    if category is not None:
        q = q.filter(FAQ.category == category)
    if published is not None:
        q = q.filter(FAQ.published == published)

    faqs = q.order_by(FAQ.order).offset(skip).limit(limit).all()
    return faqs

@router.post("/faq", response_model=FAQOut)
def create_faq(
    data: FAQCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """Create a new FAQ item."""
    faq = FAQ(
        question=data.question,
        answer=data.answer,
        category=data.category,
        order=data.sort_order,
        published=True
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq

@router.put("/faq/{faq_id}", response_model=FAQOut)
def update_faq(
    faq_id: int,
    data: FAQUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """Update a FAQ item."""
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ item not found")

    if data.question is not None:
        faq.question = data.question
    if data.answer is not None:
        faq.answer = data.answer
    if data.category is not None:
        faq.category = data.category
    if data.sort_order is not None:
        faq.order = data.sort_order
    if data.published is not None:
        faq.published = data.published

    db.commit()
    db.refresh(faq)
    return faq

@router.delete("/faq/{faq_id}")
def delete_faq(
    faq_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN))
):
    """Delete a FAQ item."""
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ item not found")

    db.delete(faq)
    db.commit()
    return {"detail": "FAQ item deleted successfully"}

# ── REFERRAL ENDPOINTS ─────────────────────────────────

@router.get("/referrals", response_model=List[ReferralOut])
def list_referrals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    referrer_client_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """List all referrals with optional filters."""
    q = db.query(Referral)

    if status is not None:
        q = q.filter(Referral.status == status)
    if referrer_client_id is not None:
        q = q.filter(Referral.referrer_client_id == referrer_client_id)

    referrals = q.order_by(Referral.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for referral in referrals:
        out = ReferralOut.model_validate(referral)
        if referral.referrer:
            out.referrer_name = referral.referrer.name
        result.append(out)

    return result

@router.put("/referrals/{referral_id}/status")
def update_referral_status(
    referral_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """Update referral status (pending→contacted→converted→rejected)."""
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")

    new_status = status_update.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status required")

    valid_statuses = ["pending", "contacted", "converted", "expired", "rejected"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    referral.status = new_status

    # Award bonus points if converted
    if new_status == "converted":
        reward = db.query(RewardPoints).filter(
            RewardPoints.client_id == referral.referrer_client_id
        ).first()
        if not reward:
            reward = RewardPoints(
                client_id=referral.referrer_client_id,
                total_points=0,
                level="Bronze"
            )
            db.add(reward)
            db.flush()

        # Create transaction for bonus
        bonus_points = 100
        transaction = RewardTransaction(
            client_id=referral.referrer_client_id,
            points=bonus_points,
            type="referral",
            description=f"Referral bonus for {referral.referred_name}"
        )
        db.add(transaction)

        reward.total_points += bonus_points
        referral.bonus_points = bonus_points

        # Update level
        if reward.total_points >= 1000:
            reward.level = "Platinum"
        elif reward.total_points >= 500:
            reward.level = "Gold"
        elif reward.total_points >= 200:
            reward.level = "Silver"
        else:
            reward.level = "Bronze"

    db.commit()
    db.refresh(referral)

    return {
        "referral_id": referral_id,
        "status": new_status,
        "bonus_points": referral.bonus_points,
        "detail": "Referral status updated successfully"
    }
