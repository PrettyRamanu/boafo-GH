const pool = require('../config/db');
const { getRecommendations, getSentiment, getBatchSentiment } = require('../utils/mlClient');

// ── POST /api/ml/recommend ────────────────────────────────────────────────
// Get top artisan recommendations for a given job
exports.recommend = async (req, res) => {
  try {
    const { job_id, description, budget_min, budget_max, category_id } = req.body;

    // Build job object
    const job = { description: description || '', budget_min, budget_max };

    // If a real job_id was provided, enrich from DB
    if (job_id) {
      const jobResult = await pool.query('SELECT * FROM jobs WHERE id=$1', [job_id]);
      if (jobResult.rows.length) {
        const j = jobResult.rows[0];
        job.description = j.description || description || '';
        job.budget_min  = j.budget_min  || budget_min;
        job.budget_max  = j.budget_max  || budget_max;
      }
    }

    // Fetch artisans for the given category
    const conditions = ['a.is_active=TRUE', 'a.is_verified=TRUE'];
    const params = [];
    if (category_id) {
      params.push(category_id);
      conditions.push(`a.category_id=$${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const artisanResult = await pool.query(`
      SELECT a.id, a.name, a.avg_rating, a.experience_yrs, a.total_reviews,
             a.bio, a.price_min, a.price_max, a.location,
             a.profile_photo, a.is_verified,
             c.name AS category, c.icon AS category_icon,
             COALESCE(
               (SELECT ROUND(((AVG(polarity)+1)/2)*100)
                FROM (
                  SELECT (r.rating / 5.0 - 0.5) * 2 AS polarity
                  FROM reviews r WHERE r.artisan_id = a.id
                ) sub
               ), 50
             ) AS sentiment_score
      FROM artisans a
      LEFT JOIN categories c ON a.category_id=c.id
      ${where}
      ORDER BY a.avg_rating DESC
      LIMIT 50
    `, params);

    if (!artisanResult.rows.length) {
      return res.json({ recommendations: [], total_scored: 0 });
    }

    // Call ML service
    const mlResult = await getRecommendations(job, artisanResult.rows, 5);

    // Enrich recommendations with full artisan data
    const artisanMap = {};
    artisanResult.rows.forEach(a => { artisanMap[a.id] = a; });

    const enriched = mlResult.recommendations.map(rec => ({
      ...rec,
      artisan: artisanMap[rec.artisan_id] || null,
    }));

    res.json({ recommendations: enriched, total_scored: mlResult.total_scored });
  } catch (err) {
    console.error('[ML Controller] recommend error:', err);
    res.status(500).json({ error: 'Recommendation failed' });
  }
};

// ── POST /api/ml/sentiment ────────────────────────────────────────────────
// Analyse sentiment of a single text
exports.sentiment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    const result = await getSentiment(text);
    res.json(result);
  } catch (err) {
    console.error('[ML Controller] sentiment error:', err);
    res.status(500).json({ error: 'Sentiment analysis failed' });
  }
};

// ── GET /api/ml/artisan/:id/sentiment ────────────────────────────────────
// Get aggregated sentiment for all reviews of an artisan
exports.artisanSentiment = async (req, res) => {
  try {
    const { id } = req.params;

    const reviews = await pool.query(
      'SELECT comment FROM reviews WHERE artisan_id=$1 AND comment IS NOT NULL AND comment != \'\'',
      [id]
    );

    if (!reviews.rows.length) {
      return res.json({ avg_score: 50, label: 'neutral', individual: [], total: 0 });
    }

    const texts = reviews.rows.map(r => r.comment);
    const result = await getBatchSentiment(texts);
    res.json({ ...result, total: texts.length });
  } catch (err) {
    console.error('[ML Controller] artisan sentiment error:', err);
    res.status(500).json({ error: 'Sentiment analysis failed' });
  }
};
