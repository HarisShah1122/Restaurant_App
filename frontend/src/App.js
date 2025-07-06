import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Restaurant from './components/restaurant';
import KarachiRestaurants from './components/KarachiRestaurants';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import HomePage from './components/HomePage';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css/animate.min.css';
import { searchRestaurants } from './services/api';
import axios from 'axios';

const API_URL = 'http://localhost:8081/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const checkAuth = useCallback(async () => {
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      await axios.get(`${API_URL}/check-auth`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      setToken('');
      if (window.location.pathname !== '/' && window.location.pathname !== '/restaurant') {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchInitialRestaurants = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await searchRestaurants(1, 10, '', {});
      setRestaurants(data);
    } catch (err) {
      console.error('Initial fetch error:', err);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    checkAuth();
    fetchInitialRestaurants();
  }, [checkAuth, fetchInitialRestaurants]);

  const handleSearch = useCallback(async (query = '', filters = {}) => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await searchRestaurants(1, 10, query, filters);
      setRestaurants(data);
    } catch (err) {
      console.error('Search error:', err);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleFilter = handleSearch;

  return (
    <Router>
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <div className="container mt-4">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                handleSearch={handleSearch}
                handleFilter={handleFilter}
                restaurants={restaurants}
                loading={loading}
                token={token}
                setToken={setToken}
              />
            }
          />
          <Route
            path="/restaurant"
            element={<Restaurant token={token} setToken={setToken} />}
          />
          <Route path="/karachi" element={<KarachiRestaurants />} />
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setToken={setToken} />} />
          <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/search" element={<Search handleSearch={handleSearch} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;