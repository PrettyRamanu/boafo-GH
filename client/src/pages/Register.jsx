import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [params] = useSearchParams();
  const defaultType = params.get('type')==='artisan'?'artisan':'customer';
  const [type, setType] = useState(defaultType);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({name:'',email:'',password:'',phone:'',location:'',category_id:''});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(()=>{ api.get('/categories').then(r=>setCategories(r.data)); },[]);
  function handleChange(e){ setForm(f=>({...f,[e.target.name]:e.target.value})); }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true);
    try {
      const ep=type==='artisan'?'/auth/artisan/register':'/auth/customer/register';
      const res=await api.post(ep,form);
      const{token,artisan,customer}=res.data;
      login(token,artisan||customer,type);
      toast.success('Account created!');
      navigate(type==='artisan'?'/artisan/dashboard':'/customer/dashboard');
    } catch(err){ toast.error(err.response?.data?.error||'Registration failed'); }
    finally{ setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-[#1E2761] flex items-center justify-center text-white font-bold text-lg">B</span>
            <span className="font-bold text-xl text-[#1E2761]">Boafo GH</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Create your account</h1>
        </div>
        <div className="card mb-5">
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {['customer','artisan'].map(t=>(
              <button key={t} onClick={()=>setType(t)}
                className={`flex-1 py-2 text-sm font-semibold transition-colors ${type===t?'bg-[#1E2761] text-white':'text-gray-600 hover:bg-gray-50'}`}>
                {t==='customer'?'👤 I need a service':'🔧 I am an artisan'}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input name="name" required value={form.name} onChange={handleChange} className="input" placeholder="e.g. Kwame Asante"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input name="email" type="email" required value={form.email} onChange={handleChange} className="input" placeholder="you@example.com"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input name="password" type="password" required minLength={6} value={form.password} onChange={handleChange} className="input" placeholder="Min. 6 characters"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="024XXXXXXX"/></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input name="location" value={form.location} onChange={handleChange} className="input" placeholder="e.g. Ahodwo"/></div>
          </div>
          {type==='artisan'&&(
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Trade / Category</label>
              <select name="category_id" value={form.category_id} onChange={handleChange} className="input">
                <option value="">Select your trade...</option>
                {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">{loading?'Creating account...':'Create Account'}</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">Already have an account? <Link to="/login" className="text-[#1E2761] font-medium hover:underline">Login</Link></p>
      </div>
    </div>
  );
}
