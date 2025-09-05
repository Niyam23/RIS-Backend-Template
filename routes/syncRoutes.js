const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

// GET /api/sync/status - Get sync status
router.get('/status', syncController.getSyncStatus);

// POST /api/sync/all - Sync all data from RSNA API
router.post('/all', syncController.syncAllData);

// POST /api/sync/detailed - Sync data with detailed template information
router.post('/detailed', syncController.syncWithDetails);

// POST /api/sync/subspecialties - Sync only subspecialties
router.post('/subspecialties', syncController.syncSubspecialties);

// POST /api/sync/templates - Sync only templates
router.post('/templates', syncController.syncTemplates);

// POST /api/sync/template-data - Dynamically update template data for all templates
router.post('/template-data', syncController.updateTemplateData);

// POST /api/sync/template-data/:templateId - Update template data for specific template
router.post('/template-data/:templateId', syncController.updateSpecificTemplateData);

// GET /api/sync/template-data/stats - Get template data statistics
router.get('/template-data/stats', syncController.getTemplateDataStats);

// POST /api/sync/generate-template-data - Generate template data for all templates
router.post('/generate-template-data', syncController.generateAllTemplateData);

module.exports = router;
