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
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submits a coin purchase request. Coins are credited ONLY after Director confirmation in Admin Panel!
    """
    from app.models.entities import CoinOrder
    from app.bot.bot import send_bot_push_notification

    try:
        amount_coins = int(req.get("amount_coins", 500))
    except (ValueError, TypeError):
        amount_coins = 500

    if amount_coins <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть больше нуля")

    payment_method = str(req.get("payment_method", "card"))
    receipt_url = str(req.get("receipt_url", "") or "")
    note = str(req.get("note", "") or "")

    total_uzs = amount_coins * settings.COIN_PRICE_UZS

    order = CoinOrder(
        user_id=current_user.id,
        amount_coins=amount_coins,
        amount_uzs=total_uzs,
        payment_method=payment_method,
        receipt_url=receipt_url,
        note=note,
        status="pending"
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    # Notify Founder Director about new coin purchase request
    for admin_tg_id in settings.ADMIN_TELEGRAM_IDS:
        await send_bot_push_notification(
            telegram_id=admin_tg_id,
            text=(
                f"💰 <b>НОВАЯ ЗАЯВКА НА ПОКУПКУ МОНЕТ!</b>\n\n"
                f"• Пользователь: <b>{current_user.first_name}</b> (@{current_user.username})\n"
                f"• Telegram ID: <code>{current_user.telegram_id}</code>\n"
                f"• Заказ: <b>+{amount_coins:,} 🪙 ({total_uzs:,.0f} сум)</b>\n"
                f"• Способ: {payment_method.upper()}\n"
                f"• ID заявки: #{order.id}\n\n"
                f"<i>Проверьте поступление средств и подтвердите в Админ-панели!</i>"
            ),
            button_text="🛡️ Открыть Админ-панель",
            start_param="tab_admin"
        )

    return {
        "status": "pending",
        "order_id": order.id,
        "amount_coins": amount_coins,
        "amount_uzs": total_uzs,
        "message": "Заявка на покупку монет отправлена! Монеты будут зачислены сразу после проверки оплаты Администрацией."
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
