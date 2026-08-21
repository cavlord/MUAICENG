# Telegram Makeup Bot

## Setup

1. **Bikin bot Telegram**
   - Chat `@BotFather` di Telegram → `/newbot` → catat token-nya

2. **Dapetin Gemini API key**
   - Ke https://aistudio.google.com/apikey → generate key gratis

3. **Deploy ke Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

4. **Set environment variables** di Vercel dashboard (Settings → Environment Variables):
   - `TELEGRAM_BOT_TOKEN` = token dari BotFather
   - `GEMINI_API_KEY` = key dari AI Studio

5. **Set webhook Telegram** ke URL Vercel lo (run sekali aja, ganti placeholder):
   ```bash
   curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<your-app>.vercel.app/api/webhook"
   ```

6. **Test** — kirim foto ke bot di Telegram, tunggu balasan.

## Catatan
- Gemini Flash free tier ada rate limit (cek limit terbaru di AI Studio), cukup buat testing/personal use.
- Kalau mau ganti ke GPT-4o-mini atau Claude, tinggal ganti fungsi `analyzeWithGemini` sesuai format API masing-masing.
- Timeout function di-set 30s (`vercel.json`) buat jaga-jaga kalau Gemini agak lambat respond.
