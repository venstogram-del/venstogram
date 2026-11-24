from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta, timezone
from app.database.session import get_db
from app.models.entities import User, UsernameListing, UsernameOrder, Transaction, PlatformPolicy
from app.schemas.all_schemas import CreateListingRequest, PlaceBidRequest, BuyVerifiedRequest, UsernameOrderCreate
from app.api.deps import get_current_user

router = APIRouter(prefix="/marketplace", tags=["Usernames & Verified Badge"])

VERIFIED_PRICES = {
    1: {"months": 1, "coins": 1000, "price_sum": 100000, "discount_pct": 0, "label": "1 месяц — 1 000 🪙 (100 000 сум)"},
    3: {"months": 3, "coins": 2490, "price_sum": 249000, "discount_pct": 17, "label": "3 месяца — 2 490 🪙 (-17% скидка)"},
    12: {"months": 12, "coins": 8040, "price_sum": 804000, "discount_pct": 33, "label": "1 год — 8 040 🪙 (-33% скидка)"}
}

@router.get("/policy/username-terms")
async def get_username_policy_terms(db: AsyncSession = Depends(get_db)):
    """
    Returns active platform terms of username ownership.
    """
    res = await db.execute(select(PlatformPolicy).where(PlatformPolicy.key == "username_terms"))
    policy = res.scalars().first()
    if not policy:
        return {
            "title": "Регламент владения и использования никнеймов",
            "content": "Перепродажа и передача никнеймов третьим лицам строго запрещены. Все права регулируются Руководством Venstogram."
        }
    return {
        "title": policy.title,
        "content": policy.content,
        "updated_at": policy.updated_at.isoformat() if policy.updated_at else None
    }


@router.get("/usernames")
async def get_username_listings(
    category: str = "all",
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(UsernameListing)
        .options(selectinload(UsernameListing.seller), selectinload(UsernameListing.highest_bidder))
        .where(UsernameListing.is_sold == False)
    )
    if category != "all":
        query = query.where(UsernameListing.category == category)
    query = query.order_by(UsernameListing.price_usd.asc(), UsernameListing.created_at.desc())
    
    res = await db.execute(query)
    listings = res.scalars().all()
    
    return [
        {
            "id": l.id,
            "username": l.username,
            "price_usd": l.price_usd or 500,
            "price_uzs": l.price_uzs or (l.price_usd or 500) * 13000,
            "current_price_coins": l.current_price_coins,
            "buyout_price_coins": l.buyout_price_coins,
            "category": l.category,
            "seller": {
                "id": l.seller.id,
                "username": l.seller.username,
                "avatar_url": l.seller.avatar_url
            } if l.seller else {"username": "Venstogram Official"},
        }
        for l in listings
    ]


@router.post("/usernames/{listing_id}/order")
async def create_username_order(
    listing_id: int,
    req: UsernameOrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submits a purchase order for a username with an attached receipt screenshot.
    Held pending until Administrator / Director approves.
    """
    res = await db.execute(select(UsernameListing).where(UsernameListing.id == listing_id))
    listing = res.scalars().first()
    if not listing or listing.is_sold:
        raise HTTPException(status_code=400, detail="Этот юзернейм недоступен для покупки")

    # Check if existing pending order by this user
    existing_order = await db.execute(
        select(UsernameOrder).where(
            UsernameOrder.listing_id == listing_id,
            UsernameOrder.buyer_id == current_user.id,
            UsernameOrder.status == "pending"
        )
    )
    if existing_order.scalars().first():
        raise HTTPException(status_code=400, detail="Вы уже отправили заявку на этот юзернейм. Ожидайте решения администратора.")

    order = UsernameOrder(
        listing_id=listing.id,
        username=listing.username,
        buyer_id=current_user.id,
        price_usd=listing.price_usd or 500,
        price_uzs=listing.price_uzs or 6500000.0,
        screenshot_url=req.screenshot_url or req.receipt_url or "",
        status="pending"
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    return {
        "status": "ok",
        "order_id": order.id,
        "message": f"Заявка на покупку @{listing.username} с чеком отправлена! Администратор проверит квитанцию и передаст вам права на никнейм."
    }


@router.post("/usernames/{listing_id}/bid")
async def place_bid(
    listing_id: int,
    req: PlaceBidRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(UsernameListing).where(UsernameListing.id == listing_id))
    listing = res.scalars().first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.is_sold:
        raise HTTPException(status_code=400, detail="Этот юзернейм уже продан")
    if req.bid_coins <= listing.current_price_coins:
        raise HTTPException(status_code=400, detail=f"Ставка должна быть выше {listing.current_price_coins} монет")
    if current_user.wallet_coins < req.bid_coins:
        raise HTTPException(status_code=400, detail="Недостаточно монет на балансе")

    # If previous bidder exists, refund them in real app
    # Update listing
    listing.current_price_coins = req.bid_coins
    listing.highest_bidder_id = current_user.id
    
    # Check if buyout reached
    if req.bid_coins >= listing.buyout_price_coins:
        listing.is_sold = True
        current_user.wallet_coins -= req.bid_coins
        current_user.username = listing.username # Assign new username
        
        tx = Transaction(
            user_id=current_user.id,
            type="username_buy",
            amount_coins=-req.bid_coins,
            description=f"Моментальный выкуп @{listing.username}"
        )
        db.add(tx)

    await db.commit()
    return {
        "status": "ok",
        "current_price": listing.current_price_coins,
        "is_sold": listing.is_sold,
        "message": f"Ставка {req.bid_coins} монет успешно принята!"
    }


@router.post("/usernames/{listing_id}/buyout")
async def buyout_username(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(UsernameListing).where(UsernameListing.id == listing_id))
    listing = res.scalars().first()
    if not listing or listing.is_sold:
        raise HTTPException(status_code=400, detail="Лот недоступен для покупки")

    if current_user.wallet_coins < listing.buyout_price_coins:
        raise HTTPException(status_code=400, detail=f"Недостаточно монет. Цена: {listing.buyout_price_coins}")

    # Transfer coins
    current_user.wallet_coins -= listing.buyout_price_coins
    listing.seller.wallet_coins += int(listing.buyout_price_coins * 0.9) # 10% marketplace fee
    listing.is_sold = True
    listing.highest_bidder_id = current_user.id
    current_user.username = listing.username

    tx = Transaction(
        user_id=current_user.id,
        type="username_buy",
        amount_coins=-listing.buyout_price_coins,
        description=f"Покупка премиум юзернейма @{listing.username}"
    )
    db.add(tx)
    await db.commit()

    return {
        "status": "ok",
        "new_username": current_user.username,
        "message": f"Поздравляем! Юзернейм @{listing.username} теперь ваш!"
    }


@router.get("/verified/plans")
async def get_verified_plans():
    return list(VERIFIED_PRICES.values())


@router.post("/verified/buy")
async def buy_verified(
    req: BuyVerifiedRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if req.months not in VERIFIED_PRICES:
        raise HTTPException(status_code=400, detail="Неверный период подписки")

    plan = VERIFIED_PRICES[req.months]
    cost = plan["coins"]

    if current_user.wallet_coins < cost:
        raise HTTPException(status_code=400, detail=f"Недостаточно монет для покупки подписки ({cost} монет)")

    now = datetime.now(timezone.utc)
    current_user.wallet_coins -= cost
    current_user.is_verified = True
    current_user.verified_until = now + timedelta(days=30 * req.months)

    tx = Transaction(
        user_id=current_user.id,
        type="verified_sub",
        amount_coins=-cost,
        description=f"Подписка Venstogram Verified ({req.months} мес.) + 3x алгоритмический буст"
    )
    db.add(tx)
    await db.commit()

    return {
        "status": "ok",
        "is_verified": True,
        "verified_until": current_user.verified_until.isoformat(),
        "message": "Синяя галочка Venstogram Verified и 3x буст в рекомендациях успешно активированы!"
    }
