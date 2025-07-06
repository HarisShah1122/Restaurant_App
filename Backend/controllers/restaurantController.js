const { FoodPlace, sequelize } = require('../models/restaurant');
const { validationResult } = require('express-validator');
const { validationRestaurant, validateSearchQuery, validateFilters } = require('../helpers/validation');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const config = { jwtSecret: '8Kj9mPq2v' };

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    jwt.verify(token, config.jwtSecret);
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = 'public/uploads/images/';
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const uploadMiddleware = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/image\/(png|jpeg|jpg)/)) {
      return cb(new Error('Only PNG and JPEG images are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 30 },
}).array('images');

module.exports = (app) => {
  // Create a new restaurant
  app.post('/restaurants', authenticate, uploadMiddleware, validationRestaurant, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, cuisine, location, rating } = req.body;
      const images = req.files ? req.files.map((file) => `/public/uploads/images/${file.filename}`) : [];

      const newFoodPlace = await FoodPlace.create(
        { name, cuisine, location, rating: parseFloat(rating), images },
        { transaction }
      );
      await transaction.commit();
      res.status(201).json(newFoodPlace);
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: error.message || 'Failed to create restaurant' });
    }
  });

  // Search restaurants with pagination and filters
  app.get('/restaurants/search', authenticate, validateSearchQuery, validateFilters, async (req, res) => {
    try {
      const { query = '', cuisine, location, rating, page = 1, limit = 2 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let whereClause = {};
      if (query) whereClause.name = { [Op.iLike]: `%${query}%` };
      if (cuisine) whereClause.cuisine = cuisine;
      if (location) whereClause.location = location;
      if (rating) whereClause.rating = { [Op.gte]: parseFloat(rating) };

      const { count, rows } = await FoodPlace.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset,
        order: [['rating', 'DESC']],
      });

      res.json({
        restaurants: rows,
        totalPages: Math.ceil(count / parseInt(limit)),
      });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to fetch restaurants' });
    }
  });

  // Get suggestions for search
  app.get('/restaurants/suggestions', authenticate, validateSearchQuery, async (req, res) => {
    try {
      const { query = '' } = req.query;
      if (!query) return res.json({ suggestions: [] });

      const suggestions = await FoodPlace.findAll({
        attributes: ['name'],
        where: { name: { [Op.iLike]: `%${query}%` } },
        limit: 5,
      });

      res.json({ suggestions: suggestions.map((s) => s.name) });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to fetch suggestions' });
    }
  });

  // Get a single restaurant by ID
  app.get('/restaurants/:id', authenticate, async (req, res) => {
    try {
      const foodPlace = await FoodPlace.findByPk(req.params.id);
      if (!foodPlace) return res.status(404).json({ error: 'Restaurant not found' });
      res.json(foodPlace);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to fetch restaurant' });
    }
  });

  // Update a restaurant
  app.put('/restaurants/:id', authenticate, uploadMiddleware, validationRestaurant, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, cuisine, location, rating } = req.body;
      const images = req.files.length > 0 ? req.files.map((file) => `/public/uploads/images/${file.filename}`) : req.body.images || [];

      const foodPlace = await FoodPlace.findByPk(req.params.id, { transaction });
      if (!foodPlace) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      await foodPlace.update({ name, cuisine, location, rating: parseFloat(rating), images }, { transaction });
      await transaction.commit();
      res.json(foodPlace);
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: error.message || 'Failed to update restaurant' });
    }
  });

  // Delete a restaurant
  app.delete('/restaurants/:id', authenticate, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const foodPlace = await FoodPlace.findByPk(req.params.id, { transaction });
      if (!foodPlace) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Restaurant not found' });
      }
      await foodPlace.destroy({ transaction });
      await transaction.commit();
      res.status(204).send();
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: error.message || 'Failed to delete restaurant' });
    }
  });

  // Get all restaurants (optional, kept for completeness)
  app.get('/all-restaurants', authenticate, async (req, res) => {
    try {
      const foodPlaces = await FoodPlace.findAll();
      res.json(foodPlaces);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Failed to fetch all restaurants' });
    }
  });
};