export default () => ({
  // Application Configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database Configuration - switches based on NODE_ENV
  database: {
    uri:
      process.env.NODE_ENV === 'test'
        ? 'mongodb://localhost:27017/payroll-test'
        : process.env.MONGO_URI ||
          'mongodb://localhost:27017/payroll-subsystems',
  },
});
