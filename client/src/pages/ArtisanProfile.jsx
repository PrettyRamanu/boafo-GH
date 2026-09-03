import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Stars from '../components/Stars';
import SentimentBadge from '../components/SentimentBadge';
import Recommendations from '../components/Recommendations';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ArtisanProfile() {
  const { id } = useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [artisan, setArtisan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(()=>{
    api.get(`/artisans/${id}`)
      .then(r=>setArtisan(r.data))
      .catch(()=>navigate('/artisans'))
      .finally(()=>setLoading(false));
  },[id]);

  async function submitReview(e) {
    e.preventDefault();
    if(!user)return navigate('/login');
    setSubmitting(true);
    try {
      await api.post('/reviews',{artisan_id:id,rating,comment});
      toast.success('Review submitted!');
      setComment('');
      const r=await api.get(`/artisans/${id}`);
      setArtisan(r.data);
    } catch(err){ toast.error(err.response?.data?.error||'Failed to submit review'); }
    finally{ setSubmitting(false); }
  }

  if(loading)return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-[#1E2761] border-t-transparent rounded-full"/></div>;
  if(!artisan)return null;

  const ratingDist=[5,4,3,2,1].map(n=>({n,pct:artisan.reviews.length?Math.round(artisan.reviews.filter(r=>r.rating===n).length/artisan.reviews.length*100):0}));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="card flex flex-col md:flex-row gap-6">
        <div className="w-28 h-28 rounded-full bg-[#1E2761] flex items-center justify-center text-white font-bold text-4xl flex-shrink-0 mx-auto md:mx-0">
          {artisan.profile_photo?<img src={artisan.profile_photo} className="w-28 h-28 rounded-full object-cover" alt={artisan.name}/>:artisan.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-start gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{artisan.name}</h1>
            {artisan.is_verified&&<span className="badge bg-green-100 text-green-700 text-xs mt-1">✔ Verified</span>}
          </div>
          <p className="text-[#F59E0B] font-semibold mb-1">{artisan.category_icon} {artisan.category}</p>
          <p className="text-sm text-gray-500 mb-2">📍 {artisan.location}</p>
          <div className="flex items-center gap-2 mb-2">
            <Stars rating={artisan.avg_rating} size="md"/>
            <span className="font-bold text-gray-800">{Number(artisan.avg_rating).toFixed(1)}</span>
            <span className="text-sm text-gray-400">({artisan.total_reviews} reviews)</span>
          </div>
          {/* Sentiment badge — ML feature */}
          <SentimentBadge artisanId={id}/>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
            {artisan.experience_yrs>0&&<span>🕐 {artisan.experience_yrs} years experience</span>}
            {artisan.availability&&<span>📅 {artisan.availability}</span>}
            {artisan.price_min&&<span>💰 GHS {artisan.price_min}–{artisan.price_max}</span>}
          </div>
        </div>
        {role==='customer'&&(
          <div className="flex flex-col gap-2 justify-center">
            <button onClick={()=>navigate('/customer/dashboard')} className="btn-primary">Post a Job</button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          {artisan.bio&&<div className="card"><h2 className="font-bold text-gray-800 mb-2">About</h2><p className="text-sm text-gray-600 leading-relaxed">{artisan.bio}</p></div>}

          <div className="card">
            <h2 className="font-bold text-gray-800 mb-3">Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[{label:'Service Areas',value:artisan.service_areas},{label:'Certifications',value:artisan.certifications},{label:'Availability',value:artisan.availability},{label:'Price Range',value:artisan.price_min?`GHS ${artisan.price_min}–${artisan.price_max}`:null}].filter(d=>d.value).map(d=>(
                <div key={d.label}><p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{d.label}</p><p className="text-gray-700 mt-0.5">{d.value}</p></div>
              ))}
            </div>
          </div>

          {artisan.portfolio.length>0&&(
            <div className="card"><h2 className="font-bold text-gray-800 mb-3">Portfolio</h2>
              <div className="grid grid-cols-3 gap-2">
                {artisan.portfolio.map(p=>(
                  <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={p.url} alt={p.caption} className="w-full h-full object-cover"/>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="font-bold text-gray-800 mb-4">Reviews</h2>
            {artisan.reviews.length===0?<p className="text-sm text-gray-400">No reviews yet.</p>:(
              <div className="space-y-4">
                {artisan.reviews.map(r=>(
                  <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{r.customer_name}</span>
                      <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <Stars rating={r.rating}/>
                    {r.comment&&<p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
            {role==='customer'&&(
              <form onSubmit={submitReview} className="mt-5 border-t pt-4 space-y-3">
                <p className="font-semibold text-sm text-gray-700">Leave a Review</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n=>(
                    <button key={n} type="button" onClick={()=>setRating(n)}
                      className={`text-2xl transition-colors ${n<=rating?'text-[#F59E0B]':'text-gray-300'}`}>★</button>
                  ))}
                </div>
                <textarea className="input" rows={3} placeholder="Share your experience..." value={comment} onChange={e=>setComment(e.target.value)}/>
                <button type="submit" disabled={submitting} className="btn-primary text-sm">{submitting?'Submitting...':'Submit Review'}</button>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-3 text-center">Rating</h2>
            <p className="text-5xl font-extrabold text-center text-[#1E2761] mb-1">{Number(artisan.avg_rating).toFixed(1)}</p>
            <div className="flex justify-center mb-3"><Stars rating={artisan.avg_rating} size="md"/></div>
            <p className="text-xs text-center text-gray-400 mb-4">{artisan.total_reviews} reviews</p>
            <div className="space-y-1.5">
              {ratingDist.map(d=>(
                <div key={d.n} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-right">{d.n}★</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#F59E0B] rounded-full" style={{width:`${d.pct}%`}}/>
                  </div>
                  <span className="w-6 text-gray-400">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations — ML feature */}
          <Recommendations categoryId={artisan.category_id} job={{description:artisan.bio}}/>
        </div>
      </div>
    </div>
  );
}
