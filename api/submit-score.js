const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const ALLOWED_ORIGIN = "https://mario-match-game-five.vercel.app";
const SECRET = process.env.GAME_SECRET || process.env.SUPABASE_SECRET_KEY || "mario_game_secure_salt_2026";

const GAME_LIMITS = {
  easy: { minMoves: 6, maxScore: 900, minTime: 3 },
  medium: { minMoves: 8, maxScore: 1360, minTime: 4 },
  hard: { minMoves: 12, maxScore: 2520, minTime: 6 }
};

module.exports = async (req, res) => {
  const origin = req.headers.origin;

  if (origin === ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!origin || origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ error: "Forbidden: Origin not allowed" });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Server configuration missing" });
    }

    const { username, score, difficulty, moves, time_spent, token } = req.body;

    if (
      !username ||
      score === undefined ||
      !difficulty ||
      moves === undefined ||
      time_spent === undefined
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (typeof username !== "string" || username.trim().length === 0 || username.length > 20) {
      return res.status(400).json({ error: "Invalid username" });
    }

    if (typeof score !== "number" || typeof moves !== "number" || typeof time_spent !== "number") {
      return res.status(400).json({ error: "Invalid numeric values" });
    }

    const limits = GAME_LIMITS[difficulty];
    if (!limits) {
      return res.status(400).json({ error: "Invalid difficulty mode" });
    }

    if (score < 0 || score > limits.maxScore) {
      return res.status(400).json({ error: "Score validation failed: score out of bounds" });
    }

    if (moves < limits.minMoves) {
      return res.status(400).json({ error: "Score validation failed: invalid move count" });
    }

    if (time_spent < limits.minTime) {
      return res.status(400).json({ error: "Score validation failed: invalid time spent" });
    }

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Game session token missing" });
    }

    try {
      const decoded = Buffer.from(token, "base64").toString("utf8");
      const parts = decoded.split(":");
      if (parts.length !== 3) {
        return res.status(400).json({ error: "Invalid game token format" });
      }

      const [tokenTimeStr, tokenDiff, tokenHmac] = parts;
      const tokenTime = parseInt(tokenTimeStr, 10);

      const rawPayload = `${tokenTimeStr}:${tokenDiff}`;
      const expectedHmac = crypto.createHmac("sha256", SECRET).update(rawPayload).digest("hex");

      if (tokenHmac !== expectedHmac) {
        return res.status(400).json({ error: "Game token integrity check failed" });
      }

      if (tokenDiff !== difficulty) {
        return res.status(400).json({ error: "Game token difficulty mismatch" });
      }

      const elapsedMs = Date.now() - tokenTime;
      if (elapsedMs < limits.minTime * 1000) {
        return res.status(400).json({ error: "Game completed unnaturally fast" });
      }
    } catch (e) {
      return res.status(400).json({ error: "Game token verification error" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const cleanName = username.trim().toUpperCase();

    const { data, error } = await supabase
      .from("leaderboard")
      .insert([
        {
          username: cleanName,
          score,
          difficulty,
          moves,
          time_spent
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
