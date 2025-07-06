import React, { useState, useEffect, useCallback } from 'react';
import {
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CButton,
  CAlert,
  CForm,
  CFormInput,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react';
import { cilPlus } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { searchRestaurants, createRestaurant, updateRestaurant, deleteRestaurant } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import SearchFilter from './SearchFilter';
import { debounce } from 'lodash';

function Restaurant({ token, setToken }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRestaurant, setNewRestaurant] = useState({ name: '', cuisine: '', location: '', rating: '', images: [] });
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ query: '', cuisine: '', location: '', rating: '' });
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const { data, totalPages } = await searchRestaurants(page, 10, filters.query, filters); // Reduced limit to 10
      const normalizedRestaurants = data.map((restaurant) => ({
        ...restaurant,
        images: Array.isArray(restaurant.images)
          ? restaurant.images.map((img) => img.replace(/^\/?(public\/images\/|uploads\/|uploads\/images\/|Ipublicluploads\/)/, 'public/uploads/images/'))
          : typeof restaurant.images === 'string'
          ? [restaurant.images.replace(/^\/?(public\/images\/|uploads\/|uploads\/images\/|Ipublicluploads\/)/, 'public/uploads/images/')]
          : [],
        id: restaurant._id || restaurant.id || Math.random().toString(36).substring(2),
        name: (restaurant.name || 'Unknown').trim(),
        cuisine: (restaurant.cuisine || 'N/A').trim(),
        location: (restaurant.location || 'N/A').trim().replace('chken', 'chicken'),
        rating: restaurant.rating || 0,
      }));
      setRestaurants(normalizedRestaurants);
      setTotalPages(totalPages);
    } catch (error) {
      console.error('Error fetching restaurants:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      const errorMessage = error.response?.status === 401 || error.response?.status === 403
        ? 'Invalid or expired session. Please log in again.'
        : error.response?.data?.error || 'Failed to fetch restaurants';
      setError(errorMessage);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        setToken('');
      }
    } finally {
      setLoading(false);
    }
  }, [page, filters, setToken]);

  useEffect(() => {
    if (!token) {
      setError('Please log in to view restaurants');
      return;
    }
    fetchRestaurants();
  }, [fetchRestaurants, token]);

  const debouncedSearch = useCallback(
    debounce((query, filterValues) => {
      setFilters({ query, ...filterValues });
      setPage(1);
      fetchRestaurants();
    }, 500),
    [fetchRestaurants]
  );

  const handleSearch = (query, filterValues) => {
    debouncedSearch(query, filterValues);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRestaurant((prev) => ({ ...prev, [name]: value }));
    if (selectedRestaurant) setSelectedRestaurant((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 30);
    if (selectedRestaurant) {
      setSelectedRestaurant((prev) => ({ ...prev, images: files }));
    } else {
      setNewRestaurant((prev) => ({ ...prev, images: files }));
    }
  };

  const setState = (updates) => {
    Object.entries(updates).forEach(([key, value]) => {
      switch (key) {
        case 'success':
          setSuccess(value);
          break;
        case 'newRestaurant':
          setNewRestaurant(value);
          break;
        case 'showModal':
          setShowModal(value);
          break;
        case 'formLoading':
          setFormLoading(value);
          break;
        case 'error':
          setError(value);
          break;
        case 'selectedRestaurant':
          setSelectedRestaurant(value);
          break;
        case 'modalData':
          setModalData(value);
          break;
        default:
          break;
      }
    });
  };

  const saveRestaurant = async (e) => {
    e.preventDefault();
    setState({ formLoading: true, error: null, success: null });

    if (!newRestaurant.name || !newRestaurant.cuisine || !newRestaurant.location || !newRestaurant.rating) {
      setState({ error: 'Name, Cuisine, Location, and Rating are required', formLoading: false });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newRestaurant.name);
      formData.append('cuisine', newRestaurant.cuisine);
      formData.append('location', newRestaurant.location);
      formData.append('rating', parseFloat(newRestaurant.rating));
      if (newRestaurant.images.length > 0) {
        newRestaurant.images.forEach((file) => formData.append('images', file));
      }

      await createRestaurant(formData, token);
      setState({
        success: 'Restaurant added successfully',
        newRestaurant: { name: '', cuisine: '', location: '', rating: '', images: [] },
        showModal: false,
        formLoading: false,
      });
      fetchRestaurants();
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error('Error creating restaurant:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      const errorMessage =
        error.response?.status === 401
          ? 'Please log in to create a restaurant'
          : error.response?.status === 403
          ? 'Invalid or expired session. Please log in again.'
          : error.response?.data?.errors
          ? error.response.data.errors.map((err) => err.msg).join(', ')
          : error.response?.data?.error || 'Failed to create restaurant';
      setState({ error: errorMessage, formLoading: false });
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        setToken('');
      }
    }
  };

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    setState({ formLoading: true, error: null, success: null });

    if (!selectedRestaurant.name || !selectedRestaurant.cuisine || !selectedRestaurant.location || !selectedRestaurant.rating) {
      setState({ error: 'Name, Cuisine, Location, and Rating are required', formLoading: false });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', selectedRestaurant.name);
      formData.append('cuisine', selectedRestaurant.cuisine);
      formData.append('location', selectedRestaurant.location);
      formData.append('rating', parseFloat(selectedRestaurant.rating));
      if (selectedRestaurant.images.length > 0) {
        selectedRestaurant.images.forEach((file) => formData.append('images', file));
      }

      await updateRestaurant(selectedRestaurant.id, formData, token);
      setState({
        success: 'Restaurant updated successfully',
        selectedRestaurant: null,
        showModal: false,
        formLoading: false,
      });
      fetchRestaurants();
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error('Error updating restaurant:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      const errorMessage =
        error.response?.status === 401
          ? 'Please log in to update a restaurant'
          : error.response?.status === 403
          ? 'Invalid or expired session. Please log in again.'
          : error.response?.data?.errors
          ? error.response.data.errors.map((err) => err.msg).join(', ')
          : error.response?.data?.error || 'Failed to update restaurant';
      setState({ error: errorMessage, formLoading: false });
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        setToken('');
      }
    }
  };

  const handleDeleteRestaurant = async (id) => {
    setState({ loading: true, error: null, success: null });
    try {
      await deleteRestaurant(id, token);
      setState({ success: 'Restaurant deleted successfully', loading: false });
      fetchRestaurants();
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error('Error deleting restaurant:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      const errorMessage =
        error.response?.status === 401
          ? 'Please log in to delete a restaurant'
          : error.response?.status === 403
          ? 'Invalid or expired session. Please log in again.'
          : error.response?.data?.error || 'Failed to delete restaurant';
      setState({ error: errorMessage, loading: false });
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        setToken('');
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) setPage(newPage);
  };

  const openModal = (restaurant) => {
    setState({ modalData: restaurant || null, showModal: true });
  };

  const handleAction = (action) => {
    if (action === 'close') {
      setState({ showModal: false, modalData: null, selectedRestaurant: null });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <CCol xs={12}>
      <CCard className="mb-4">
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <strong>Restaurants</strong>
            <CButton
              color="primary"
              onClick={() => openModal(null)}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.8rem',
                lineHeight: '1.2',
              }}
            >
              <CIcon icon={cilPlus} className="me-1" style={{ width: '16px', height: '16px' }} />
              Add Restaurant
            </CButton>
          </div>
          {success && (
            <CAlert
              color="success"
              className="mt-2 py-1 px-3"
              style={{
                fontSize: '0.9rem',
                lineHeight: '1.2',
                border: 'none',
                backgroundColor: '#d4edda',
                color: '#155724',
              }}
            >
              {success}
            </CAlert>
          )}
          {error && (
            <CAlert
              color="danger"
              className="mt-2 py-1 px-3"
              style={{
                fontSize: '0.9rem',
                lineHeight: '1.2',
                border: 'none',
                backgroundColor: '#f8d7da',
                color: '#721c24',
              }}
            >
              {error}
            </CAlert>
          )}
        </CCardHeader>
        <CCardBody>
          <h2
            className="text-center mb-4 gradient-text animate__animated animate__fadeInDown"
            style={{
              fontWeight: 'bold',
              fontFamily: "'Roboto Slab', 'Arial Black', 'sans-serif'",
              background: 'linear-gradient(90deg, #ff416c, #ff4b2b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'fadeInDown 1.2s ease-in-out',
            }}
          >
            Desi Delights: Feast with Flavor!
          </h2>
          <p className="lead text-muted text-center">
            Savor authentic Pakistani cuisine{' '}
            {new Date().toLocaleTimeString('en-Pzareen-PK', {
              timeZone: 'Asia/Karachi',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
            ,{' '}
            {new Date().toLocaleDateString('en-PK', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>

          <SearchFilter onSearch={handleSearch} />

          {loading ? (
            <CSpinner color="primary" />
          ) : (
            <CTable hover striped bordered>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Cuisine</CTableHeaderCell>
                  <CTableHeaderCell>Location</CTableHeaderCell>
                  <CTableHeaderCell>Rating</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {restaurants.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan="5" className="text-center">
                      No restaurants found for "{filters.query}"
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  restaurants.map((restaurant) => (
                    <CTableRow key={restaurant.id}>
                      <CTableDataCell>{restaurant.name}</CTableDataCell>
                      <CTableDataCell>{restaurant.cuisine}</CTableDataCell>
                      <CTableDataCell>{restaurant.location}</CTableDataCell>
                      <CTableDataCell>{restaurant.rating} / 5</CTableDataCell>
                      <CTableDataCell>
                        <CDropdown alignment="end">
                          <CDropdownToggle
                            color="light"
                            caret={false}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f1f1f1',
                              border: 'none',
                              borderRadius: '6px',
                            }}
                          >
                            <span style={{ fontSize: '24px', cursor: 'pointer' }}>⋯</span>
                          </CDropdownToggle>
                          <CDropdownMenu>
                            <CDropdownItem onClick={() => setSelectedRestaurant(restaurant)}>
                              Edit
                            </CDropdownItem>
                            <CDropdownItem onClick={() => openModal(restaurant)}>View Details</CDropdownItem>
                            <CDropdownItem onClick={() => handleDeleteRestaurant(restaurant.id)}>
                              Delete
                            </CDropdownItem>
                          </CDropdownMenu>
                        </CDropdown>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}

          <CModal visible={showModal && !modalData && !selectedRestaurant} onClose={() => handleAction('close')}>
            <CModalHeader>
              <CModalTitle>Add New Restaurant</CModalTitle>
            </CModalHeader>
            <CModalBody>
              {error && <CAlert color="danger">{error}</CAlert>}
              {formLoading && <CSpinner color="primary" />}
              <CForm onSubmit={saveRestaurant}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Name</label>
                  <CFormInput
                    type="text"
                    name="name"
                    value={newRestaurant.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter restaurant name"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Cuisine</label>
                  <CFormInput
                    type="text"
                    name="cuisine"
                    value={newRestaurant.cuisine}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter cuisine"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Location</label>
                  <CFormInput
                    type="text"
                    name="location"
                    value={newRestaurant.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter location"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Rating</label>
                  <CFormInput
                    type="number"
                    name="rating"
                    value={newRestaurant.rating}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter rating (0-5)"
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Images (optional)</label>
                  <CFormInput
                    type="file"
                    multiple
                    onChange={handleImageChange}
                    accept="image/png,image/jpeg"
                  />
                </div>
                <CButton color="primary" type="submit" disabled={formLoading}>
                  Save
                </CButton>
              </CForm>
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => handleAction('close')} disabled={formLoading}>
                Cancel
              </CButton>
            </CModalFooter>
          </CModal>

          <CModal visible={showModal && !!selectedRestaurant} onClose={() => handleAction('close')}>
            <CModalHeader>
              <CModalTitle>Edit Restaurant</CModalTitle>
            </CModalHeader>
            <CModalBody>
              {error && <CAlert color="danger">{error}</CAlert>}
              {formLoading && <CSpinner color="primary" />}
              <CForm onSubmit={handleUpdateRestaurant}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Name</label>
                  <CFormInput
                    type="text"
                    name="name"
                    value={selectedRestaurant ? selectedRestaurant.name : ''}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter restaurant name"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Cuisine</label>
                  <CFormInput
                    type="text"
                    name="cuisine"
                    value={selectedRestaurant ? selectedRestaurant.cuisine : ''}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter cuisine"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Location</label>
                  <CFormInput
                    type="text"
                    name="location"
                    value={selectedRestaurant ? selectedRestaurant.location : ''}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter location"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Rating</label>
                  <CFormInput
                    type="number"
                    name="rating"
                    value={selectedRestaurant ? selectedRestaurant.rating : ''}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter rating (0-5)"
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Images (optional)</label>
                  <CFormInput
                    type="file"
                    multiple
                    onChange={handleImageChange}
                    accept="image/png,image/jpeg"
                  />
                </div>
                <CButton color="primary" type="submit" disabled={formLoading}>
                  Update
                </CButton>
              </CForm>
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => handleAction('close')} disabled={formLoading}>
                Cancel
              </CButton>
            </CModalFooter>
          </CModal>

          <CModal visible={showModal && modalData && !selectedRestaurant} onClose={() => handleAction('close')}>
            <CModalHeader>
              <CModalTitle>{modalData?.name}</CModalTitle>
            </CModalHeader>
            <CModalBody>
              <div className="row">
                <div className="col-md-6">
                  <img
                    src={
                      modalData?.images && modalData.images.length > 0
                        ? `http://localhost:8081${modalData.images[0]}`
                        : '/images/placeholder.jpg'
                    }
                    alt={`${modalData?.name || 'Restaurant'} 1`} // Removed "Image"
                    className="img-fluid"
                    style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'cover', borderRadius: '10px' }}
                    loading="lazy" // Added lazy loading
                    onError={(e) => (e.target.src = '/images/placeholder.jpg')}
                  />
                </div>
                <div className="col-md-6">
                  <p>
                    <strong>Cuisine:</strong> {modalData?.cuisine}
                  </p>
                  <p>
                    <strong>Location:</strong> {modalData?.location}
                  </p>
                  <p>
                    <strong>Rating:</strong> {modalData?.rating} / 5
                  </p>
                </div>
              </div>
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => handleAction('close')}>
                Close
              </CButton>
            </CModalFooter>
          </CModal>

          <nav aria-label="Page navigation">
            <ul className="pagination justify-content-center">
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
        </CCardBody>
      </CCard>
    </CCol>
  );
}

export default React.memo(Restaurant);