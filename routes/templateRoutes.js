const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');

// GET /api/templates - Get all templates
router.get('/', templateController.getAllTemplates);

// GET /api/templates/search - Search templates
router.get('/search', templateController.searchTemplates);

// GET /api/templates/statistics - Get template statistics
router.get('/statistics', templateController.getTemplateStatistics);

// GET /api/templates/:id - Get template by ID
router.get('/:id', templateController.getTemplateById);

// GET /api/templates/:id/subspecialties - Get subspecialties for a specific template
router.get('/:id/subspecialties', templateController.getSubspecialtiesByTemplate);

module.exports = router;
