import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from './Navbar'; // Agar aapne alag Navbar banaya hai

const UserLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Aapka Navbar yahan hoga */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-indigo-600">BookNest</Link>
          <div className="flex items-center gap-4">
             <Link to="/books" className="text-sm font-medium text-gray-600">Browse Library</Link>
             {/* Login/Logout buttons */}
          </div>
        </div>
      </nav>

      {/* CRITICAL: Ye Outlet hi UserLibrary ko render karega */}
      <main>
        <Outlet /> 
      </main>
    </div>
  );
};

export default UserLayout;