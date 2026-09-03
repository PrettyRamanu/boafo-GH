import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import ArtisanCard from '../components/ArtisanCard';

export default function ArtisanList() {
  const [params, setParams] = useSearchParams();
  const [artisans, setArtisans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const page=parseInt(params.get('page')||'1');
  const search=params.get('search')||'';
  const category=params.get('category')||'';
  const location=params.get('location')||'';
  const minRating=params.get('min_rating')||'';

  useEffect(()=>{ api.get('/categories').then(r=>setCategories(r.data)); },[]);

  useEffect(()=>{
    setLoading(true);
    api.get('/artisans',{params:{search,category,location,min_rating:minRating,page,limit:12}})
      .then(r=>{ setArtisans(r.data.artisans||[]); setTotal(r.data.total||0); setPages(r.data.pages||1); })
      .finally(()=>setLoading(false));
  },[search,category,location,minRating,page]);

  function setFilter(key,val){
    const next=new URLSearchParams(params);
    if(val)next.set(key,val);else next.delete(key);
    next.set('page','1'); setParams(next);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Find an Artisan</h1>
      <div className="card mb-6 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search name or trade..." defaultValue={search}
          onKeyDown={e=>e.key==='Enter'&&setFilter('search',e.target.value)}/>
        <select className="input max-w-[180px]" value={category} onChange={e=>setFilter('category',e.target.value)}>
          <option value="">All Trades</option>
          {categories.map(c=><option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
        </select>
        <input className="input max-w-[160px]" placeholder="Location..." defaultValue={location}
          onKeyDown={e=>e.key==='Enter'&&setFilter('location',e.target.value)}/>
        <select className="input max-w-[140px]" value={minRating} onChange={e=>setFilter('min_rating',e.target.value)}>
          <option value="">Any Rating</option>
          <option value="4">4★ & above</option>
          <option value="3">3★ & above</option>
        </select>
        {(search||category||location||minRating)&&
          <button onClick={()=>setParams({})} className="text-sm text-red-500 hover:underline">Clear filters</button>}
      </div>
      <p className="text-sm text-gray-500 mb-4">{total} artisan{total!==1?'s':''} found</p>
      {loading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {[...Array(6)].map((_,i)=><div key={i} className="card animate-pulse h-52 bg-gray-100"/>)}
        </div>
      ) : artisans.length===0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔍</p><p className="font-semibold">No artisans found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {artisans.map(a=><ArtisanCard key={a.id} artisan={a}/>)}
        </div>
      )}
      {pages>1&&(
        <div className="flex justify-center gap-2 mt-8">
          {[...Array(pages)].map((_,i)=>(
            <button key={i} onClick={()=>setFilter('page',String(i+1))}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page===i+1?'bg-[#1E2761] text-white':'bg-white border border-gray-200 hover:border-[#1E2761]'}`}>
              {i+1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
