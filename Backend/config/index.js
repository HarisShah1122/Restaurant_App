require('dotenv').config();

module.exports = {
  port: process.env.PORT || 8081,
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'NameApplication',
  jwtSecret: process.env.JWT_SECRET || '8Kj9mPq2v',
  db: {
    name: process.env.DB_NAME || 'restaurant',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'medimpact_mysql_user',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: process.env.DB_DIALECT || 'mysql',
    port: process.env.DB_PORT || 3306,
  },
};