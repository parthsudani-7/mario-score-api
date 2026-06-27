const crypto = require("crypto");

const ALLOWED_ORIGIN = "https://mario-match-game-five.vercel.app";
const SECRET = process.env.GAME_SECRET || process.env.SUPABASE_SECRET_KEY || "mario_game_secure_salt_2026";

module.exports = async (req, res) => {
  const origin = req.headers.origin;

  if (origin === ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (origin && origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ error: "Forbidden: Origin not allowed" });
  }

  const difficulty = req.query?.diff || req.body?.difficulty || "easy";
  const timestamp = Date.now();
  const rawPayload = `${timestamp}:${difficulty}`;
  const hmac = crypto.createHmac("sha256", SECRET).update(rawPayload).digest("hex");
  const token = Buffer.from(`${rawPayload}:${hmac}`).toString("base64");

  return res.status(200).json({ success: true, token });
};
