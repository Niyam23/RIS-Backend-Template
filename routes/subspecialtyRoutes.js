const express = require('express');
const router = express.Router();
const subspecialtyController = require('../controllers/subspecialtyController');

// GET /api/subspecialties - Get all subspecialties
router.get('/', subspecialtyController.getAllSubspecialties);

// GET /api/subspecialties/statistics - Get subspecialty statistics
router.get('/statistics', subspecialtyController.getStatistics);

// GET /api/subspecialties/hierarchical - Get hierarchical data (subspecialties with templates)
router.get('/hierarchical', subspecialtyController.getHierarchicalData);

// GET /api/subspecialties/:code - Get subspecialty by code
router.get('/:code', subspecialtyController.getSubspecialtyByCode);

// GET /api/subspecialties/:code/templates - Get templates for a specific subspecialty
router.get('/:code/templates', subspecialtyController.getTemplatesBySubspecialty);

module.exports = router;
