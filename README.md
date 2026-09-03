# Boafo GH
**Connecting Skilled Tradespeople to Customers Across Ghana**

## Setup

### 1. Database
```bash
psql -U postgres -c "CREATE DATABASE boafo_gh;"
psql -U postgres -d boafo_gh -f server/schema.sql
```
Or use Railway: New Project → PostgreSQL → paste schema.sql in Query console.

### 2. Server
```bash
cd server
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, email config
node server.js
```

### 3. ML Service
```bash
cd ml-service
pip install -r requirements.txt
python download_nltk.py   # run once
python app.py             # runs on port 5001
```

### 4. Client
```bash
cd client
npm install
npm run dev   # visit http://localhost:3000
```

## ML Features
- **Recommendation Engine** (`POST /api/ml/recommend`) — scores artisans by rating, experience, review sentiment, keyword overlap, and price fit
- **Sentiment Analysis** (`GET /api/ml/artisan/:id/sentiment`) — analyses review text to show positive/neutral/negative badge on artisan profiles

## Stack
| Layer | Tech |
|---|---|
| Backend | Node.js, Express, PostgreSQL |
| Frontend | React, Tailwind CSS v4, Vite |
| ML | Python, Flask, TextBlob, scikit-learn |
| Auth | JWT, bcryptjs |
| Email | Nodemailer |
| Deploy | Railway |

**Developer:** Nyarko Osumanu Adamu — Index No. 9031423, KNUST
