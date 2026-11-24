import os
import asyncio
from typing import Optional
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo,
    MenuButtonWebApp
)
from aiogram.enums import ParseMode
from app.core.config import settings

bot: Optional[Bot] = None
dp: Optional[Dispatcher] = None

if settings.BOT_TOKEN:
    bot = Bot(token=settings.BOT_TOKEN)
    dp = Dispatcher()

def get_webapp_keyboard(start_param: str = "", is_admin: bool = False) -> InlineKeyboardMarkup:
    """Builds inline keyboard with launch button into Telegram Mini App with deep link param."""
    base_url = settings.WEBAPP_URL
    app_url = f"{base_url}?startapp={start_param}" if start_param else base_url
    is_https = app_url.startswith("https://")
    
    if is_https:
        main_button = InlineKeyboardButton(
            text="🚀 Открыть Венстограм",
            web_app=WebAppInfo(url=app_url)
        )
        reels_button = InlineKeyboardButton(
            text="🎬 Reels",
            web_app=WebAppInfo(url=f"{base_url}?tab=reels")
        )
        market_button = InlineKeyboardButton(
            text="💎 Маркетплейс юзернеймов",
            web_app=WebAppInfo(url=f"{base_url}?tab=marketplace")
        )
        admin_button = InlineKeyboardButton(
            text="🛡️ Админ-панель (Директор)",
            web_app=WebAppInfo(url=f"{base_url}?tab=admin")
        )
    else:
        # Fallback when running locally over HTTP (Telegram requires HTTPS for WebAppInfo)
        main_button = InlineKeyboardButton(
            text="🚀 Открыть Venstogram (Web)",
            url=app_url
        )
        reels_button = InlineKeyboardButton(
            text="🎬 Reels",
            url=f"{base_url}?tab=reels"
        )
        market_button = InlineKeyboardButton(
            text="💎 Маркетплейс",
            url=f"{base_url}?tab=marketplace"
        )
        admin_button = InlineKeyboardButton(
            text="🛡️ Админ-панель",
            url=f"{base_url}?tab=admin"
        )

    rows = [
        [main_button],
        [reels_button, market_button]
    ]
    if is_admin:
        rows.append([admin_button])

    kb = InlineKeyboardMarkup(inline_keyboard=rows)
    return kb


async def send_bot_push_notification(
    telegram_id: int,
    text: str,
    button_text: str = "Открыть в Venstogram",
    start_param: str = ""
):
    """Sends a formatted push notification to a user's Telegram PM."""
    if not bot:
        return False
    try:
        app_url = f"{settings.WEBAPP_URL}?startapp={start_param}" if start_param else settings.WEBAPP_URL
        kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text=button_text,
                        web_app=WebAppInfo(url=app_url)
                    )
                ]
            ]
        )
        await bot.send_message(
            chat_id=telegram_id,
            text=text,
            reply_markup=kb,
            parse_mode=ParseMode.HTML
        )
        return True
    except Exception as e:
        if settings.DEBUG:
            print(f"[Bot Push] Error sending push to {telegram_id}: {e}")
        return False


if dp is not None:
    @dp.message(CommandStart())
    async def cmd_start(message: types.Message):
        try:
            from app.database.session import AsyncSessionLocal
            from app.models.entities import User
            from sqlalchemy import select

            # Extract deep link payload (e.g. ref_123, post_45, battle_10)
            command_args = message.text.split(maxsplit=1)
            start_param = command_args[1] if len(command_args) > 1 else ""

            user_name = message.from_user.first_name or "друг"
            tg_id = message.from_user.id
            is_admin = tg_id in settings.ADMIN_TELEGRAM_IDS

            # Check and register / update user and referrals
            referrer_user = None
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(User).where(User.telegram_id == tg_id))
                user = res.scalars().first()

                # Handle referral link e.g. ref_1477103854 or ref_5
                if start_param.startswith("ref_"):
                    ref_val = start_param[4:].strip()
                    if ref_val.isdigit():
                        ref_int = int(ref_val)
                        ref_res = await session.execute(
                            select(User).where((User.id == ref_int) | (User.telegram_id == ref_int))
                        )
                        referrer_user = ref_res.scalars().first()

                if not user:
                    user = User(
                        telegram_id=tg_id,
                        username=message.from_user.username or f"user_{tg_id}",
                        first_name=message.from_user.first_name or "",
                        last_name=message.from_user.last_name or "",
                        language_code=message.from_user.language_code or "ru",
                        wallet_coins=100000 if is_admin else 0,
                        referred_by_id=referrer_user.id if referrer_user and referrer_user.id != tg_id else None,
                        referral_code=f"ref_{tg_id}"
                    )
                    session.add(user)
                    await session.commit()
                elif referrer_user and not user.referred_by_id and referrer_user.id != user.id:
                    user.referred_by_id = referrer_user.id
                    await session.commit()
            
            greeting = (
                f"👋 <b>Добро пожаловать в Венстограм!</b>\n"
                f"<b>Первая социальная сеть и медиа-экосистема нового поколения.</b>\n\n"
                f"• 📸 <b>Лента и Stories</b> — делитесь яркими моментами и фото\n"
                f"• 🎬 <b>Reels</b> — вертикальные видео с алгоритмическим бустом в топ\n"
                f"• 🪙 <b>Vensto Coins</b> — монеты платформы для буста видео и подарков в баттлах\n"
                f"• 💎 <b>Маркетплейс редких @никнеймов</b> — эксклюзивные имена и бренды\n"
                f"• 👑 <b>Лига блогеров от Основателя (/quest)</b> — выполни квест и получи Золотую Галочку!\n"
                f"• 📞 <b>Служба техподдержки:</b> <code>+998 50 777 51 52</code>\n"
                f"• 💬 <b>Telegram поддержки:</b> @yuksak_it\n"
                f"• 📧 <b>Официальная почта:</b> <code>venstogram@gmail.com</code>\n\n"
                f"Нажмите кнопку <b>«🚀 Открыть Венстограм»</b> ниже, чтобы начать! 👇"
            )

            try:
                await message.answer(
                    text=greeting,
                    reply_markup=get_webapp_keyboard(start_param, is_admin=is_admin),
                    parse_mode=ParseMode.HTML
                )
            except Exception:
                await message.answer(
                    text=greeting + f"\n\n🔗 Ссылка на приложение: {settings.WEBAPP_URL}",
                    parse_mode=ParseMode.HTML
                )
        except Exception as e:
            print(f"[Bot cmd_start Error] {e}")
            await message.answer(f"Привет, {message.from_user.first_name}! Venstogram активен.")

    @dp.message(Command("quest"))
    async def cmd_quest(message: types.Message):
        """Displays blogger league quest status and personal referral invite link."""
        from app.database.session import AsyncSessionLocal
        from app.models.entities import User, Post, Follower
        from sqlalchemy import select, func

        tg_id = message.from_user.id
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(User).where(User.telegram_id == tg_id))
            user = res.scalars().first()
            if not user:
                await message.answer("Сначала запустите /start для регистрации.")
                return

            # Compute stats
            ref_count_res = await session.execute(select(func.count(User.id)).where(User.referred_by_id == user.id))
            ref_count = ref_count_res.scalar() or 0

            followers_res = await session.execute(select(func.count(Follower.id)).where(Follower.following_id == user.id))
            followers_count = followers_res.scalar() or 0

            posts_res = await session.execute(select(func.count(Post.id)).where(Post.user_id == user.id))
            posts_count = posts_res.scalar() or 0

            views_res = await session.execute(select(func.sum(Post.views_count)).where(Post.user_id == user.id))
            total_views = views_res.scalar() or 0

        bot_username = (await bot.get_me()).username or "venstogrambot"
        ref_link = f"https://t.me/{bot_username}?start=ref_{user.id}"

        quest_text = (
            f"👑 <b>СУПЕР-ИГРА И ЛИГА БЛОГЕРОВ ОТ ОСНОВАТЕЛЯ</b> 👑\n\n"
            f"Докажи преданность и активность, чтобы войти в элиту Venstogram!\n\n"
            f"🎯 <b>Условия победы:</b>\n"
            f"1️⃣ Пригласить друзей: <b>{ref_count}/50</b> {'✅' if ref_count >= 50 else '⏳'}\n"
            f"2️⃣ Набрать подписчиков: <b>{followers_count}/500</b> {'✅' if followers_count >= 500 else '⏳'}\n"
            f"3️⃣ Опубликовать постов: <b>{posts_count}/10</b> {'✅' if posts_count >= 10 else '⏳'}\n"
            f"4️⃣ Суммарные просмотры: <b>{total_views}/5000</b> {'✅' if total_views >= 5000 else '⏳'}\n\n"
            f"🏆 <b>НАГРАДА ПОБЕДИТЕЛЮ:</b>\n"
            f"✨ <b>👑 Золотая Галочка Основателя</b> (х5 к попаданию в рекомендации Reels)\n"
            f"💎 <b>Бесплатный эксклюзивный @никнейм</b> от Директора!\n\n"
            f"🔗 <b>Твоя персональная пригласительная ссылка:</b>\n"
            f"<code>{ref_link}</code>\n\n"
            f"<i>Отправляй друзьям и в свои соцсети — каждый перешедший засчитывается в твой прогресс!</i>"
        )
        await message.answer(quest_text, reply_markup=get_webapp_keyboard("tab_quest"), parse_mode=ParseMode.HTML)

    @dp.message(Command("admin"))
    async def cmd_admin(message: types.Message):
        if message.from_user.id not in settings.ADMIN_TELEGRAM_IDS:
            await message.answer("⛔ Доступ запрещен. Эта команда только для администраторов платформы.")
            return

        text = (
            f"🛡️ <b>Панель управления Venstogram (Директор)</b>\n\n"
            f"Здравствуйте, {message.from_user.first_name}! Ваш аккаунт имеет высшие права доступа:\n\n"
            f"• 💼 <b>Директор:</b> Финансовая аналитика платформы\n"
            f"• ⚖️ <b>Модератор:</b> Очередь жалоб и AI-сканер контента\n"
            f"• ⚙️ <b>IT Admin:</b> Состояние БД и серверов\n"
            f"• 💻 <b>Developer:</b> Системные логи и метрики\n\n"
            f"Нажмите кнопку ниже для перехода в админ-панель:"
        )
        await message.answer(
            text=text,
            reply_markup=get_webapp_keyboard("tab_admin", is_admin=True),
            parse_mode=ParseMode.HTML
        )

    @dp.message(Command("buyers"))
    @dp.message(Command("excel"))
    async def cmd_export_buyers(message: types.Message):
        """Generates and sends the Excel registry of all username buyers directly to Director."""
        if message.from_user.id != 1477103854 and message.from_user.id not in settings.ADMIN_TELEGRAM_IDS:
            await message.answer("⛔ Доступ запрещен. Команда доступна только Директору платформы.")
            return

        status_msg = await message.answer("⏳ <i>Генерирую официальный Excel-реестр всех покупателей никнеймов...</i>", parse_mode=ParseMode.HTML)
        try:
            from app.database.session import AsyncSessionLocal
            from app.core.excel_exporter import generate_buyers_excel_bytes
            from aiogram.types import BufferedInputFile
            from datetime import datetime

            async with AsyncSessionLocal() as session:
                excel_bytes = await generate_buyers_excel_bytes(session)

            filename = f"venstogram_buyers_{datetime.now().strftime('%d_%m_%Y')}.xlsx"
            doc = BufferedInputFile(excel_bytes, filename=filename)
            
            await bot.send_document(
                chat_id=message.chat.id,
                document=doc,
                caption=(
                    f"📑 <b>Реестр покупателей никнеймов VENSTOGRAM</b>\n\n"
                    f"• Полные данные: @никнеймы, Telegram ID, ФИО, год рождения, пол, контакты и суммы.\n"
                    f"• Дата выгрузки: <code>{datetime.now().strftime('%d.%m.%Y %H:%M')}</code>\n\n"
                    f"<i>Файл сформирован автоматически для Директора @venstogram.</i>"
                ),
                parse_mode=ParseMode.HTML
            )
            await status_msg.delete()
        except Exception as err:
            await message.answer(f"❌ Ошибка формирования Excel: {err}")

    @dp.message(Command("help"))
    async def cmd_help(message: types.Message):
        await message.answer(
            "ℹ️ <b>Справка по командам Venstogram Bot:</b>\n\n"
            "/start — Главное меню и запуск приложения\n"
            "/post — Инструкция по быстрой публикации через бота\n"
            "/balance — Проверить свой баланс Vensto Coins\n"
            "/support — Контакты службы технической поддержки\n"
            "/help — Показать эту справку\n\n"
            "🛠 <b>Служба техподдержки:</b>\n"
            "• Телефон: <code>+998 50 777 51 52</code>\n"
            "• Telegram: @yuksak_it (https://t.me/yuksak_it)\n\n"
            "Для полного доступа к соцсети и баттлам нажмите кнопку <b>«Открыть Venstogram App»</b> ниже.",
            reply_markup=get_webapp_keyboard(),
            parse_mode=ParseMode.HTML
        )

    @dp.message(Command("support", "contact"))
    async def cmd_support(message: types.Message):
        support_kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="💬 Написать в Telegram (@yuksak_it)",
                        url="https://t.me/yuksak_it"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="🚀 Открыть Venstogram App",
                        web_app=WebAppInfo(url=settings.WEBAPP_URL)
                    )
                ]
            ]
        )
        await message.answer(
            "🛠 <b>Служба технической поддержки VENSTOGRAM:</b>\n\n"
            "По любым вопросам работы приложения, оплаты монет, покупки никнеймов и техническим проблемам:\n\n"
            "📞 <b>Телефон:</b> <code>+998 50 777 51 52</code>\n"
            "💬 <b>Telegram:</b> @yuksak_it\n"
            "📧 <b>Email:</b> <code>venstogram@gmail.com</code>\n\n"
            "Нажмите кнопку ниже, чтобы перейти в чат со специалистом поддержки:",
            reply_markup=support_kb,
            parse_mode=ParseMode.HTML
        )

    @dp.message(F.photo | F.video)
    async def handle_direct_media_upload(message: types.Message):
        """
        Allows users to create posts in their Venstogram feed directly by sending
        photos or videos to the bot in PM!
        """
        from app.database.session import AsyncSessionLocal
        from app.models.entities import User, Post
        from sqlalchemy import select
        from datetime import datetime, timezone
        from app.core.ai_moderator import ai_moderator

        caption = message.caption or ""
        media_type = "image" if message.photo else "video"
        
        # Get file path from telegram bot
        file_id = message.photo[-1].file_id if message.photo else message.video.file_id
        file_info = await bot.get_file(file_id)
        
        # Save file to uploads
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = ".jpg" if message.photo else ".mp4"
        dest_filename = f"bot_post_{file_info.file_unique_id}{ext}"
        dest_path = os.path.join(settings.UPLOAD_DIR, dest_filename)
        
        await bot.download_file(file_info.file_path, destination=dest_path)
        media_url = f"/uploads/{dest_filename}"

        # AI Moderation
        is_safe, threat_score, flags = ai_moderator.analyze_text(caption)

        async with AsyncSessionLocal() as session:
            res = await session.execute(select(User).where(User.telegram_id == message.from_user.id))
            user = res.scalars().first()
            if not user:
                user = User(
                    telegram_id=message.from_user.id,
                    username=message.from_user.username or f"user_{message.from_user.id}",
                    first_name=message.from_user.first_name or "",
                    last_name=message.from_user.last_name or "",
                    language_code=message.from_user.language_code or "ru",
                    wallet_coins=100000 if message.from_user.id in settings.ADMIN_TELEGRAM_IDS else 0
                )
                session.add(user)
                await session.flush()

            post = Post(
                user_id=user.id,
                caption=caption,
                media_urls=[media_url],
                media_type=media_type,
                is_flagged=not is_safe,
                threat_score=threat_score,
                moderation_status="approved" if is_safe else "pending",
                moderation_reason=", ".join(flags) if flags else None
            )
            session.add(post)
            await session.commit()
            post_id = post.id

        await message.reply(
            f"🎉 <b>Ваша публикация успешно создана в Venstogram!</b>\n\n"
            f"📝 <i>{caption or 'Без подписи'}</i>\n"
            f"📊 Статус модерации: {'✅ Одобрено' if is_safe else '⏳ На проверке'}\n\n"
            f"Посмотреть в Mini App 👇",
            reply_markup=get_webapp_keyboard(f"post_{post_id}"),
            parse_mode=ParseMode.HTML
        )
