import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import SearchFilter from './SearchFilter';
import RestaurantList from './RestaurantList';
import Toast from './Toast';
import LoadingSpinner from './LoadingSpinner';
import { searchRestaurants, createRestaurant } from '../services/api';

function KarachiRestaurants({ setToken }) {
  const [restaurants, setRestaurants] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    location: 'Karachi',
    rating: '',
    images: [],
  });
  const [toast, setToast] = useState({ show: false, message: '' });
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const cuisines = ['Biryani', 'Karahi', 'Tikka', 'Nihari', 'Pulao', 'Haleem', 'Chapli', 'Seekh', 'Qorma', 'Samosa'];
  const locations = ['Karachi', 'Clifton', 'Gulshan', 'Defence', 'Saddar'];
  const ratings = [3.0, 3.5, 4.0, 4.5, 5.0];
  const [token, setLocalToken] = useState(localStorage.getItem('token') || '');
  const navigate = useNavigate();

  const fetchRestaurants = useCallback(
    (query = '', filters = {}) => {
      return async () => {
        setLoading(true);
        try {
          if (!token) throw new Error('No authentication token found');
          const { data } = await searchRestaurants(1, 10, query, { ...filters, location: 'Karachi' });
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
              _id: restaurant._id || restaurant.id || Math.random().toString(36).substring(2),
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
      };
    },
    [token, navigate, setToken]
  );

  useEffect(() => {
    if (!token) {
      setToast({ show: true, message: 'Please log in to view restaurants' });
      navigate('/login');
      return;
    }
    fetchRestaurants()();
  }, [fetchRestaurants, token, navigate]);

  const debouncedFetchRestaurants = useCallback(
    (query, filters) => {
      const debounced = debounce(() => {
        fetchRestaurants(query, filters)();
      }, 500);
      debounced();
    },
    [fetchRestaurants]
  );

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.trim() }));
    setFormError(null);
  }, []);

  const handleImageChange = useCallback((e) => {
    const files = Array.from(e.target.files).slice(0, 2); // Limit to 2 images
    setFormData((prev) => ({ ...prev, images: files }));
    setFormError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setFormError(null);
      setFormLoading(true);

      if (!formData.name || !formData.cuisine || !formData.location || !formData.rating) {
        setFormError('Name, Cuisine, Location, and Rating are required');
        setFormLoading(false);
        return;
      }

      try {
        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('cuisine', formData.cuisine);
        payload.append('location', formData.location);
        payload.append('rating', parseFloat(formData.rating));
        formData.images.forEach((file) => payload.append('images', file));

        const response = await createRestaurant(payload);
        const newRestaurant = {
          ...response,
          images: Array.isArray(response.images)
            ? response.images
                .map((img) => img.replace(/^\/?(public\/images\/|uploads\/|uploads\/images\/|Ipublicluploads\/)/, 'public/uploads/images/'))
                .filter((img) => /^[0-9a-zA-Z._-]+\.(jpg|jpeg|png)$/.test(img.split('/').pop()))
                .slice(0, 2)
            : [],
          _id: response._id || response.id || Math.random().toString(36).substring(2),
          id: response._id || response.id || Math.random().toString(36).substring(2),
          name: (response.name || 'Unknown').trim(),
          cuisine: (response.cuisine || 'N/A').trim(),
          location: (response.location || 'N/A').trim().replace('chken', 'chicken'),
          rating: response.rating || 0,
        };
        setRestaurants((prev) => [...prev, newRestaurant]);
        setToast({ show: true, message: 'Restaurant added successfully!' });
        setFormData({ name: '', cuisine: '', location: 'Karachi', rating: '', images: [] });
        setShowModal(false);
      } catch (error) {
        const errorMessage =
          error.response?.status === 401
            ? 'Please log in to add a restaurant'
            : error.response?.status === 403
            ? 'Invalid or expired session. Please log in again.'
            : error.response?.data?.errors
            ? error.response.data.errors.map((err) => err.msg).join(', ')
            : error.response?.data?.error || 'Failed to add restaurant';
        setFormError(errorMessage);
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          setLocalToken('');
          setToken('');
          navigate('/login');
        }
      } finally {
        setFormLoading(false);
      }
    },
    [formData, navigate, setToken]
  );

  const handleSearch = useCallback(
    (query, filters) => {
      debouncedFetchRestaurants(query, filters);
    },
    [debouncedFetchRestaurants]
  );

  const handleFilter = useCallback(
    (query, filters) => {
      debouncedFetchRestaurants(query, filters);
    },
    [debouncedFetchRestaurants]
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Karachi Restaurants</h1>
      <div className="text-end mb-3">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Add Restaurant
        </button>
      </div>
      <SearchFilter onSearch={handleSearch} onFilter={handleFilter} />
      {loading ? <LoadingSpinner /> : <RestaurantList restaurants={restaurants} />}
      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ show: false, message: '' })}
      />
      {showModal && (
        <div className="modal" tabIndex="-1" style={{ display: 'block' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Restaurant</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  disabled={formLoading}
                ></button>
              </div>
              <div className="modal-body">
                {formError && (
                  <div className_SPIED="true" className="alert alert-danger" role="alert">
                    {formError}
                  </div>
                )}
                {formLoading && (
                  <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="e.g., Karachi Spice"
                        required
                        disabled={formLoading}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Cuisine</label>
                      <select
                        name="cuisine"
                        value={formData.cuisine}
                        onChange={handleInputChange}
                        className="form-select"
                        required
                        disabled={formLoading}
                      >
                        <option value="">Select Cuisine</option>
                        {cuisines.map((cuisine) => (
                          <option key={cuisine} value={cuisine}>
                            {cuisine}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Location</label>
                      <select
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="form-select"
                        required
                        disabled={formLoading}
                      >
                        <option value="">Select Location</option>
                        {locations.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Rating (0-5)</label>
                      <select
                        name="rating"
                        value={formData.rating}
                        onChange={handleInputChange}
                        className="form-select"
                        required
                        disabled={formLoading}
                      >
                        <option value="">Select Rating</option>
                        {ratings.map((rating) => (
                          <option key={rating} value={rating}>
                            {rating}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">Images (optional, up to 2, PNG/JPEG, ≤5MB each)</label>
                      <input
                        type="file"
                        multiple
                        onChange={handleImageChange}
                        className="form-control"
                        accept="image/png,image/jpeg"
                        disabled={formLoading}
                      />
                      {formData.images.length > 0 && (
                        <div className="mt-2">
                          <p>Selected files: {formData.images.length}</p>
                          <ul className="list-group">
                            {formData.images.map((file, index) => (
                              <li key={index} className="list-group-item">
                                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer mt-4">
                    <button type="submit" className="btn btn-primary" disabled={formLoading}>
                      Save Restaurant
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary ms-2"
                      onClick={() => setShowModal(false)}
                      disabled={formLoading}
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(KarachiRestaurants);