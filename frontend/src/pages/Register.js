import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { axiosInstance } from '../services/api'; 

function Register({ setIsAuthenticated, setToken }) {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      try {
        const response = await axiosInstance.post('/signup', {
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          email: email.trim(),
          password,
          role,
        });
        const { token } = response.data;
        if (!token) throw new Error('No token received');
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
        setToken(token);
        navigate('/restaurant');
      } catch (err) {
        console.error('Registration error:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        const errorMessage =
          err.response?.status === 400
            ? err.response?.data?.error || 'Invalid registration data'
            : err.response?.status === 404
            ? 'Registration service unavailable'
            : err.response?.data?.error || 'Registration failed';
        setError(errorMessage);
        setTimeout(() => setError(''), 5000);
      } finally {
        setLoading(false);
      }
    },
    [firstname, lastname, email, password, role, navigate, setIsAuthenticated, setToken]
  );

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card mt-5 animate__animated animate__fadeIn">
          <div className="card-body p-4">
            <h2 className="card-title text-center mb-4 text-success">Join Desi Delights!</h2>
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}{' '}
                <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value.trim())}
                  placeholder="e.g., Muhammad"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value.trim())}
                  placeholder="e.g., Ali"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  placeholder="e.g., muhammad.ali@example.com"
                  required
                />
              </div>
              <div className="mb-3 position-relative">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min 6 chars)"
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
              <div className="mb-3">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success w-100" disabled={loading}>
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : 'Register'}
              </button>
              <p className="mt-3 text-center">
                Already a member?{' '}
                <Link to="/login" className="text-decoration-none text-success">
                  Login Here
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(Register);