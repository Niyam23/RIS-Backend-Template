/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong'
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = {
      success: false,
      error: 'Validation Error',
      message: messages.join(', ')
    };
    return res.status(400).json(error);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      success: false,
      error: 'Duplicate Entry',
      message: `${field} already exists`
    };
    return res.status(400).json(error);
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    error = {
      success: false,
      error: 'Invalid ID',
      message: 'Invalid ID format'
    };
    return res.status(400).json(error);
  }

  // Custom error with status code
  if (err.statusCode) {
    error = {
      success: false,
      error: err.error || 'Error',
      message: err.message
    };
    return res.status(err.statusCode).json(error);
  }

  // Default 500 server error
  res.status(500).json(error);
};

module.exports = errorHandler;
