import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  function handleLogout() { logout(); navigate('/'); }
  function dash() { return role==='artisan'?'/artisan/dashboard':role==='customer'?'/customer/dashboard':role==='admin'?'/admin':'/'; }
  return (
    <nav className="bg-[#1E2761] shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[#F59E0B] flex items-center justify-center font-bold text-white text-lg">B</span>
          <span className="text-white font-bold text-xl">Boafo <span className="text-[#F59E0B]">GH</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-white/90">
          <Link to="/artisans" className="hover:text-[#F59E0B] transition-colors">Find Artisans</Link>
          <Link to="/jobs" className="hover:text-[#F59E0B] transition-colors">Browse Jobs</Link>
          {user ? (<><Link to={dash()} className="hover:text-[#F59E0B] transition-colors">Dashboard</Link><button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">Logout</button></>)
          : (<><Link to="/login" className="hover:text-[#F59E0B] transition-colors">Login</Link><Link to="/register" className="bg-[#F59E0B] hover:bg-[#D97706] px-4 py-1.5 rounded-lg text-white font-semibold transition-colors">Get Started</Link></>)}
        </div>
        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{open?<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}</svg>
        </button>
      </div>
      {open && <div className="md:hidden bg-[#0D1B4B] px-4 pb-4 flex flex-col gap-3 text-white text-sm">
        <Link to="/artisans" onClick={()=>setOpen(false)}>Find Artisans</Link>
        <Link to="/jobs" onClick={()=>setOpen(false)}>Browse Jobs</Link>
        {user?(<><Link to={dash()} onClick={()=>setOpen(false)}>Dashboard</Link><button onClick={handleLogout} className="text-left">Logout</button></>)
        :(<><Link to="/login" onClick={()=>setOpen(false)}>Login</Link><Link to="/register" onClick={()=>setOpen(false)}>Get Started</Link></>)}
      </div>}
    </nav>
  );
}
