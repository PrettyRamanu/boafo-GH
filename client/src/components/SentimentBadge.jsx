import { useEffect, useState } from 'react';
import api from '../api';

export default function SentimentBadge({ artisanId }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/ml/artisan/${artisanId}/sentiment`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [artisanId]);

  if (loading) return <span className="badge bg-gray-100 text-gray-400 animate-pulse">Analysing reviews...</span>;
  if (!data || data.total === 0) return null;

  const config = {
    positive: { color: 'bg-green-100 text-green-700', icon: '😊', label: 'Positive Reviews' },
    neutral:  { color: 'bg-yellow-100 text-yellow-700', icon: '😐', label: 'Mixed Reviews' },
    negative: { color: 'bg-red-100 text-red-700',   icon: '😟', label: 'Critical Reviews' },
  };

  const c = config[data.label] || config.neutral;

  return (
    <div className="flex items-center gap-2">
      <span className={`badge ${c.color} flex items-center gap-1`}>
        {c.icon} {c.label}
      </span>
      <span className="text-xs text-gray-400">
        Sentiment score: <span className="font-semibold text-gray-700">{data.avg_score}/100</span>
        {' '}(based on {data.total} review{data.total !== 1 ? 's' : ''})
      </span>
    </div>
  );
}
