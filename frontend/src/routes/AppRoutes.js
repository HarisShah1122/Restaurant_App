import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Restaurant from '../components/restaurant';
import KarachiRestaurants from '../components/KarachiRestaurants';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Search from '../pages/Search';
import HomePage from '../components/HomePage';

function AppRoutes({
  isAuthenticated,
  time,
  handleSearch,
  handleFilter,
  restaurants,
  loading,
  token,
  setToken,
  setIsAuthenticated,
  setRestaurants,
  setLoading,
}) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            time={time}
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
        element={
          isAuthenticated ? (
            <Restaurant
              restaurants={restaurants}
              setRestaurants={setRestaurants}
              loading={loading}
              setLoading={setLoading}
              token={token}
              setToken={setToken}
              user={isAuthenticated ? { id: 1, name: 'User' } : null}
              initialRestaurants={restaurants}
              setInitialRestaurants={setRestaurants}
              handleSearch={handleSearch}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/karachi"
        element={isAuthenticated ? <KarachiRestaurants token={token} setToken={setToken} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/restaurant" replace /> : <Login setIsAuthenticated={setIsAuthenticated} setToken={setToken} />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/restaurant" replace /> : <Register setIsAuthenticated={setIsAuthenticated} setToken={setToken} />}
      />
      <Route path="/search" element={<Search handleSearch={handleSearch} token={token} setToken={setToken} />} />
    </Routes>
  );
}

export default AppRoutes;