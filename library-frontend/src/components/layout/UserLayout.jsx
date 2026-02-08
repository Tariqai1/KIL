import React from 'react';
import { Outlet } from 'react-router-dom';
import UserNavbar from './UserNavbar';
import Footer from './Footer'; // ✅ Import Footer

const UserLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar at the top */}
      <UserNavbar />
      
      {/* Main Content Area (Grows to fill space) */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer at the bottom */}
      <Footer /> 
    </div>
  );
};

export default UserLayout;