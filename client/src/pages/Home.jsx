import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import ArtisanCard from '../components/ArtisanCard';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data));
    api.get('/artisans?limit=6').then(r => setFeatured(r.data.artisans || []));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/artisans?search=${encodeURIComponent(search)}`);
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0D1B4B] via-[#1E2761] to-[#3A4F9B] text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Find Skilled Tradespeople<br/>
            <span className="text-[#F59E0B]">Across Ghana</span>
          </h1>
          <p className="text-lg text-white/80 mb-8">
            Boafo GH connects you with verified electricians, plumbers, carpenters, tailors and more — right in your community.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, trade, or location..."
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"/>
            <button type="submit" className="btn-accent px-6 py-3 font-bold">Search</button>
          </form>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-3 gap-6 text-center">
          {[{label:'Verified Artisans',value:'500+'},{label:'Jobs Completed',value:'2,000+'},{label:'Happy Customers',value:'1,500+'}].map(s=>(
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-[#1E2761]">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Trade</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {categories.map(c => (
            <Link key={c.id} to={`/artisans?category=${encodeURIComponent(c.name)}`}
              className="flex flex-col items-center gap-2 p-4 card hover:shadow-md hover:border-[#1E2761] transition-all group text-center">
              <span className="text-3xl">{c.icon}</span>
              <span className="text-xs font-semibold text-gray-700 group-hover:text-[#1E2761] transition-colors">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="bg-gray-50 py-14">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Top Artisans</h2>
              <Link to="/artisans" className="text-sm text-[#1E2761] font-medium hover:underline">View all →</Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {featured.map(a => <ArtisanCard key={a.id} artisan={a}/>)}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[{n:'1',icon:'🔍',title:'Search',desc:'Find artisans by trade, location, and rating'},
            {n:'2',icon:'📋',title:'Post Job',desc:'Describe what you need and set your budget'},
            {n:'3',icon:'💬',title:'Connect',desc:'Artisans send quotes — you choose the best fit'},
            {n:'4',icon:'⭐',title:'Review',desc:'Rate the work and build the community'}].map(s=>(
            <div key={s.n} className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#1E2761] text-white font-bold text-xl flex items-center justify-center mx-auto mb-3">{s.n}</div>
              <p className="text-2xl mb-2">{s.icon}</p>
              <p className="font-semibold text-gray-800">{s.title}</p>
              <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Feature callout */}
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <div className="bg-gradient-to-r from-[#1E2761] to-[#3A4F9B] rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#F59E0B] mb-2">AI-Powered</p>
            <h3 className="text-2xl font-bold mb-2">Smart Artisan Matching</h3>
            <p className="text-white/80 text-sm max-w-md">
              Our recommendation engine scores artisans by rating, experience, review sentiment, and how well they match your job description — so you always get the best fit.
            </p>
          </div>
          <Link to="/artisans" className="btn-accent px-6 py-3 font-bold whitespace-nowrap flex-shrink-0">
            Try It Now →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1E2761] text-white py-14 text-center px-4">
        <h2 className="text-2xl font-bold mb-3">Are you a skilled tradesperson?</h2>
        <p className="text-white/80 mb-6">Join Boafo GH and get discovered by thousands of customers in your area.</p>
        <Link to="/register?type=artisan" className="btn-accent px-8 py-3 font-bold text-base">Register as an Artisan</Link>
      </section>

      <footer className="bg-[#0D1B4B] text-white/60 text-sm text-center py-6">
        © {new Date().getFullYear()} Boafo GH — Connecting Skilled Tradespeople Across Ghana
      </footer>
    </div>
  );
}
