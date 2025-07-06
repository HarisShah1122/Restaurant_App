const express = require('express');
const router = express.Router();
const { getRestaurants, getSuggestions, createRestaurant } = require('../controllers/restaurantController');
const { validateSearchQuery, validateFilters } = require('../helpers/validation');
const { Op } = require('sequelize');

router.get('/restaurants', validateSearchQuery, validateFilters, getRestaurants);
router.get('/suggestions', validateSearchQuery, getSuggestions);
router.post('/restaurants', createRestaurant);

module.exports = router;