// src/pages/Logout.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; // Import your auth hook

const Logout = () => {
  const { logout } = useAuth(); // Get the logout function from your auth context
  const navigate = useNavigate();

  useEffect(() => {
    // This effect runs once when the component loads
    try {
      logout(); // Clear the token from local storage and update auth state
    } catch (err) {
      console.error("Error during logout:", err);
    } finally {
      // Regardless of error, always redirect to the login page
      navigate('/login');
    }
  }, [logout, navigate]); // Dependencies for the effect

  // This component doesn't need to render anything,
  // as it just performs an action and redirects.
  // You can return null or a simple loading message.
  return (
    <div className="flex h-screen items-center justify-center">
      <p>Logging out...</p>
    </div>
  );
};

export default Logout;