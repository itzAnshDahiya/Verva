const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);
    
    // Index creation for performance
    await createIndexes();
    
    return conn;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    // These indexes will be created by models, but ensure they exist
    const db = mongoose.connection.db;
    
    // Create text indexes for search
    await db.collection('products').createIndex({ 
      name: 'text', 
      description: 'text', 
      category: 'text' 
    });
    
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.warn(`Index creation warning: ${error.message}`);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error(`MongoDB disconnection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, disconnectDB };
