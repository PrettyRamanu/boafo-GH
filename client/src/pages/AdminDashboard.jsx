import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [artisans, setArtisans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState({name:'',icon:''});
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ if(!user)return navigate('/login'); loadAnalytics(); api.get('/categories').then(r=>setCategories(r.data)); },[]);
  async function loadAnalytics(){ setLoading(true); try{ const r=await api.get('/admin/analytics'); setAnalytics(r.data); }finally{ setLoading(false); } }
  async function loadArtisans(v=''){ const r=await api.get('/admin/artisans',{params:{verified:v}}); setArtisans(r.data); }
  async function verifyArtisan(id,val){ try{ await api.put(`/admin/artisans/${id}/verify`,{is_verified:val}); toast.success(val?'Artisan verified!':'Verification removed'); loadArtisans(filter); }catch{ toast.error('Failed'); } }
  async function deactivateArtisan(id){ if(!confirm('Deactivate this artisan?'))return; await api.delete(`/admin/artisans/${id}`); toast.success('Done'); loadArtisans(filter); }
  async function addCategory(e){ e.preventDefault(); try{ await api.post('/admin/categories',newCat); toast.success('Category added!'); setNewCat({name:'',icon:''}); const r=await api.get('/categories'); setCategories(r.data); }catch(err){ toast.error(err.response?.data?.error||'Failed'); } }
  async function deleteCategory(id){ if(!confirm('Delete?'))return; await api.delete(`/admin/categories/${id}`); const r=await api.get('/categories'); setCategories(r.data); toast.success('Deleted'); }

  useEffect(()=>{
    if(tab==='artisans')loadArtisans(filter);
    if(tab==='customers')api.get('/admin/customers').then(r=>setCustomers(r.data));
    if(tab==='jobs')api.get('/admin/jobs').then(r=>setJobs(r.data));
  },[tab,filter]);

  const tabs=[{key:'overview',label:'📊 Overview'},{key:'artisans',label:'🔧 Artisans'},{key:'customers',label:'👥 Customers'},{key:'jobs',label:'📋 Jobs'},{key:'categories',label:'🏷️ Categories'}];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1><p className="text-sm text-gray-500">Boafo GH Platform Management</p></div>
        <button onClick={()=>{logout();navigate('/');}} className="btn-outline text-sm">Logout</button>
      </div>
      <div className="flex gap-1 flex-wrap mb-6 border-b border-gray-200">
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab===t.key?'bg-white border border-b-white text-[#1E2761] -mb-px':'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==='overview'&&(
        loading?<div className="animate-pulse grid grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}</div>
        :analytics&&(
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[{label:'Total Artisans',value:analytics.artisans.total,sub:`${analytics.artisans.verified} verified`,color:'text-[#1E2761]'},{label:'Pending Verify',value:analytics.artisans.pending,color:'text-yellow-600'},{label:'Customers',value:analytics.customers.total,color:'text-blue-600'},{label:'Jobs Posted',value:analytics.jobs.total,sub:`${analytics.jobs.completed} completed`,color:'text-[#1E2761]'}].map(s=>(
                <div key={s.label} className="card text-center"><p className={`text-3xl font-bold ${s.color}`}>{s.value}</p><p className="text-sm font-semibold text-gray-700 mt-1">{s.label}</p>{s.sub&&<p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>}</div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card"><h3 className="font-semibold mb-4">Jobs per Month</h3>
                <div className="flex items-end gap-2 h-32">
                  {analytics.monthly.map((m,i)=>{const max=Math.max(...analytics.monthly.map(x=>parseInt(x.jobs)));const pct=max?(parseInt(m.jobs)/max)*100:0;return(<div key={i} className="flex-1 flex flex-col items-center gap-1"><span className="text-xs text-gray-500">{m.jobs}</span><div className="w-full bg-[#1E2761] rounded-t" style={{height:`${pct}%`,minHeight:'4px'}}/><span className="text-xs text-gray-400">{m.month}</span></div>);})}
                </div>
              </div>
              <div className="card"><h3 className="font-semibold mb-3">Artisans by Trade</h3>
                <div className="space-y-2">
                  {analytics.categories.slice(0,6).map(c=>{const max=analytics.categories[0]?.artisans||1;return(<div key={c.name} className="flex items-center gap-2 text-sm"><span className="w-28 text-gray-600 truncate">{c.name}</span><div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#F59E0B] rounded-full" style={{width:`${(c.artisans/max)*100}%`}}/></div><span className="w-4 text-gray-400 text-xs">{c.artisans}</span></div>);})}
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card"><p className="text-sm text-gray-500">Avg. Platform Rating</p><p className="text-3xl font-bold text-[#F59E0B] mt-1">{analytics.reviews.avg||'–'}★</p><p className="text-xs text-gray-400">{analytics.reviews.total} total reviews</p></div>
              <div className="card"><p className="text-sm text-gray-500">Open Jobs</p><p className="text-3xl font-bold text-[#1E2761] mt-1">{analytics.jobs.open}</p><p className="text-xs text-gray-400">currently accepting applications</p></div>
            </div>
          </div>
        )
      )}

      {tab==='artisans'&&(
        <div>
          <div className="flex gap-2 mb-4">
            {[{v:'',l:'All'},{v:'false',l:'⏳ Pending'},{v:'true',l:'✔ Verified'}].map(({v,l})=>(
              <button key={v} onClick={()=>setFilter(v)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${filter===v?'bg-[#1E2761] text-white border-[#1E2761]':'border-gray-200 hover:border-[#1E2761]'}`}>{l}</button>
            ))}
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b border-gray-100">{['Name','Email','Trade','Location','Rating','Status','Actions'].map(h=><th key={h} className="pb-2 font-semibold text-gray-600">{h}</th>)}</tr></thead>
              <tbody>{artisans.map(a=>(
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 font-medium">{a.name}</td><td className="py-2 text-gray-500">{a.email}</td><td className="py-2">{a.category||'–'}</td><td className="py-2 text-gray-500">{a.location||'–'}</td>
                  <td className="py-2">{a.avg_rating}★ ({a.total_reviews})</td>
                  <td className="py-2"><span className={`badge ${a.is_verified?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{a.is_verified?'✔ Verified':'⏳ Pending'}</span></td>
                  <td className="py-2"><div className="flex gap-2">
                    <button onClick={()=>verifyArtisan(a.id,!a.is_verified)} className={`text-xs px-2 py-1 rounded ${a.is_verified?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>{a.is_verified?'Unverify':'Verify'}</button>
                    <button onClick={()=>deactivateArtisan(a.id)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Remove</button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
            {artisans.length===0&&<p className="text-center text-gray-400 py-6">No artisans found</p>}
          </div>
        </div>
      )}

      {tab==='customers'&&(
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b border-gray-100">{['Name','Email','Phone','Location','Joined'].map(h=><th key={h} className="pb-2 font-semibold text-gray-600">{h}</th>)}</tr></thead>
            <tbody>{customers.map(c=>(
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 font-medium">{c.name}</td><td className="py-2 text-gray-500">{c.email}</td><td className="py-2 text-gray-500">{c.phone||'–'}</td><td className="py-2 text-gray-500">{c.location||'–'}</td><td className="py-2 text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}</tbody>
          </table>
          {customers.length===0&&<p className="text-center text-gray-400 py-6">No customers yet</p>}
        </div>
      )}

      {tab==='jobs'&&(
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b border-gray-100">{['Title','Customer','Category','Location','Budget','Status','Posted'].map(h=><th key={h} className="pb-2 font-semibold text-gray-600">{h}</th>)}</tr></thead>
            <tbody>{jobs.map(j=>(
              <tr key={j.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 font-medium max-w-xs truncate">{j.title}</td><td className="py-2 text-gray-500">{j.customer_name}</td><td className="py-2 text-gray-500">{j.category||'–'}</td><td className="py-2 text-gray-500">{j.location||'–'}</td>
                <td className="py-2">{j.budget_min?`GHS ${j.budget_min}–${j.budget_max}`:'–'}</td>
                <td className="py-2"><span className={`badge ${j.status==='open'?'bg-blue-100 text-blue-700':j.status==='completed'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{j.status}</span></td>
                <td className="py-2 text-gray-400">{new Date(j.created_at).toLocaleDateString()}</td>
              </tr>
            ))}</tbody>
          </table>
          {jobs.length===0&&<p className="text-center text-gray-400 py-6">No jobs yet</p>}
        </div>
      )}

      {tab==='categories'&&(
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card"><h3 className="font-semibold mb-3">Add Category</h3>
            <form onSubmit={addCategory} className="space-y-3">
              <div><label className="text-sm font-medium text-gray-700">Name *</label><input required className="input mt-1" placeholder="e.g. Welder" value={newCat.name} onChange={e=>setNewCat(c=>({...c,name:e.target.value}))}/></div>
              <div><label className="text-sm font-medium text-gray-700">Icon (emoji)</label><input className="input mt-1" placeholder="e.g. 🔥" value={newCat.icon} onChange={e=>setNewCat(c=>({...c,icon:e.target.value}))}/></div>
              <button type="submit" className="btn-primary text-sm">Add Category</button>
            </form>
          </div>
          <div className="card"><h3 className="font-semibold mb-3">Existing Categories</h3>
            <div className="space-y-2">{categories.map(c=>(
              <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm">{c.icon} {c.name}</span>
                <button onClick={()=>deleteCategory(c.id)} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            ))}</div>
          </div>
        </div>
      )}
    </div>
  );
}
