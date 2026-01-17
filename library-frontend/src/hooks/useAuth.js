// src/hooks/useAuth.js
import { useContext } from 'react';
import AuthContext from '../context/AuthProvider';

const useAuth = () => {
    const context = useContext(AuthContext);

    // Safety Check: Agar developer ne galti se ise AuthProvider ke bahar use kiya
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
};

export default useAuth;