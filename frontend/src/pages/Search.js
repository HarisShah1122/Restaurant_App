import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import SearchFilter from '../components/SearchFilter'; // Adjusted path
import Toast from '../components/Toast'; // Adjusted path
import LoadingSpinner from '../components/LoadingSpinner'; // Adjusted path
import { searchRestaurants } from '../services/api';

function Search({ setToken }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [token, setLocalToken] = useState(localStorage.getItem('token') || '');
  const navigate = useNavigate();

  const handleSearch = useCallback(
    (query, filters) => {
      const debouncedSearch = debounce(async () => {
        setLoading(true);
        try {
          if (!token) throw new Error('No authentication token found');
          const { data } = await searchRestaurants(1, 10, query, filters);
          const normalizedRestaurants = data.map((restaurant) => {
            let normalizedImages = [];
            const validImageRegex = /^[0-9a-zA-Z._-]+\.(jpg|jpeg|png)$/;
            if (Array.isArray(restaurant.images)) {
              normalizedImages = restaurant.images
                .map((img) => img.replace(/^\/?(public\/images\/|uploads\/|uploads\/images\/|Ipublicluploads\/)/, 'public/uploads/images/'))
                .filter((img) => validImageRegex.test(img.split('/').pop()));
            } else if (typeof restaurant.images === 'string') {
              const normalizedPath = restaurant.images.replace(/^\/?(public\/images\/|uploads\/|uploads\/images\/|Ipublicluploads\/)/, 'public/uploads/images/');
              if (validImageRegex.test(normalizedPath.split('/').pop())) {
                normalizedImages = [normalizedPath];
              }
            }
            return {
              ...restaurant,
              images: normalizedImages.slice(0, 2), // Limit to 2 images
              id: restaurant._id || restaurant.id || Math.random().toString(36).substring(2),
              name: (restaurant.name || 'Unknown').trim(),
              cuisine: (restaurant.cuisine || 'N/A').trim(),
              location: (restaurant.location || 'N/A').trim().replace('chken', 'chicken'),
              rating: restaurant.rating || 0,
            };
          });
          setRestaurants(normalizedRestaurants);
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch restaurants';
          setToast({ show: true, message: `Error: ${errorMessage}` });
          if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token');
            setLocalToken('');
            setToken('');
            navigate('/login');
          }
        } finally {
          setLoading(false);
        }
      }, 500);
      debouncedSearch();
    },
    [token, navigate, setToken]
  );

  useEffect(() => {
    if (!token) {
      setToast({ show: true, message: 'Please log in to view restaurants' });
      navigate('/login');
    }
  }, [token, navigate]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Search Restaurants</h1>
      <SearchFilter onSearch={handleSearch} onFilter={handleSearch} />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="row mt-4">
          {restaurants.length === 0 ? (
            <p className="text-center">No restaurants found.</p>
          ) : (
            restaurants.map((restaurant) => (
              <div className="col-md-4 mb-3" key={restaurant.id}>
                <div className="card h-100">
                  {restaurant.images.length > 0 ? (
                    <div id={`carousel-${restaurant.id}`} className="carousel slide" data-bs-ride="carousel">
                      <div className="carousel-inner">
                        {restaurant.images.map((image, index) => (
                          <div key={index} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
                            <img
                              src={`http://localhost:8081/${image}`}
                              className="d-block w-100"
                              alt={`${restaurant.name || 'Restaurant'} ${index + 1}`}
                              style={{ height: '200px', objectFit: 'cover' }}
                              loading="lazy"
                              onError={(e) => {
                                e.target.src = '/images/placeholder.jpg';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <button
                        className="carousel-control-prev"
                        type="button"
                        data-bs-target={`#carousel-${restaurant.id}`}
                        data-bs-slide="prev"
                      >
                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Previous</span>
                      </button>
                      <button
                        className="carousel-control-next"
                        type="button"
                        data-bs-target={`#carousel-${restaurant.id}`}
                        data-bs-slide="next"
                      >
                        <span className="carousel-control-next-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Next</span>
                      </button>
                    </div>
                  ) : (
                    <img
                      src="/images/placeholder.jpg"
                      className="card-img-top"
                      alt={restaurant.name || 'Restaurant'}
                      style={{ height: '200px', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{restaurant.name || 'Unknown'}</h5>
                    <p className="card-text">{restaurant.cuisine || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ show: false, message: '' })}
      />
    </div>
  );
}

export default React.memo(Search);