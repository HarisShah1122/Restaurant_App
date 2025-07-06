import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import SearchFilter from './SearchFilter';
import Toast from './Toast';
import LoadingSpinner from './LoadingSpinner';
import { searchRestaurants } from '../services/api';

function HomePage({ handleSearch: parentHandleSearch, handleFilter: parentHandleFilter, token, setToken }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [filters, setFilters] = useState(
    useMemo(() => ({ query: '', cuisine: '', location: '', rating: '' }), [])
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const normalizeRestaurants = useCallback((data) => {
    return data.map((restaurant) => {
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
        _id: restaurant._id || restaurant.id || Math.random().toString(36).substring(2),
        id: restaurant._id || restaurant.id || Math.random().toString(36).substring(2),
        name: (restaurant.name || 'Unknown').trim(),
        cuisine: (restaurant.cuisine || 'N/A').trim(),
        location: (restaurant.location || 'N/A').trim().replace('chken', 'chicken'),
        rating: restaurant.rating || 0,
      };
    });
  }, []);

  const fetchRestaurants = useCallback(
    async (query = '', filterValues = {}, pageNum = page) => {
      if (!token) {
        setToast({ show: true, message: 'Please log in to view restaurants' });
        navigate('/login');
        return;
      }
      setLoading(true);
      try {
        const { data, totalPages } = await searchRestaurants(pageNum, 10, query, filterValues);
        const normalizedRestaurants = normalizeRestaurants(data);
        setRestaurants(normalizedRestaurants);
        setTotalPages(totalPages);
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch restaurants';
        setToast({ show: true, message: `Error: ${errorMessage}` });
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          setToken('');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    },
    [page, token, navigate, setToken, normalizeRestaurants]
  );

  useEffect(() => {
    fetchRestaurants(filters.query, filters);
  }, [fetchRestaurants, filters]);

  const handleSearch = useCallback(
    (query, filterValues) => {
      const debounced = debounce(() => {
        setFilters({ query, ...filterValues });
        setPage(1);
        fetchRestaurants(query, filterValues, 1);
        parentHandleSearch(query, filterValues);
      }, 500);
      debounced();
    },
    [fetchRestaurants, parentHandleSearch]
  );

  const handleFilter = useCallback(
    (query, filterValues) => {
      const debounced = debounce(() => {
        setFilters({ query, ...filterValues });
        setPage(1);
        fetchRestaurants(query, filterValues, 1);
        parentHandleFilter(query, filterValues);
      }, 500);
      debounced();
    },
    [fetchRestaurants, parentHandleFilter]
  );

  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage > 0 && newPage <= totalPages) {
        setPage(newPage);
        fetchRestaurants(filters.query, filters, newPage);
      }
    },
    [totalPages, filters, fetchRestaurants]
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-3 text-primary text-center">Welcome to Delights: Feast with Flavor</h1>
      <p className="text-center">Explore our delicious Pakistani cuisine options.</p>
      <p className="text-center">
        Current Time: {time.toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi' })}
      </p>

      <SearchFilter onSearch={handleSearch} onFilter={handleFilter} />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="row mt-4">
          {restaurants.length === 0 ? (
            <p className="text-center">No restaurants found.</p>
          ) : (
            restaurants.map((restaurant) => (
              <div className="col-md-4 mb-3" key={restaurant._id || restaurant.id}>
                <div className="card h-100">
                  {restaurant.images.length > 0 ? (
                    <div id={`carousel-${restaurant._id || restaurant.id}`} className="carousel slide" data-bs-ride="carousel">
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
                        data-bs-target={`#carousel-${restaurant._id || restaurant.id}`}
                        data-bs-slide="prev"
                      >
                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Previous</span>
                      </button>
                      <button
                        className="carousel-control-next"
                        type="button"
                        data-bs-target={`#carousel-${restaurant._id || restaurant.id}`}
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

      <nav aria-label="Page navigation">
        <ul className="pagination justify-content-center mt-4">
          <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(page - 1)}>
              Previous
            </button>
          </li>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <li key={num} className={`page-item ${page === num ? 'active' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(num)}>
                {num}
              </button>
            </li>
          ))}
          <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(page + 1)}>
              Next
            </button>
          </li>
        </ul>
      </nav>

      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ show: false, message: '' })}
      />
    </div>
  );
}

export default React.memo(HomePage);