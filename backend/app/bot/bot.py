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
    """Builds inline keyboard with launch button into Telegram Mini App."""
    import time
    base_url = settings.WEBAPP_URL
    delim = "&" if "?" in base_url else "?"
    app_url = f"{base_url}{delim}startapp={start_param}&t={int(time.time())}" if start_param else f"{base_url}{delim}t={int(time.time())}"
    is_https = app_url.startswith("https://")
    
    if is_https:
        main_button = InlineKeyboardButton(
            text="🚀 Открыть Venstogram",
            web_app=WebAppInfo(url=app_url)
        )
    else:
        main_button = InlineKeyboardButton(
            text="🚀 Открыть Venstogram",
            url=app_url
        )

    return InlineKeyboardMarkup(inline_keyboard=[[main_button]])


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


_known_telegram_ids: set[int] = set()
_db_semaphore = asyncio.Semaphore(15)

async def init_bot_cache():
    """Pre-loads known telegram user IDs into memory for sub-millisecond bot response times under massive load."""
    try:
        from app.database.session import AsyncSessionLocal
        from app.models.entities import User
        from sqlalchemy import select
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(User.telegram_id).where(User.telegram_id.is_not(None)))
            ids = res.scalars().all()
            _known_telegram_ids.update(ids)
            print(f"[Bot Cache] Pre-warmed {len(_known_telegram_ids)} known telegram IDs in memory.")
    except Exception as e:
        print(f"[Bot Cache Warning] {e}")

async def _process_user_start(tg_id: int, username: Optional[str], first_name: str, last_name: str, language_code: str, start_param: str, is_admin: bool):
    """Asynchronous background worker: non-blocking DB user and referral sync with concurrency control."""
    if tg_id in _known_telegram_ids and not start_param.startswith("ref_"):
        return

    async with _db_semaphore:
        try:
            from app.database.session import AsyncSessionLocal
            from app.models.entities import User
            from sqlalchemy import select

            async with AsyncSessionLocal() as session:
                res = await session.execute(select(User).where(User.telegram_id == tg_id))
                user = res.scalars().first()

                referrer_user = None
                if start_param.startswith("ref_"):
                    ref_val = start_param[4:].strip()
                    if ref_val.isdigit():
                        ref_int = int(ref_val)
                        ref_res = await session.execute(
                            select(User).where((User.id == ref_int) | (User.telegram_id == ref_int))
                        )
                        referrer_user = ref_res.scalars().first()

                if not user:
                    base_username = username or f"user_{tg_id}"
                    existing_u = (await session.execute(select(User.id).where(User.username == base_username))).scalars().first()
                    final_username = f"user_{tg_id}" if existing_u else base_username

                    user = User(
                        telegram_id=tg_id,
                        username=final_username,
                        first_name=first_name or "",
                        last_name=last_name or "",
                        language_code=language_code or "ru",
                        wallet_coins=100000 if is_admin else 0,
                        referred_by_id=referrer_user.id if referrer_user and referrer_user.telegram_id != tg_id else None,
                        referral_code=f"ref_{tg_id}",
                        is_registered=True if is_admin else False
                    )
                    session.add(user)
                    try:
                        await session.commit()
                        _known_telegram_ids.add(tg_id)
                    except Exception:
                        await session.rollback()
                else:
                    _known_telegram_ids.add(tg_id)
                    if referrer_user and not user.referred_by_id and referrer_user.id != user.id and referrer_user.telegram_id != tg_id:
                        user.referred_by_id = referrer_user.id
                        try:
                            await session.commit()
                        except Exception:
                            await session.rollback()
        except Exception as err:
            if settings.DEBUG:
                print(f"[Bot Background User Start Error] {err}")

if dp is not None:
    @dp.message(CommandStart())
    async def cmd_start(message: types.Message):
        try:
            # Extract deep link payload (e.g. ref_123, post_45, battle_10)
            command_args = (message.text or "").split(maxsplit=1)
            start_param = command_args[1] if len(command_args) > 1 else ""

            user_name = message.from_user.first_name or "друг"
            tg_id = message.from_user.id
            is_admin = tg_id in settings.ADMIN_TELEGRAM_IDS

            # 1. Non-blocking background persistence queue
            asyncio.create_task(
                _process_user_start(
                    tg_id=tg_id,
                    username=message.from_user.username,
                    first_name=message.from_user.first_name or "",
                    last_name=message.from_user.last_name or "",
                    language_code=message.from_user.language_code or "ru",
                    start_param=start_param,
                    is_admin=is_admin
                )
            )

            # 2. Instant multi-language greeting response (< 2ms) without inline button
            user_lang = (message.from_user.language_code or "ru").lower()
            if user_lang.startswith("uz"):
                greeting = (
                    "👋 <b>Venstogram-ga xush kelibsiz</b> — yangi avlod ijtimoiy tarmog'i va media ekotizimi."
                )
            elif user_lang.startswith("en"):
                greeting = (
                    "👋 <b>Welcome to Venstogram</b> — the next-generation social network and media ecosystem."
                )
            else:
                greeting = (
                    "👋 <b>Добро пожаловать в Venstogram</b> — первая социальная сеть и медиаэкосистема нового поколения."
                )

            try:
                await message.answer(
                    text=greeting,
                    parse_mode=ParseMode.HTML
                )
            except Exception:
                await message.answer(
                    text=greeting.replace("<b>", "").replace("</b>", "")
                )
        except Exception as e:
            print(f"[Bot cmd_start Error] {e}")
            try:
                await message.answer(f"Привет, {message.from_user.first_name}! Venstogram активен.")
            except Exception:
                pass

    @dp.message(Command("quest"))
    async def cmd_quest(message: types.Message):
        """Displays blogger league quest status and personal referral invite link."""
        from app.database.session import AsyncSessionLocal
        from app.models.entities import User, Post, Follow
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

            followers_res = await session.execute(select(func.count(Follow.id)).where(Follow.following_id == user.id))
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

    @dp.message(Command("grant", "gift"))
    async def cmd_grant_username(message: types.Message):
        """Allows Founder/Director to gift/grant any exclusive username to another user in 1 command."""
        tg_id = message.from_user.id
        if tg_id != 1477103854 and tg_id not in settings.ADMIN_TELEGRAM_IDS:
            await message.answer("⛔ Доступ запрещен. Команда доступна только Основателю платформы.")
            return

        parts = message.text.strip().split()
        if len(parts) < 3:
            await message.answer(
                "👑 <b>Вручение эксклюзивного никнейма от Основателя</b>\n\n"
                "<b>Формат команды:</b>\n"
                "<code>/grant &lt;никнейм&gt; &lt;получатель&gt;</code>\n\n"
                "<b>Примеры:</b>\n"
                "• <code>/grant uzbekiston 1477103854</code>\n"
                "• <code>/grant uzbekiston @shoxrux</code>\n\n"
                "<i>Никнейм моментально передаётся пользователю с верификацией и поздравлением!</i>",
                parse_mode=ParseMode.HTML
            )
            return

        desired_username = parts[1].strip().lower().replace("@", "")
        target_str = parts[2].strip().replace("@", "")

        from app.database.session import AsyncSessionLocal
        from app.models.entities import User, UsernameListing
        from sqlalchemy import select, func
        from datetime import datetime, timezone, timedelta

        async with AsyncSessionLocal() as session:
            # Find recipient by ID, Telegram ID, or @username
            if target_str.isdigit():
                t_int = int(target_str)
                res = await session.execute(
                    select(User).where((User.telegram_id == t_int) | (User.id == t_int))
                )
            else:
                res = await session.execute(
                    select(User).where(func.lower(User.username) == target_str.lower())
                )
            recipient = res.scalars().first()

            if not recipient:
                await message.answer(f"❌ Пользователь <code>{target_str}</code> не найден в базе Venstogram.")
                return

            # Reassign any previous holder
            other_res = await session.execute(
                select(User).where(func.lower(User.username) == desired_username, User.id != recipient.id)
            )
            other_user = other_res.scalars().first()
            if other_user:
                other_user.username = f"user_{other_user.telegram_id}"

            # Update or create marketplace listing
            m_res = await session.execute(
                select(UsernameListing).where(func.lower(UsernameListing.username) == desired_username)
            )
            listing = m_res.scalars().first()
            if listing:
                listing.is_sold = True
                listing.highest_bidder_id = recipient.id
            else:
                new_listing = UsernameListing(
                    username=desired_username,
                    seller_id=recipient.id,
                    category="exclusive",
                    current_price_coins=0,
                    buyout_price_coins=0,
                    price_uzs=0.0,
                    price_usd=0,
                    is_sold=True,
                    highest_bidder_id=recipient.id,
                    expires_at=datetime.now(timezone.utc) + timedelta(days=365)
                )
                session.add(new_listing)

            old_name = recipient.username
            recipient.username = desired_username
            recipient.is_verified = True

            await session.commit()

        # Send push notification to recipient
        await send_bot_push_notification(
            telegram_id=recipient.telegram_id,
            text=(
                f"👑 <b>ЛИЧНЫЙ ПОДАРОК ОТ ОСНОВАТЕЛЯ VENSTOGRAM!</b>\n\n"
                f"Здравствуйте, {recipient.first_name}!\n"
                f"Основатель платформы лично вручил вам эксклюзивный никнейм: <b>@{desired_username}</b>!\n"
                f"Ваш профиль официально подтвержден и верифицирован. Поздравляем!"
            ),
            button_text="🚀 Открыть мой профиль",
            start_param="tab_profile"
        )

        await message.answer(
            f"🎉 <b>Никнейм успешно вручен!</b>\n\n"
            f"• Эксклюзивный никнейм: <b>@{desired_username}</b>\n"
            f"• Получатель: <b>{recipient.first_name}</b> (ID: <code>{recipient.id}</code>, TG: <code>{recipient.telegram_id}</code>)\n"
            f"• Предыдущий ник: @{old_name}\n"
            f"• Верификация: <b>Активна (✓)</b>\n\n"
            f"Пользователь получил поздравление в личные сообщения бота!",
            parse_mode=ParseMode.HTML
        )

    @dp.message(Command("reserved"))
    async def cmd_reserved(message: types.Message):
        """Displays Director's reserved usernames and status."""
        tg_id = message.from_user.id
        if tg_id != 1477103854 and tg_id not in settings.ADMIN_TELEGRAM_IDS:
            await message.answer("⛔ Доступ разрешен только Директору платформы.")
            return

        from app.database.session import AsyncSessionLocal
        from app.models.entities import User
        from sqlalchemy import select, func

        reserved_list = [
            "sherzodbek",
            "kamolov",
            "abdulazizbek",
            "habibahon",
            "sohibahon",
            "shodmonoy",
            "abdullohbek"
        ]

        async with AsyncSessionLocal() as session:
            res = await session.execute(select(User).where(func.lower(User.username).in_(reserved_list)))
            users_by_name = {u.username.lower(): u for u in res.scalars().all()}

        lines = []
        for name in reserved_list:
            holder = users_by_name.get(name)
            if holder:
                lines.append(f"• <b>@{name}</b> — 🎁 Вручен: {holder.first_name} (ID: <code>{holder.id}</code>, TG: <code>{holder.telegram_id}</code>)")
            else:
                lines.append(f"• <b>@{name}</b> — 🔒 <i>В резерве Директора (готов к подарку)</i>")

        reply_text = (
            "👑 <b>ЗАКРЫТЫЙ РЕЗЕРВ НИКНЕЙМОВ ДИРЕКТОРА</b>\n\n"
            "Эти имена <b>не продаются</b> в общем маркетплейсе и закреплены за вами. Вы можете подарить любое из них бесплатно в любой момент:\n\n"
            + "\n".join(lines) + "\n\n"
            "<b>Как подарить через бота:</b>\n"
            "<code>/grant &lt;никнейм&gt; &lt;ID или @юзер&gt;</code>\n"
            "<i>Пример: <code>/grant sherzodbek 1477103854</code></i>"
        )
        await message.answer(reply_text, parse_mode=ParseMode.HTML)

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

    MALICIOUS_SECURITY_PATTERNS = [
        "ignore instructions", "system prompt", "jailbreak", "prompt injection",
        "dan mode", "act as", "forget rules", "bypass security", "disregard all",
        "drop table", "union select", "select * from", "<script", "javascript:",
        "rm -rf", "exec(", "eval(", "os.system", "subprocess", "взлом",
        "хакер", "ddos", "ддос", "слив базы"
    ]

    def is_malicious_prank(text: str) -> bool:
        if not text:
            return False
        lower = text.lower().strip()
        for pat in MALICIOUS_SECURITY_PATTERNS:
            if pat in lower:
                return True
        return False

    @dp.message(F.text)
    async def handle_text_messages(message: types.Message):
        """Processes incoming text messages, auto-detects pranks/attacks, bans abusers and logs security incidents."""
        text = message.text or ""
        tg_id = message.from_user.id
        
        # Don't ban admins
        is_admin = tg_id in settings.ADMIN_TELEGRAM_IDS or tg_id == 1477103854

        if not is_admin and is_malicious_prank(text):
            from app.database.session import AsyncSessionLocal
            from app.models.entities import User, AdminAuditLog
            from sqlalchemy import select

            try:
                async with AsyncSessionLocal() as session:
                    res = await session.execute(select(User).where(User.telegram_id == tg_id))
                    user = res.scalars().first()
                    if user:
                        user.role = "banned"
                        user.warnings_count = 3
                    
                    audit = AdminAuditLog(
                        admin_id=None,
                        action="security_ban",
                        details={
                            "reason": "Вредоносный запрос / атака / пранк на бота",
                            "text": text[:200],
                            "telegram_id": tg_id,
                            "username": message.from_user.username
                        }
                    )
                    session.add(audit)
                    await session.commit()
            except Exception as e:
                print(f"[Security Ban Error] {e}")

            await message.reply(
                "⛔ <b>ДОСТУП ЗАБЛОКИРОВАН СИСТЕМОЙ БЕЗОПАСНОСТИ</b>\n\n"
                "Зафиксирована попытка вредоносного запроса, атаки или недопустимого пранка. "
                "Ваш аккаунт навсегда заблокирован в Venstogram, а данные инцидента занесены в журнал кибербезопасности Директора.",
                parse_mode=ParseMode.HTML
            )
            return

        # Polite fallback for ordinary chat messages
        await message.reply(
            f"👋 Здравствуйте, {message.from_user.first_name}!\n\n"
            "Venstogram работает в формате Telegram Mini App. Нажмите кнопку ниже для перехода в соцсеть:",
            reply_markup=get_webapp_keyboard(),
            parse_mode=ParseMode.HTML
        )
