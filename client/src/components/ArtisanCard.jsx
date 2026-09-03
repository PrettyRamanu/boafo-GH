import { Link } from 'react-router-dom';
import Stars from './Stars';
export default function ArtisanCard({ artisan: a }) {
  return (
    <Link to={`/artisans/${a.id}`} className="card hover:shadow-md transition-shadow flex flex-col gap-3 group">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-[#1E2761] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {a.profile_photo?<img src={a.profile_photo} className="w-14 h-14 rounded-full object-cover" alt={a.name}/>:a.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate group-hover:text-[#1E2761] transition-colors">{a.name}</p>
          <p className="text-xs text-[#F59E0B] font-medium">{a.category_icon} {a.category}</p>
        </div>
        {a.is_verified && <span className="ml-auto badge bg-green-100 text-green-700 flex-shrink-0">✔ Verified</span>}
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>📍 {a.location||'Ghana'}</span>
        {a.experience_yrs>0&&<span>🕐 {a.experience_yrs} yrs</span>}
      </div>
      {a.bio&&<p className="text-sm text-gray-600 line-clamp-2">{a.bio}</p>}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1"><Stars rating={a.avg_rating}/><span className="text-xs text-gray-500">({a.total_reviews})</span></div>
        {a.price_min&&<span className="text-xs font-medium text-[#1E2761]">GHS {a.price_min}–{a.price_max}</span>}
      </div>
    </Link>
  );
}
