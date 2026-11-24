from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database.session import get_db
from app.models.entities import User, Transaction
from app.schemas.all_schemas import TopUpRequest, WithdrawRequest, VerifyPinRequest
from app.api.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/wallet", tags=["Wallet & Payments"])

@router.get("/balance")
async def get_wallet_balance(current_user: User = Depends(get_current_user)):
    return {
        "coins": current_user.wallet_coins,
        "uzs": current_user.wallet_uzs,
        "coin_rate_uzs": settings.COIN_PRICE_UZS,
        "has_pin": bool(current_user.wallet_pin),
        "biometric_enabled": current_user.biometric_enabled
    }


@router.post("/verify-pin")
async def verify_pin(
    req: VerifyPinRequest,
    current_user: User = Depends(get_current_user)
):
    if not current_user.wallet_pin:
        # If user has no PIN yet, treat first input as setting new PIN
        return {"valid": True, "message": "No PIN configured"}
    
    if current_user.wallet_pin == req.pin:
        return {"valid": True, "message": "PIN verified successfully"}
    else:
        raise HTTPException(status_code=400, detail="Неверный PIN-код")


@router.post("/topup")
async def topup_balance(
    req: TopUpRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Simulates / triggers local payment gateway (Click, Payme, Uzum) or Telegram Stars.
    Credits Vensto Coins to user wallet.
    """
    if req.amount_coins <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть больше нуля")

    total_uzs = req.amount_coins * settings.COIN_PRICE_UZS
    
    current_user.wallet_coins += req.amount_coins
    
    tx = Transaction(
        user_id=current_user.id,
        type="deposit",
        amount_coins=req.amount_coins,
        amount_uzs=total_uzs,
        payment_method=req.payment_method,
        status="completed",
        description=f"Пополнение баланса через {req.payment_method.upper()} (+{req.amount_coins} монет)"
    )
    db.add(tx)
    await db.commit()

    return {
        "status": "ok",
        "new_coins": current_user.wallet_coins,
        "amount_uzs": total_uzs,
        "message": f"Баланс успешно пополнен на {req.amount_coins} Vensto Coins"
    }


@router.post("/withdraw")
async def request_withdrawal(
    req: WithdrawRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submits a withdrawal request to Uzbek local card (Uzcard/Humo/Visa/Mastercard) with PIN verification.
    """
    # 1. Verify PIN if set
    if current_user.wallet_pin and current_user.wallet_pin != req.pin:
        raise HTTPException(status_code=400, detail="Неверный PIN-код подтверждения")

    # 2. Check balance in UZS
    # Coins can be converted to UZS or direct UZS balance
    coins_equivalent = int(req.amount_uzs / settings.COIN_PRICE_UZS)
    
    if current_user.wallet_coins < coins_equivalent:
        raise HTTPException(status_code=400, detail="Недостаточно средств на балансе для вывода")

    # Deduct coins
    current_user.wallet_coins -= coins_equivalent

    tx = Transaction(
        user_id=current_user.id,
        type="withdrawal",
        amount_coins=-coins_equivalent,
        amount_uzs=req.amount_uzs,
        payment_method="bank_card",
        status="pending",
        description=f"Заявка на вывод: {req.amount_uzs:,.0f} UZS на карту {req.card_number[:4]}****{req.card_number[-4:]} ({req.recipient_name})"
    )
    db.add(tx)
    await db.commit()

    return {
        "status": "ok",
        "remaining_coins": current_user.wallet_coins,
        "message": f"Заявка на вывод {req.amount_uzs:,.0f} UZS принята в обработку."
    }


@router.get("/transactions")
async def get_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Transaction).where(Transaction.user_id == current_user.id).order_by(desc(Transaction.created_at)).limit(30)
    )
    txs = res.scalars().all()
    return [
        {
            "id": t.id,
            "type": t.type,
            "amount_coins": t.amount_coins,
            "amount_uzs": t.amount_uzs,
            "payment_method": t.payment_method,
            "status": t.status,
            "description": t.description,
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in txs
    ]
