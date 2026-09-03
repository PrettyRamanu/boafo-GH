import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Stars from './Stars';

export default function Recommendations({ categoryId, job }) {
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [fetched, setFetched]   = useState(false);

  async function fetchRecs() {
    setLoading(true);
    try {
      const res = await api.post('/ml/recommend', {
        category_id: categoryId,
        description: job?.description || '',
        budget_min:  job?.budget_min,
        budget_max:  job?.budget_max,
      });
      setResults(res.data.recommendations || []);
      setFetched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function scoreColor(score) {
    if (score >= 75) return 'bg-green-100 text-green-700';
    if (score >= 50) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  }

  return (
    <div className="card border-2 border-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            🤖 <span>AI Recommendations</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Powered by Boafo GH's matching engine — scored by rating, experience, sentiment, and job fit
          </p>
        </div>
        {!fetched && (
          <button onClick={fetchRecs} disabled={loading} className="btn-primary text-sm flex-shrink-0">
            {loading ? 'Analysing...' : 'Get Recommendations'}
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-2 bg-gray-100 rounded w-1/2" />
              </div>
              <div className="w-12 h-6 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {fetched && !loading && (
        results.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No verified artisans found for this trade yet.</p>
        ) : (
          <div className="space-y-3">
            {results.map((rec, idx) => {
              const a = rec.artisan;
              if (!a) return null;
              return (
                <Link
                  key={rec.artisan_id}
                  to={`/artisans/${rec.artisan_id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-gray-50 transition-all group"
                >
                  {/* Rank */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    idx === 0 ? 'bg-accent text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {idx + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                    {a.profile_photo
                      ? <img src={a.profile_photo} className="w-10 h-10 rounded-full object-cover" alt={a.name} />
                      : a.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors truncate">{a.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Stars rating={a.avg_rating} />
                      <span className="text-xs text-gray-400">({a.total_reviews})</span>
                      {a.location && <span className="text-xs text-gray-400">· 📍 {a.location}</span>}
                    </div>
                  </div>

                  {/* Match score */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className={`badge ${scoreColor(rec.score)} text-xs font-bold`}>
                      {rec.score}% match
                    </span>
                    {a.price_min && (
                      <span className="text-xs text-gray-400 mt-0.5">GHS {a.price_min}–{a.price_max}</span>
                    )}
                  </div>
                </Link>
              );
            })}

            {/* Score breakdown for top pick */}
            {results[0] && (
              <details className="mt-2 text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-primary transition-colors">
                  How is the match score calculated?
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-1.5 pl-2">
                  {Object.entries(results[0].breakdown).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${val}%` }} />
                      </div>
                      <span className="w-20 capitalize text-gray-400">{key.replace('_', ' ')}: {val}%</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )
      )}
    </div>
  );
}
