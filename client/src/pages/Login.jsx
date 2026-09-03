import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [type, setType] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true);
    try {
      const endpoints={customer:'/auth/customer/login',artisan:'/auth/artisan/login',admin:'/auth/admin/login'};
      const res=await api.post(endpoints[type],{email,password});
      const data=res.data;
      const user=data.artisan||data.customer||data.user;
      login(data.token,user,type);
      toast.success(`Welcome back, ${user.name}!`);
      const dashes={customer:'/customer/dashboard',artisan:'/artisan/dashboard',admin:'/admin'};
      navigate(dashes[type]);
    } catch(err){ toast.error(err.response?.data?.error||'Login failed'); }
    finally{ setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-[#1E2761] flex items-center justify-center text-white font-bold text-lg">B</span>
            <span className="font-bold text-xl text-[#1E2761]">Boafo GH</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Welcome back</h1>
        </div>
        <div className="card mb-5">
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {[{key:'customer',label:'👤 Customer'},{key:'artisan',label:'🔧 Artisan'},{key:'admin',label:'⚙️ Admin'}].map(t=>(
              <button key={t.key} onClick={()=>setType(t.key)}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${type===t.key?'bg-[#1E2761] text-white':'text-gray-600 hover:bg-gray-50'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="input" placeholder="you@example.com"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="input" placeholder="••••••••"/></div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">{loading?'Logging in...':'Login'}</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">Don't have an account? <Link to="/register" className="text-[#1E2761] font-medium hover:underline">Register</Link></p>
      </div>
    </div>
  );
}
