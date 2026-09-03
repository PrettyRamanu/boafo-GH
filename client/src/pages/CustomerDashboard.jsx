import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Recommendations from '../components/Recommendations';
import toast from 'react-hot-toast';

function PostJobModal({ categories, onClose, onSuccess }) {
  const [form, setForm] = useState({title:'',description:'',category_id:'',location:'',budget_min:'',budget_max:''});
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault(); setLoading(true);
    try { await api.post('/jobs',form); toast.success('Job posted!'); onSuccess(); }
    catch(err){ toast.error(err.response?.data?.error||'Failed'); }
    finally{ setLoading(false); }
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Post a Job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="text-sm font-medium text-gray-700">Job Title *</label><input required className="input mt-1" placeholder="e.g. Fix electrical wiring" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></div>
          <div><label className="text-sm font-medium text-gray-700">Trade Category</label>
            <select className="input mt-1" value={form.category_id} onChange={e=>setForm(f=>({...f,category_id:e.target.value}))}>
              <option value="">Select trade...</option>
              {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div><label className="text-sm font-medium text-gray-700">Description</label><textarea className="input mt-1" rows={3} placeholder="Describe the job..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
          <div><label className="text-sm font-medium text-gray-700">Location</label><input className="input mt-1" placeholder="e.g. Ahodwo, Kumasi" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-gray-700">Budget Min (GHS)</label><input type="number" className="input mt-1" value={form.budget_min} onChange={e=>setForm(f=>({...f,budget_min:e.target.value}))}/></div>
            <div><label className="text-sm font-medium text-gray-700">Budget Max (GHS)</label><input type="number" className="input mt-1" value={form.budget_max} onChange={e=>setForm(f=>({...f,budget_max:e.target.value}))}/></div>
          </div>
          {form.category_id&&form.description&&(
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-500 mb-2">🤖 AI Recommendations for this job:</p>
              <Recommendations categoryId={form.category_id} job={{description:form.description,budget_min:form.budget_min,budget_max:form.budget_max}}/>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading?'Posting...':'Post Job'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ if(!user)return navigate('/login'); fetchJobs(); api.get('/categories').then(r=>setCategories(r.data)); },[]);

  async function fetchJobs(){ setLoading(true); try{ const r=await api.get('/jobs/my'); setJobs(r.data); }finally{ setLoading(false); } }
  async function fetchJob(id){ const r=await api.get(`/jobs/${id}`); setActiveJob(r.data); }
  async function updateStatus(jobId,status){ try{ await api.put(`/jobs/${jobId}/status`,{status}); toast.success(`Job marked as ${status}`); fetchJobs(); if(activeJob?.id===jobId)fetchJob(jobId); }catch{ toast.error('Failed'); } }
  async function acceptApp(appId,jobId){ try{ await api.put(`/jobs/applications/${appId}`,{status:'accepted'}); toast.success('Application accepted!'); fetchJob(jobId); }catch{ toast.error('Failed'); } }

  const statusColor={open:'bg-blue-100 text-blue-700',assigned:'bg-yellow-100 text-yellow-700',completed:'bg-green-100 text-green-700',cancelled:'bg-red-100 text-red-700'};

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {showModal&&<PostJobModal categories={categories} onClose={()=>setShowModal(false)} onSuccess={()=>{setShowModal(false);fetchJobs();}}/>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1><p className="text-sm text-gray-500">Welcome back, {user?.name}</p></div>
        <div className="flex gap-2">
          <button onClick={()=>setShowModal(true)} className="btn-primary">+ Post a Job</button>
          <button onClick={()=>{logout();navigate('/');}} className="btn-outline">Logout</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{label:'Total Jobs',value:jobs.length},{label:'Open Jobs',value:jobs.filter(j=>j.status==='open').length},{label:'Completed',value:jobs.filter(j=>j.status==='completed').length}].map(s=>(
          <div key={s.label} className="card text-center"><p className="text-3xl font-bold text-[#1E2761]">{s.value}</p><p className="text-sm text-gray-500 mt-1">{s.label}</p></div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">Your Jobs</h2>
          {loading?<div className="space-y-3">{[1,2,3].map(i=><div key={i} className="card h-20 animate-pulse bg-gray-100"/>)}</div>
          :jobs.length===0?<div className="card text-center py-10 text-gray-400"><p className="text-3xl mb-2">📋</p><p>No jobs yet. Post your first one!</p></div>
          :<div className="space-y-3">{jobs.map(job=>(
            <div key={job.id} onClick={()=>fetchJob(job.id)}
              className={`card cursor-pointer hover:shadow-md transition-shadow ${activeJob?.id===job.id?'ring-2 ring-[#1E2761]':''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="font-semibold text-sm truncate">{job.title}</p><p className="text-xs text-gray-400">{new Date(job.created_at).toLocaleDateString()} · {job.applications} applications</p></div>
                <span className={`badge flex-shrink-0 ${statusColor[job.status]}`}>{job.status}</span>
              </div>
            </div>
          ))}</div>}
        </div>
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">Job Details</h2>
          {!activeJob?<div className="card text-center py-10 text-gray-400"><p>Select a job to view details and applications</p></div>:(
            <div className="card space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-gray-900">{activeJob.title}</h3>
                <span className={`badge ${statusColor[activeJob.status]}`}>{activeJob.status}</span>
              </div>
              {activeJob.description&&<p className="text-sm text-gray-600">{activeJob.description}</p>}
              <div className="text-xs text-gray-500 flex gap-4">
                {activeJob.location&&<span>📍 {activeJob.location}</span>}
                {activeJob.budget_min&&<span>💰 GHS {activeJob.budget_min}–{activeJob.budget_max}</span>}
              </div>
              {activeJob.status==='open'&&<button onClick={()=>updateStatus(activeJob.id,'cancelled')} className="text-xs text-red-500 hover:underline">Cancel Job</button>}
              {activeJob.status==='assigned'&&<button onClick={()=>updateStatus(activeJob.id,'completed')} className="btn-primary text-sm">Mark as Completed</button>}
              <div>
                <p className="font-semibold text-sm mb-2">Applications ({activeJob.applications?.length||0})</p>
                {!activeJob.applications?.length?<p className="text-sm text-gray-400">No applications yet.</p>:(
                  <div className="space-y-2">
                    {activeJob.applications.map(app=>(
                      <div key={app.id} className="border border-gray-100 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <Link to={`/artisans/${app.artisan_id}`} className="font-semibold text-[#1E2761] hover:underline">{app.artisan_name}</Link>
                          <span className={`badge ${app.status==='accepted'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{app.status}</span>
                        </div>
                        {app.quote&&<p className="text-[#F59E0B] font-semibold">GHS {app.quote}</p>}
                        {app.message&&<p className="text-gray-500 mt-1">{app.message}</p>}
                        {app.status==='pending'&&<button onClick={()=>acceptApp(app.id,activeJob.id)} className="btn-primary text-xs mt-2">Accept</button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
