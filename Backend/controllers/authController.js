const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Users = require('../models/Users');
const { validationUser, validationLogin } = require('../helpers/validation');
const config = require('../config');

module.exports = (app) => {
  app.post('/signup', validationUser, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array().map(err => err.msg).join(', ') });
    }

    try {
      const hashedPassword = await bcrypt.hash(req.body.password.trim(), 10);
      const user = await Users.create({
        id: uuidv4(),
        firstname: req.body.firstname.trim(),
        lastname: req.body.lastname.trim(),
        email: req.body.email.trim().toLowerCase(),
        password: hashedPassword,
        role: req.body.role?.trim() || 'customer',
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        message: 'User registered successfully.',
        token,
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (error) {
      console.error('Signup error:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Email already in use.' });
      }
      return res.status(500).json({ error: `User registration failed: ${error.message}` });
    }
  });

  app.post('/login', validationLogin, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array().map(err => err.msg).join(', ') });
    }

    try {
      const user = await Users.findOne({ where: { email: req.body.email.trim().toLowerCase() } });
      if (!user) return res.status(404).json({ error: 'User not found.' });

      const isMatch = await bcrypt.compare(req.body.password.trim(), user.password);
      if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        message: 'Login successful.',
        token,
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: `Login failed: ${error.message}` });
    }
  });
};