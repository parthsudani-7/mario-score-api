const { createClient } = require("@supabase/supabase-js");

const ALLOWED_ORIGIN = "https://mario-match-game-five.vercel.app";

module.exports = async (req, res) => {
  const origin = req.headers.origin;

  if (origin === ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (origin && origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ error: "Forbidden: Origin not allowed" });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Server credentials missing" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const difficulty = req.query.diff || "easy";

    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .eq("difficulty", difficulty)
      .order("score", { ascending: false })
      .order("time_spent", { ascending: true })
      .limit(10);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
