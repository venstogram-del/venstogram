import io
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.models.entities import UsernameOrder, User

async def generate_buyers_excel_bytes(db: AsyncSession) -> bytes:
    """
    Generates a beautifully formatted Excel report (.xlsx)
    containing all buyers of premium usernames, their full personal data,
    Telegram IDs, contact info, and payment details for the Director.
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Покупатели Никнеймов"

    # Styling definitions
    title_font = Font(name="Segoe UI", size=15, bold=True, color="FFFFFF")
    title_fill = PatternFill(start_color="1E1B4B", end_color="1E1B4B", fill_type="solid") # Deep Indigo
    
    header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="BE185D", end_color="BE185D", fill_type="solid") # Vensto Pink/Rose

    data_font = Font(name="Segoe UI", size=10)
    data_font_bold = Font(name="Segoe UI", size=10, bold=True)
    
    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )

    # 1. Title Banner
    ws.merge_cells("A1:M1")
    title_cell = ws["A1"]
    title_cell.value = f"VENSTOGRAM — РЕЕСТР ПОКУПАТЕЛЕЙ ПРЕМИУМ НИКНЕЙМОВ (Выгрузка: {datetime.now().strftime('%d.%m.%Y %H:%M')})"
    title_cell.font = title_font
    title_cell.fill = title_fill
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 40

    # 2. Header Row
    headers = [
        "№ Заказа",
        "Купленный Никнейм",
        "Цена ($ USD)",
        "Сумма (UZS)",
        "Telegram ID",
        "Telegram Никнейм",
        "Имя Покупателя",
        "Фамилия",
        "Отчество",
        "Дата / Год Рождения",
        "Пол",
        "Email",
        "Дата Покупки",
        "Статус Оплаты"
    ]

    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=2, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin_border

    ws.row_dimensions[2].height = 28

    # 3. Fetch Orders with Buyer info
    res = await db.execute(
        select(UsernameOrder)
        .options(selectinload(UsernameOrder.buyer), selectinload(UsernameOrder.listing))
        .order_by(desc(UsernameOrder.created_at))
    )
    orders = res.scalars().all()

    current_row = 3
    for ord_obj in orders:
        buyer: User = ord_obj.buyer
        
        # Determine status text
        status_map = {
            "approve": "Одобрено (Владелец) ✅",
            "approved": "Одобрено (Владелец) ✅",
            "pending": "В ожидании проверки ⏳",
            "reject": "Отклонено ❌",
            "rejected": "Отклонено ❌"
        }
        status_label = status_map.get(ord_obj.status, ord_obj.status)

        birth_info = ""
        if buyer:
            if buyer.birth_date:
                birth_info = buyer.birth_date
            elif buyer.birth_year:
                birth_info = f"{buyer.birth_year} г.р."

        row_data = [
            ord_obj.id,
            f"@{ord_obj.username}",
            ord_obj.price_usd or 500,
            f"{(ord_obj.price_uzs or 6500000.0):,.0f} сум",
            buyer.telegram_id if buyer else "—",
            f"@{buyer.username}" if (buyer and buyer.username) else "—",
            buyer.first_name if buyer else "—",
            buyer.last_name if (buyer and buyer.last_name) else "—",
            buyer.middle_name if (buyer and buyer.middle_name) else "—",
            birth_info or "—",
            buyer.gender if (buyer and buyer.gender) else "—",
            buyer.email if (buyer and buyer.email) else "—",
            ord_obj.created_at.strftime("%d.%m.%Y %H:%M") if ord_obj.created_at else "—",
            status_label
        ]

        for col_idx, val in enumerate(row_data, 1):
            cell = ws.cell(row=current_row, column=col_idx, value=val)
            cell.font = data_font_bold if col_idx in [1, 2, 3] else data_font
            cell.border = thin_border
            
            # Alignments
            if col_idx in [1, 3, 4, 5, 10, 11, 13]:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")

            # Alternate row background
            if current_row % 2 == 0:
                cell.fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")

        ws.row_dimensions[current_row].height = 22
        current_row += 1

    # Auto-adjust column widths
    from openpyxl.utils import get_column_letter
    for col_idx, col in enumerate(ws.columns, 1):
        max_len = 0
        col_letter = get_column_letter(col_idx)
        for cell in col:
            if cell.row == 1:
                continue
            val_str = str(cell.value or "")
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(max_len + 3, 14)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output.getvalue()
