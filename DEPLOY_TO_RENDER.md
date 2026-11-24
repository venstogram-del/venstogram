# 🚀 Инструкция по деплою Venstogram на Render (render.com)

Все необходимые файлы конфигурации (`render.yaml`, `Dockerfile`, `.dockerignore`, `.gitignore`) уже добавлены и закоммичены в локальный Git-репозиторий.

---

## Шаг 1. Создать репозиторий на GitHub и отправить код

1. Зайдите на [github.com/new](https://github.com/new) и создайте новый репозиторий (например, с именем `venstogram-bot`).
2. В терминале в папке `d:\VENSTOGRAMBOT` выполните (замените `ВАШ_ЛОГИН` на ваш логин GitHub):

```bash
git remote add origin https://github.com/ВАШ_ЛОГИН/venstogram-bot.git
git push -u origin main
```

---

## Шаг 2. Развертывание на Render

1. Зайдите на [dashboard.render.com](https://dashboard.render.com/) (войдите через GitHub).
2. Нажмите кнопку **New +** в правом верхнем углу и выберите **Web Service**.
3. В списке подключите ваш репозиторий `venstogram-bot`.
4. Заполните настройки сервиса:
   * **Name**: `venstogram` (или любое другое уникальное имя)
   * **Region**: `Frankfurt (EU)` (ближе всего к СНГ/Узбекистану)
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `python run.py`
   * **Instance Type**: `Free`

5. Разверните раздел **Environment Variables** (переменные окружения) и добавьте:
   * `BOT_TOKEN` = `8787674425:AAE5fLW494MNVRZIt4Uppch6WnhGLA0kBSk`
   * `BOT_USERNAME` = `venstogrambot`
   * `WEBAPP_URL` = `https://venstogram.onrender.com/app/` *(замените `venstogram` на выбранное вами имя)*
   * `SECRET_KEY` = `venstogram_secret_jwt_key_2026_super_secure_token`
   * `DEBUG` = `False`
   * `PYTHON_VERSION` = `3.11.9`

6. Нажмите **Deploy Web Service** (или **Create Web Service**).

---

## Шаг 3. Проверка работы

После завершения сборки (1-2 минуты):
1. Ваш сервис получит постоянный бесплатный HTTPS-адрес:  
   `https://<имя-сервиса>.onrender.com`
2. Mini App будет доступен по адресу:  
   `https://<имя-сервиса>.onrender.com/app/`
3. Swagger документация:  
   `https://<имя-сервиса>.onrender.com/docs`
4. Telegram-бот автоматически запустит long polling и будет принимать сообщения!

---

## 💡 Лайфхак: Как сделать, чтобы бесплатный Render не засыпал (24/7 онлайн)

На бесплатном тарифе Render сервис засыпает после 15 минут бездействия.  
Чтобы бот работал **круглосуточно и без остановок**:
1. Зарегистрируйтесь на бесплатном сервисе [cron-job.org](https://cron-job.org) или [uptimerobot.com](https://uptimerobot.com).
2. Создайте монитор/задачу, которая раз в **10 минут** делает обычный GET-запрос по адресу:  
   `https://<имя-сервиса>.onrender.com/docs`
3. Это не дает Render отключить контейнер, и бот будет мгновенно отвечать пользователям в Telegram 24/7!
