// api/webhook.js
// Vercel serverless function — Telegram webhook untuk bot rekomendasi makeup

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Bot is alive");
  }

  const update = req.body;
  const message = update.message;

  if (!message) return res.status(200).send("ok");

  const chatId = message.chat.id;

  try {
    // Kalau user kirim foto
    if (message.photo && message.photo.length > 0) {
      await sendMessage(chatId, "Lagi dianalisa fotonya, tunggu sebentar ya...");

      // Ambil foto resolusi paling besar
      const fileId = message.photo[message.photo.length - 1].file_id;
      const imageBase64 = await downloadTelegramPhoto(fileId);

      const recommendation = await analyzeWithGemini(imageBase64);

      await sendMessage(chatId, recommendation);
    } else {
      await sendMessage(
        chatId,
        "Kirim foto wajah kamu (tanpa makeup, pencahayaan terang) buat dapet rekomendasi makeup ya!"
      );
    }
  } catch (err) {
    console.error(err);
    await sendMessage(chatId, "Waduh, ada error pas proses foto. Coba lagi ya.");
  }

  return res.status(200).send("ok");
}

// ---- Helper: download foto dari Telegram, convert ke base64 ----
async function downloadTelegramPhoto(fileId) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  // 1. Dapetin file path dari Telegram
  const fileInfoRes = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`
  );
  const fileInfo = await fileInfoRes.json();
  const filePath = fileInfo.result.file_path;

  // 2. Download file-nya
  const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`;
  const imageRes = await fetch(fileUrl);
  const arrayBuffer = await imageRes.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return base64;
}

// ---- Helper: kirim ke Gemini Flash buat analisa ----
async function analyzeWithGemini(imageBase64) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  const prompt = `Kamu adalah beauty advisor profesional. Analisa foto wajah ini dan berikan rekomendasi makeup dalam Bahasa Indonesia dengan format berikut:

1. Skin tone & undertone (warm/cool/neutral)
2. Bentuk wajah (kalau kelihatan)
3. Rekomendasi shade foundation/concealer
4. Rekomendasi warna blush & lipstick yang cocok
5. Tips singkat kalau ada (misal: highlight area, contour)

Jawab singkat, padat, dan praktis. Jangan bertele-tele.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await response.json();

  if (data.error) {
    console.error("Gemini error:", data.error);
    return "Maaf, gagal analisa foto. Coba lagi nanti.";
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Ga bisa dapet hasil analisa.";
}

// ---- Helper: kirim pesan ke user via Telegram ----
async function sendMessage(chatId, text) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
