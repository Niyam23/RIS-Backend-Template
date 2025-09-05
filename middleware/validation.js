/**
 * Validation middleware for common parameters
 */

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  if (id && !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID',
      message: 'Invalid ID format'
    });
  }
  
  next();
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const { limit, skip } = req.query;
  
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid pagination',
      message: 'Limit must be a number between 1 and 100'
    });
  }
  
  if (skip && (isNaN(skip) || parseInt(skip) < 0)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid pagination',
      message: 'Skip must be a non-negative number'
    });
  }
  
  next();
};

/**
 * Validate sort parameters
 */
const validateSort = (req, res, next) => {
  const { sortBy, sortOrder } = req.query;
  const allowedSortFields = ['name', 'code', 'count', 'created', 'title', 'views', 'downloads'];
  const allowedSortOrders = ['asc', 'desc'];
  
  if (sortBy && !allowedSortFields.includes(sortBy)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid sort field',
      message: `Sort field must be one of: ${allowedSortFields.join(', ')}`
    });
  }
  
  if (sortOrder && !allowedSortOrders.includes(sortOrder)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid sort order',
      message: 'Sort order must be "asc" or "desc"'
    });
  }
  
  next();
};

/**
 * Validate subspecialty code format
 */
const validateSubspecialtyCode = (req, res, next) => {
  const { code } = req.params;
  
  if (code && !/^[A-Z]{2}$/.test(code)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid subspecialty code',
      message: 'Subspecialty code must be 2 uppercase letters'
    });
  }
  
  next();
};

/**
 * Validate template ID format
 */
const validateTemplateId = (req, res, next) => {
  const { id } = req.params;
  
  if (id && !/^[0-9]+$/.test(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid template ID',
      message: 'Template ID must be numeric'
    });
  }
  
  next();
};

module.exports = {
  validateObjectId,
  validatePagination,
  validateSort,
  validateSubspecialtyCode,
  validateTemplateId
};
