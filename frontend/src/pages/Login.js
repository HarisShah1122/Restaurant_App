import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Toast from '../components/Toast';
import { axiosInstance } from '../services/api'; 

function Login({ setIsAuthenticated, setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [progress, setProgress] = useState(0);
  const emailRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (error) emailRef.current.focus();
  }, [error]);

  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = 'auto';
    };
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      setProgress(0);

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      try {
        // Use axiosInstance with baseURL from api.js, adjust to /login
        const response = await axiosInstance.post('/login', { email: email.trim(), password });
        const { token } = response.data;
        if (!token) throw new Error('No token received');
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
        setToken(token);
        setToast({ show: true, message: 'Login successful! Redirecting...' });
        setTimeout(() => navigate('/restaurant'), 1000);
      } catch (err) {
        console.error('Login error:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        const errorMessage =
          err.response?.status === 404
            ? 'Login service unavailable. Please try again later.'
            : err.response?.status === 401
            ? 'Invalid email or password.'
            : err.response?.data?.error || 'Login failed. Please try again.';
        setError(errorMessage);
        setToast({ show: true, message: errorMessage });
        setTimeout(() => setError(''), 5000);
      } finally {
        setLoading(false);
        clearInterval(interval);
        setProgress(100);
      }
    },
    [email, password, navigate, setIsAuthenticated, setToken]
  );

  const [toast, setToast] = useState({ show: false, message: '' });

  return (
    <div className="row justify-content-center" style={{ overflowX: 'hidden' }}>
      <div className="col-md-6">
        <div className="card mt-5 animate__animated animate__zoomIn">
          <div className="card-body p-5">
            <h2 className="card-title text-center mb-4 text-primary">Welcome Back to Desi Delights!</h2>
            <p className="text-center text-muted mb-4">Sign in to enjoy authentic Pakistani flavors</p>
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}{' '}
                <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label">Email</label>
                <input
                  ref={emailRef}
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  placeholder="e.g., muhammad.ali@example.com"
                  required
                />
              </div>
              <div className="mb-4 position-relative">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your secure password"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <div className="progress">
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : 'Login'}
              </button>
              <p className="mt-3 text-center">
                New here?{' '}
                <Link to="/register" className="text-decoration-none text-primary fw-bold">
                  Join Us Now!
                </Link>
              </p>
            </form>
          </div>
        </div>
        <Toast
          show={toast.show}
          message={toast.message}
          onClose={() => setToast({ show: false, message: '' })}
        />
      </div>
    </div>
  );
}

export default React.memo(Login);