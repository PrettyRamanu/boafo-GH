import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ArtisanList from './pages/ArtisanList';
import ArtisanProfile from './pages/ArtisanProfile';
import Register from './pages/Register';
import Login from './pages/Login';
import CustomerDashboard from './pages/CustomerDashboard';
import ArtisanDashboard from './pages/ArtisanDashboard';
import AdminDashboard from './pages/AdminDashboard';

function Protected({ role: required, children }) {
  const { user, role, loading } = useAuth();
  if(loading)return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-[#1E2761] border-t-transparent rounded-full"/></div>;
  if(!user)return <Navigate to="/login"/>;
  if(required&&role!==required)return <Navigate to="/"/>;
  return children;
}
function Layout({ children }) { return <><Navbar/><main>{children}</main></>; }

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right"/>
        <Routes>
          <Route path="/" element={<Layout><Home/></Layout>}/>
          <Route path="/artisans" element={<Layout><ArtisanList/></Layout>}/>
          <Route path="/artisans/:id" element={<Layout><ArtisanProfile/></Layout>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/customer/dashboard" element={<Protected role="customer"><Layout><CustomerDashboard/></Layout></Protected>}/>
          <Route path="/artisan/dashboard" element={<Protected role="artisan"><Layout><ArtisanDashboard/></Layout></Protected>}/>
          <Route path="/admin" element={<Protected role="admin"><Layout><AdminDashboard/></Layout></Protected>}/>
          <Route path="*" element={<Navigate to="/"/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
