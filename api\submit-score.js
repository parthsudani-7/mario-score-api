const { createClient } = require("@supabase/supabase-js");

const ALLOWED_ORIGIN = "https://parthsudani-7.github.io";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const origin = req.headers.origin;

  if (origin !== ALLOWED_ORIGIN) {
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
