import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

/**
 * ProtectedRoute - Secures dashboard routes
 * Checks: 1) User is authenticated, 2) User has connected AWS account
 */
const ProtectedRoute = ({ children, requireAWSAccount = true }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [hasAWSAccount, setHasAWSAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      
      // Check if token exists
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        // Verify token and get user data
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setIsAuthenticated(true);
          
          // Check if user has AWS accounts connected
          const awsAccounts = response.data.user.awsAccounts || [];
          setHasAWSAccount(awsAccounts.length > 0);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        setIsAuthenticated(false);
        localStorage.removeItem('token'); // Remove invalid token
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-300 font-semibold">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }

  // Authenticated but no AWS account (and route requires it)
  if (requireAWSAccount && !hasAWSAccount) {
    return <Navigate to="/?connect=aws" replace />;
  }

  // All checks passed - render protected content
  return children;
};

export default ProtectedRoute;
