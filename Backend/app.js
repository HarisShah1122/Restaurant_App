require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const sequelize = require('./config/database');
const multer = require('multer');

const app = express();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, 'public/uploads/images');
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = '.png'; // Enforce PNG
    cb(null, `${Date.now()}_${file.originalname.replace(/\.(jpg|jpeg)$/i, '.png')}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'image/png') {
      return cb(new Error('Only PNG images are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 30 },
});

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Support multiple frontend ports
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

const loadControllers = async () => {
  const controllersPath = path.join(__dirname, 'controllers');
  try {
    const files = await fs.readdir(controllersPath);
    for (const file of files) {
      if (file.endsWith('.js')) {
        try {
          const controller = require(path.join(controllersPath, file));
          if (controller.length > 1) {
            controller(app, upload);
          } else {
            controller(app);
          }
          console.log(`Loaded controller: ${file}`);
        } catch (error) {
          console.error(`Failed to load controller ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to read controllers directory:', error);
  }
};

app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const port = process.env.PORT || 8081;
sequelize.authenticate()
  .then(() => {
    console.log('Database connected');
    return sequelize.sync({ force: false, alter: true });
  })
  .then(() => {
    console.log('Database synced');
    return loadControllers();
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch(error => {
    console.error('Database connection, sync, or controller loading failed:', error);
    process.exit(1);
  });