import axios from 'axios';

const API_URL = 'http://localhost:8081/restaurants';


const getAuthToken = () => {
  return localStorage.getItem('token') || null; 
};

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const searchRestaurants = async (page = 1, limit = 10, query = '', filters = {}) => {
  try {
    const response = await axiosInstance.get('/search', {
      params: {
        page,
        limit,
        query: query || '',
        cuisine: filters.cuisine || '',
        location: filters.location || '',
        rating: filters.rating || '',
      },
    });
    return {
      data: response.data.restaurants,
      totalPages: response.data.totalPages,
    };
  } catch (error) {
    console.error('Search restaurants error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const getSuggestions = async (query) => {
  if (!query) return [];
  try {
    const response = await axiosInstance.get('/suggestions', { params: { query } });
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
    const response = await axiosInstance.post('/', formData, {
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
    const response = await axiosInstance.put(`/${id}`, formData, {
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
    const response = await axiosInstance.delete(`/${id}`);
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