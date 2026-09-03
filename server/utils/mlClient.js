const http = require('http');
const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
function mlPost(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const url = new URL(ML_URL + path);
    const options = { hostname: url.hostname, port: url.port || 80, path: url.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }, timeout: 5000 };
    const req = http.request(options, (res) => { let data = ''; res.on('data', c => { data += c; }); res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid ML response')); } }); });
    req.on('error', reject); req.on('timeout', () => { req.destroy(); reject(new Error('ML timeout')); });
    req.write(payload); req.end();
  });
}
async function getSentiment(text) { try { return await mlPost('/sentiment', { text }); } catch { return { polarity: 0, subjectivity: 0, label: 'neutral', score: 50 }; } }
async function getBatchSentiment(reviews) { try { return await mlPost('/batch-sentiment', { reviews }); } catch { return { avg_score: 50, label: 'neutral', individual: [] }; } }
async function getRecommendations(job, artisans, topN = 5) { try { return await mlPost('/recommend', { job, artisans, top_n: topN }); } catch { return { recommendations: [], total_scored: 0 }; } }
module.exports = { getSentiment, getBatchSentiment, getRecommendations };
