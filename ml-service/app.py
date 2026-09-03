"""
Boafo GH — ML Microservice
Endpoints:
  POST /recommend  — top artisan recommendations for a job
  POST /sentiment  — sentiment analysis of a review text
  POST /batch-sentiment — re-score all reviews for an artisan
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from textblob import TextBlob
import numpy as np
import math
import re

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance between two lat/lon points in km."""
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def normalize(value, min_val, max_val):
    """Min-max normalise a value to [0, 1]."""
    if max_val == min_val:
        return 0.5
    return max(0.0, min(1.0, (value - min_val) / (max_val - min_val)))


def keyword_overlap(text_a, text_b):
    """Simple word-overlap score between two strings, range [0, 1]."""
    if not text_a or not text_b:
        return 0.0
    stop = {'a','an','the','and','or','is','in','of','to','for','with','on','at','by','from'}
    words_a = set(re.findall(r'\w+', text_a.lower())) - stop
    words_b = set(re.findall(r'\w+', text_b.lower())) - stop
    if not words_a or not words_b:
        return 0.0
    return len(words_a & words_b) / len(words_a | words_b)


def analyse_sentiment(text):
    """
    Return a sentiment dict for a piece of text using TextBlob.
    polarity:    -1.0 (very negative) → +1.0 (very positive)
    subjectivity: 0.0 (objective)     → +1.0 (very subjective)
    label:       'positive' | 'neutral' | 'negative'
    score:        0 → 100 (customer-facing friendliness score)
    """
    if not text or not text.strip():
        return {"polarity": 0.0, "subjectivity": 0.0, "label": "neutral", "score": 50}

    blob = TextBlob(text)
    polarity    = round(blob.sentiment.polarity, 4)
    subjectivity = round(blob.sentiment.subjectivity, 4)

    if polarity > 0.1:
        label = "positive"
    elif polarity < -0.1:
        label = "negative"
    else:
        label = "neutral"

    # Convert polarity [-1, 1] → score [0, 100]
    score = round((polarity + 1) / 2 * 100)

    return {
        "polarity":     polarity,
        "subjectivity": subjectivity,
        "label":        label,
        "score":        score,
    }


# ─────────────────────────────────────────────────────────────────────────────
# RECOMMENDATION ENGINE
# ─────────────────────────────────────────────────────────────────────────────

# Feature weights — must sum to 1.0
WEIGHTS = {
    "rating":        0.30,   # avg star rating
    "experience":    0.15,   # years of experience
    "reviews":       0.10,   # number of reviews (social proof)
    "sentiment":     0.20,   # sentiment score of their reviews
    "keyword":       0.15,   # job description ↔ artisan bio overlap
    "price_fit":     0.10,   # how well budget matches price range
}

def score_artisan(artisan, job, all_artisans):
    """
    Compute a weighted recommendation score [0, 100] for one artisan
    relative to a given job request.

    artisan fields expected:
      id, name, avg_rating, experience_yrs, total_reviews,
      sentiment_score (0-100), bio, price_min, price_max,
      lat (optional), lon (optional)

    job fields expected:
      description, budget_min, budget_max,
      lat (optional), lon (optional)
    """
    scores = {}

    # ── Rating (0-5 → 0-1) ──────────────────────────────────────────────────
    rating = float(artisan.get("avg_rating") or 0)
    scores["rating"] = normalize(rating, 0, 5)

    # ── Experience ──────────────────────────────────────────────────────────
    exp = float(artisan.get("experience_yrs") or 0)
    max_exp = max((float(a.get("experience_yrs") or 0) for a in all_artisans), default=1)
    scores["experience"] = normalize(exp, 0, max_exp)

    # ── Review count (log-scaled) ────────────────────────────────────────────
    rev = float(artisan.get("total_reviews") or 0)
    max_rev = max((float(a.get("total_reviews") or 0) for a in all_artisans), default=1)
    scores["reviews"] = normalize(math.log1p(rev), 0, math.log1p(max_rev))

    # ── Sentiment score (0-100 → 0-1) ────────────────────────────────────────
    sent = float(artisan.get("sentiment_score") or 50)
    scores["sentiment"] = normalize(sent, 0, 100)

    # ── Keyword overlap (job description ↔ artisan bio) ──────────────────────
    scores["keyword"] = keyword_overlap(
        job.get("description", ""),
        artisan.get("bio", "")
    )

    # ── Price fit ────────────────────────────────────────────────────────────
    budget_min = job.get("budget_min")
    budget_max = job.get("budget_max")
    price_min  = artisan.get("price_min")
    price_max  = artisan.get("price_max")

    if budget_min and budget_max and price_min and price_max:
        budget_mid = (float(budget_min) + float(budget_max)) / 2
        price_mid  = (float(price_min)  + float(price_max))  / 2
        diff = abs(budget_mid - price_mid)
        max_diff = max(float(budget_max), float(price_max)) or 1
        scores["price_fit"] = max(0.0, 1.0 - diff / max_diff)
    else:
        scores["price_fit"] = 0.5  # neutral when no price info

    # ── Weighted total ────────────────────────────────────────────────────────
    total = sum(WEIGHTS[k] * scores[k] for k in WEIGHTS)
    total_score = round(total * 100, 2)   # 0 → 100

    return {
        "artisan_id":   artisan["id"],
        "name":         artisan["name"],
        "score":        total_score,
        "breakdown": {k: round(v * 100, 1) for k, v in scores.items()},
    }


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "Boafo GH ML Service"})


@app.route("/sentiment", methods=["POST"])
def sentiment():
    """
    Analyse sentiment of a single review text.
    Body: { "text": "..." }
    """
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "text is required"}), 400

    result = analyse_sentiment(data["text"])
    return jsonify(result)


@app.route("/batch-sentiment", methods=["POST"])
def batch_sentiment():
    """
    Analyse sentiment for a list of review texts and return
    an aggregated sentiment score for an artisan.
    Body: { "reviews": ["text1", "text2", ...] }
    """
    data = request.get_json()
    reviews = data.get("reviews", [])

    if not reviews:
        return jsonify({"avg_score": 50, "label": "neutral", "individual": []})

    results = [analyse_sentiment(r) for r in reviews]
    avg_score = round(sum(r["score"] for r in results) / len(results))
    avg_polarity = sum(r["polarity"] for r in results) / len(results)

    if avg_polarity > 0.1:
        label = "positive"
    elif avg_polarity < -0.1:
        label = "negative"
    else:
        label = "neutral"

    return jsonify({
        "avg_score":  avg_score,
        "label":      label,
        "individual": results,
    })


@app.route("/recommend", methods=["POST"])
def recommend():
    """
    Return ranked artisan recommendations for a job.
    Body:
    {
      "job": {
        "description": "...",
        "budget_min": 100,
        "budget_max": 300
      },
      "artisans": [
        {
          "id": 1,
          "name": "...",
          "avg_rating": 4.5,
          "experience_yrs": 5,
          "total_reviews": 20,
          "sentiment_score": 78,
          "bio": "...",
          "price_min": 80,
          "price_max": 250
        },
        ...
      ],
      "top_n": 5
    }
    """
    data = request.get_json()
    job      = data.get("job", {})
    artisans = data.get("artisans", [])
    top_n    = int(data.get("top_n", 5))

    if not artisans:
        return jsonify({"recommendations": []})

    scored = [score_artisan(a, job, artisans) for a in artisans]
    ranked = sorted(scored, key=lambda x: x["score"], reverse=True)

    return jsonify({
        "recommendations": ranked[:top_n],
        "total_scored": len(ranked),
    })


if __name__ == "__main__":
    app.run(port=5001, debug=False)
