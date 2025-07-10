import axios from 'axios';

const API_URL = 'http://localhost:8081'; // Adjusted base URL to root

const getAuthToken = () => {
  return localStorage.getItem('token') || null;
};

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
export const searchRestaurants = async (page = 1, limit = 10, query = '', filters = {}, token) => {
  try {
    const sanitizedFilters = {
      cuisine: (filters.cuisine || '').toLowerCase().replace('chkn', 'chicken').trim(),
      location: (filters.location || '').toLowerCase().trim(),
      rating: filters.rating ? parseFloat(filters.rating) : '',
      query: (query || '').trim(),
    };
    const response = await axiosInstance.get('/restaurants/search', {
      params: { page, limit, ...sanitizedFilters },
    });
    const data = response.data.restaurants || response.data.data || [];
    if (!Array.isArray(data)) {
      throw new Error('Invalid response data format');
    }
    return {
      data,
      totalPages: response.data.totalPages || 1,
    };
  } catch (error) {
    console.error('Search restaurants error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
      stack: error.stack,
    });
    const errorMessage =
      error.response?.status === 400
        ? error.response?.data?.error || 'Invalid search parameters. Please check your filters.'
        : error.response?.status === 401 || error.response?.status === 403
        ? 'Invalid or expired session'
        : error.response?.status === 404
        ? 'Search service unavailable'
        : error.message || 'Failed to fetch restaurants';
    throw new Error(errorMessage);
  }
};
export const getSuggestions = async (query) => {
  if (!query) return [];
  try {
    const response = await axiosInstance.get('/restaurants/suggestions', { params: { query: query.trim() } });
    return response.data.suggestions || [];
  } catch (error) {
    console.error('Error fetching suggestions:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return [];
  }
};

export const createRestaurant = async (formData) => {
  try {
    const response = await axiosInstance.post('/restaurants', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Create restaurant error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const updateRestaurant = async (id, formData) => {
  try {
    const response = await axiosInstance.put(`/restaurants/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Update restaurant error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const deleteRestaurant = async (id) => {
  try {
    const response = await axiosInstance.delete(`/restaurants/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete restaurant error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};