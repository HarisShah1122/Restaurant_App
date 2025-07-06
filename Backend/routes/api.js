import axios from 'axios';

const API_URL = 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
  },
});

export const searchRestaurants = async (page = 1, limit = 2, query = '') => {
  const response = await api.get('/restaurants', {
    params: { page, limit, query }
  });
  return response.data; 
};


export const createRestaurant = async (formData) => {
  const response = await api.post('/restaurants', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};


export const updateRestaurant = async (id, formData) => {
  const response = await api.put(`/restaurants/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};


export const deleteRestaurant = async (id) => {
  const response = await api.delete(`/restaurants/${id}`);
  return response.data;
};


export const getSuggestions = async (query) => {
  const response = await api.get('/suggestions', {
    params: { query }
  });
  return response.data;
};

export default api;
