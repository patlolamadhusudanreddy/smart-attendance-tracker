const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_attendance';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Error] Connection failed: ${error.message}`);
    console.log('[MongoDB] Retrying connection in 3 seconds...');
    setTimeout(connectDB, 3000);
  }
};

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected. Reconnecting...');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB Error]', err.message);
});

module.exports = connectDB;
