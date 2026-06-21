const { createClient } = require("@supabase/supabase-js");

const ALLOWED_ORIGINS = [
  "https://parthsudani-7.github.io",
  "https://mario-match-game-five.vercel.app"
];

module.exports = async (req, res) => {
  const origin = req.headers.origin;

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  if (!ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({
      error: "Forbidden: Invalid origin"
    });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );

    const {
      username,
      score,
      difficulty,
      moves,
      time_spent
    } = req.body;

    if (
      !username ||
      score === undefined ||
      !difficulty ||
      moves === undefined ||
      time_spent === undefined
    ) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    if (typeof username !== "string" || username.length > 30) {
      return res.status(400).json({
        error: "Invalid username"
      });
    }

    if (
      typeof score !== "number" ||
      typeof moves !== "number" ||
      typeof time_spent !== "number"
    ) {
      return res.status(400).json({
        error: "Invalid numeric values"
      });
    }

    const { data, error } = await supabase
      .from("leaderboard")
      .insert([
        {
          username,
          score,
          difficulty,
          moves,
          time_spent
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
};
