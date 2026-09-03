import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Stars from '../components/Stars';
import toast from 'react-hot-toast';

export default function ArtisanDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ if(!user)return navigate('/login'); loadAll(); },[]);

  async function loadAll(){ setLoading(true); try{ const[s,p,apps,rvs]=await Promise.all([api.get('/artisans/dashboard/stats'),api.get('/auth/me'),api.get('/artisans/my/applications'),api.get('/artisans/my/reviews')]); setStats(s.data); setProfile(p.data); setApplications(apps.data); setReviews(rvs.data); }finally{ setLoading(false); } }
  async function loadJobs(){ const r=await api.get('/jobs'); setJobs(r.data); }
  async function applyForJob(jobId){ const quote=prompt('Enter your quote (GHS):'); const message=prompt('Add a message (optional):'); try{ await api.post(`/jobs/${jobId}/apply`,{quote,message}); toast.success('Application submitted!'); loadJobs(); }catch(err){ toast.error(err.response?.data?.error||'Failed'); } }
  async function saveProfile(e){ e.preventDefault(); setSaving(true); try{ await api.put('/artisans/profile/me',profile); toast.success('Profile updated!'); }catch{ toast.error('Failed'); }finally{ setSaving(false); } }
  useEffect(()=>{ if(tab==='jobs')loadJobs(); },[tab]);

  if(loading)return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-[#1E2761] border-t-transparent rounded-full"/></div>;

  const tabs=[{key:'overview',label:'📊 Overview'},{key:'applications',label:'📋 Applications'},{key:'jobs',label:'🔍 Browse Jobs'},{key:'reviews',label:'⭐ Reviews'},{key:'profile',label:'👤 Profile'}];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Artisan Dashboard</h1>
          <p className="text-sm text-gray-500 flex items-center gap-2">{user?.name}
            {profile?.is_verified?<span className="badge bg-green-100 text-green-700 text-xs">✔ Verified</span>:<span className="badge bg-yellow-100 text-yellow-700 text-xs">⏳ Pending verification</span>}
          </p>
        </div>
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

      {tab==='overview'&&stats&&(
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{label:'Avg Rating',value:`${stats.avg_rating}★`,color:'text-[#F59E0B]'},{label:'Total Reviews',value:stats.total_reviews,color:'text-[#1E2761]'},{label:'Applications',value:Object.values(stats.applications).reduce((a,b)=>a+b,0),color:'text-[#1E2761]'},{label:'Accepted',value:stats.applications.accepted||0,color:'text-green-600'}].map(s=>(
              <div key={s.label} className="card text-center"><p className={`text-3xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-gray-500 mt-1">{s.label}</p></div>
            ))}
          </div>
          <div className="card"><h3 className="font-semibold mb-3">Recent Reviews</h3>
            {reviews.slice(0,3).length===0?<p className="text-sm text-gray-400">No reviews yet.</p>:reviews.slice(0,3).map(r=>(
              <div key={r.id} className="border-b last:border-0 py-3">
                <div className="flex justify-between text-sm mb-1"><span className="font-medium">{r.customer_name}</span><Stars rating={r.rating}/></div>
                {r.comment&&<p className="text-xs text-gray-500">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='applications'&&(
        <div className="space-y-3">
          {applications.length===0?<div className="card text-center py-10 text-gray-400"><p className="text-3xl mb-2">📋</p><p>No applications yet</p></div>
          :applications.map(app=>(
            <div key={app.id} className="card flex items-start justify-between gap-4">
              <div className="min-w-0"><p className="font-semibold">{app.title}</p><p className="text-xs text-gray-400">👤 {app.customer_name} · 📍 {app.location}</p>
                {app.quote&&<p className="text-sm text-[#F59E0B] font-medium mt-1">Your quote: GHS {app.quote}</p>}
                {app.message&&<p className="text-xs text-gray-500 mt-1">{app.message}</p>}
              </div>
              <span className={`badge flex-shrink-0 ${app.status==='accepted'?'bg-green-100 text-green-700':app.status==='rejected'?'bg-red-100 text-red-700':'bg-gray-100 text-gray-600'}`}>{app.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab==='jobs'&&(
        <div className="space-y-3">
          {jobs.length===0?<div className="card text-center py-10 text-gray-400"><p className="text-3xl mb-2">🔍</p><p>No open jobs right now</p></div>
          :jobs.map(job=>(
            <div key={job.id} className="card flex items-start justify-between gap-4">
              <div className="min-w-0"><p className="font-semibold">{job.title}</p><p className="text-xs text-gray-400">📍 {job.location} · {job.applications} applicants</p>
                {job.budget_min&&<p className="text-sm text-[#1E2761] font-medium mt-1">GHS {job.budget_min}–{job.budget_max}</p>}
                {job.description&&<p className="text-xs text-gray-500 mt-1 line-clamp-2">{job.description}</p>}
              </div>
              <button onClick={()=>applyForJob(job.id)} className="btn-primary text-sm flex-shrink-0">Apply</button>
            </div>
          ))}
        </div>
      )}

      {tab==='reviews'&&(
        <div className="card space-y-4">
          {reviews.length===0?<p className="text-center text-gray-400 py-8">No reviews yet</p>:reviews.map(r=>(
            <div key={r.id} className="border-b last:border-0 pb-4">
              <div className="flex justify-between mb-1"><span className="font-semibold text-sm">{r.customer_name}</span><span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span></div>
              <Stars rating={r.rating}/>
              {r.comment&&<p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {tab==='profile'&&profile&&(
        <form onSubmit={saveProfile} className="card space-y-4 max-w-2xl">
          <h3 className="font-bold text-gray-800 mb-2">Edit Profile</h3>
          {[{label:'Full Name',key:'name',type:'text'},{label:'Phone',key:'phone',type:'text'},{label:'Location',key:'location',type:'text',placeholder:'e.g. Ahodwo, Kumasi'},{label:'Service Areas',key:'service_areas',type:'text',placeholder:'Comma-separated areas'},{label:'Availability',key:'availability',type:'text',placeholder:'e.g. Mon-Sat, 7am-6pm'},{label:'Experience (years)',key:'experience_yrs',type:'number'},{label:'Price Min (GHS)',key:'price_min',type:'number'},{label:'Price Max (GHS)',key:'price_max',type:'number'}].map(f=>(
            <div key={f.key}><label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label><input type={f.type} className="input" placeholder={f.placeholder} value={profile[f.key]||''} onChange={e=>setProfile(p=>({...p,[f.key]:e.target.value}))}/></div>
          ))}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">About / Bio</label><textarea className="input" rows={4} value={profile.bio||''} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))}/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label><textarea className="input" rows={2} value={profile.certifications||''} onChange={e=>setProfile(p=>({...p,certifications:e.target.value}))}/></div>
          <button type="submit" disabled={saving} className="btn-primary">{saving?'Saving...':'Save Profile'}</button>
        </form>
      )}
    </div>
  );
}
