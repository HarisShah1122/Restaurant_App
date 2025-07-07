import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Navbar';
import AppRoutes from './routes/AppRoutes';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css/animate.min.css';
import { searchRestaurants } from './services/api';
import axios from 'axios';

const API_URL = 'http://localhost:8081/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [time, setTime] = useState(new Date());
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      console.error('Authentication check failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.response?.status === 404) {
        // Fallback: Try fetching restaurants to validate token
        try {
          await searchRestaurants(1, 1, '', {}, token);
          setIsAuthenticated(true);
        } catch (fallbackError) {
          console.error('Fallback auth check failed:', {
            message: fallbackError.message,
            status: fallbackError.response?.status,
            data: fallbackError.response?.data,
          });
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          setToken('');
        }
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        setToken('');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchInitialRestaurants = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await searchRestaurants(1, 10, '', {}, token);
      setRestaurants(data);
    } catch (err) {
      console.error('Error fetching initial restaurants:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    checkAuth();
    if (isAuthenticated) {
      fetchInitialRestaurants();
    }
  }, [checkAuth, fetchInitialRestaurants, isAuthenticated]);

  const handleSearch = useCallback(async (query = '', filters = {}) => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await searchRestaurants(1, 10, query, filters, token);
      setRestaurants(data);
    } catch (err) {
      console.error('Error searching restaurants:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
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
        <AppRoutes
          isAuthenticated={isAuthenticated}
          time={time}
          handleSearch={handleSearch}
          handleFilter={handleFilter}
          restaurants={restaurants}
          loading={loading}
          token={token}
          setToken={setToken}
          setIsAuthenticated={setIsAuthenticated}
          setRestaurants={setRestaurants}
          setLoading={setLoading}
        />
      </div>
    </Router>
  );
}

export default App;