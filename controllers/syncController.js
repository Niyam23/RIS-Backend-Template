const rsnaApiService = require('../services/rsnaApiService');
const relationshipService = require('../services/relationshipService');
const templateDataService = require('../services/templateDataService');
const templateGeneratorService = require('../services/templateGeneratorService');

class SyncController {
  /**
   * Sync all data from RSNA API
   */
  async syncAllData(req, res) {
    try {
      console.log('Starting full data sync from RSNA API...');
      
      // Fetch data from RSNA API
      const [subspecialties, templates] = await Promise.all([
        rsnaApiService.fetchSubspecialties(),
        rsnaApiService.fetchTemplates()
      ]);

      console.log(`Fetched ${subspecialties.length} subspecialties and ${templates.length} templates`);

      // Create relationships
      const result = await relationshipService.createRelationships(subspecialties, templates);

      if (result.success) {
        res.json({
          success: true,
          message: 'Data sync completed successfully',
          data: {
            subspecialtiesProcessed: result.stats.subspecialtiesProcessed,
            templatesProcessed: result.stats.templatesProcessed,
            relationshipsCreated: result.stats.relationshipsCreated,
            errors: result.stats.errors
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Data sync failed',
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error syncing data:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to sync data',
        message: error.message
      });
    }
  }

  /**
   * Sync data with detailed template information
   */
  async syncWithDetails(req, res) {
    try {
      console.log('Starting detailed data sync from RSNA API...');
      
      // Fetch subspecialties
      const subspecialties = await rsnaApiService.fetchSubspecialties();
      console.log(`Fetched ${subspecialties.length} subspecialties`);

      // Fetch templates with detailed information
      const templates = await rsnaApiService.fetchTemplatesWithDetails();
      console.log(`Fetched ${templates.length} templates with details`);

      // Create relationships
      const result = await relationshipService.createRelationships(subspecialties, templates);

      if (result.success) {
        res.json({
          success: true,
          message: 'Detailed data sync completed successfully',
          data: {
            subspecialtiesProcessed: result.stats.subspecialtiesProcessed,
            templatesProcessed: result.stats.templatesProcessed,
            relationshipsCreated: result.stats.relationshipsCreated,
            errors: result.stats.errors
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Detailed data sync failed',
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error syncing detailed data:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to sync detailed data',
        message: error.message
      });
    }
  }

  /**
   * Sync only subspecialties
   */
  async syncSubspecialties(req, res) {
    try {
      console.log('Syncing subspecialties...');
      
      const subspecialties = await rsnaApiService.fetchSubspecialties();
      console.log(`Fetched ${subspecialties.length} subspecialties`);

      // Create relationships with empty templates array
      const result = await relationshipService.createRelationships(subspecialties, []);

      if (result.success) {
        res.json({
          success: true,
          message: 'Subspecialties sync completed successfully',
          data: {
            subspecialtiesProcessed: result.stats.subspecialtiesProcessed,
            errors: result.stats.errors
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Subspecialties sync failed',
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error syncing subspecialties:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to sync subspecialties',
        message: error.message
      });
    }
  }

  /**
   * Sync only templates
   */
  async syncTemplates(req, res) {
    try {
      console.log('Syncing templates...');
      
      const templates = await rsnaApiService.fetchTemplates();
      console.log(`Fetched ${templates.length} templates`);

      // Get existing subspecialties
      const { Subspecialty } = require('../models');
      const existingSubspecialties = await Subspecialty.findAll();
      const subspecialtyMap = new Map();
      existingSubspecialties.forEach(sub => {
        subspecialtyMap.set(sub.code, sub);
      });

      // Create relationships with existing subspecialties
      const result = await relationshipService.createRelationships(
        existingSubspecialties.map(sub => ({
          code: sub.code,
          shortName: sub.shortName,
          name: sub.name,
          radlexID: sub.radlexID,
          count: sub.count
        })), 
        templates
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'Templates sync completed successfully',
          data: {
            templatesProcessed: result.stats.templatesProcessed,
            relationshipsCreated: result.stats.relationshipsCreated,
            errors: result.stats.errors
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Templates sync failed',
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error syncing templates:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to sync templates',
        message: error.message
      });
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(req, res) {
    try {
      const { Subspecialty, Template } = require('../models');
      const { Op } = require('sequelize');

      const totalSubspecialties = await Subspecialty.count();
      const totalTemplates = await Template.count();
      const subspecialtiesWithTemplates = await Subspecialty.count({ where: { count: { [Op.gt]: 0 } } });

      // Get last sync time (you might want to store this in a separate collection)
      const lastSyncTime = new Date(); // This should be stored and retrieved from database

      res.json({
        success: true,
        data: {
          totalSubspecialties,
          totalTemplates,
          subspecialtiesWithTemplates,
          emptySubspecialties: totalSubspecialties - subspecialtiesWithTemplates,
          lastSyncTime,
          syncStatus: 'up_to_date' // You can implement logic to determine this
        }
      });
    } catch (error) {
      console.error('Error getting sync status:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get sync status',
        message: error.message
      });
    }
  }

  /**
   * Dynamically update template data for all templates
   */
  async updateTemplateData(req, res) {
    try {
      console.log('Starting dynamic template data update...');
      
      const result = await templateDataService.updateAllTemplateData();

      if (result.success) {
        res.json({
          success: true,
          message: 'Template data update completed',
          data: {
            updated: result.updated,
            failed: result.failed,
            total: result.updated + result.failed
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Template data update failed',
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error updating template data:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to update template data',
        message: error.message
      });
    }
  }

  /**
   * Update template data for a specific template
   */
  async updateSpecificTemplateData(req, res) {
    try {
      const { templateId } = req.params;
      
      console.log(`Updating template data for: ${templateId}`);
      
      const result = await templateDataService.updateSpecificTemplate(templateId);

      if (result.success) {
        res.json({
          success: true,
          message: `Template ${templateId} updated successfully`,
          data: {
            templateId: result.template_id,
            fallback: result.fallback || false
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: `Failed to update template ${templateId}`,
          message: result.error
        });
      }
    } catch (error) {
      console.error(`Error updating template ${req.params.templateId}:`, error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to update template data',
        message: error.message
      });
    }
  }

  /**
   * Get template data statistics
   */
  async getTemplateDataStats(req, res) {
    try {
      const stats = await templateDataService.getTemplateDataStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting template data stats:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get template data statistics',
        message: error.message
      });
    }
  }

  /**
   * Generate template data for all templates
   */
  async generateAllTemplateData(req, res) {
    try {
      console.log('Starting template data generation for all templates...');
      
      const result = await templateGeneratorService.generateAllTemplateData();

      if (result.success) {
        res.json({
          success: true,
          message: 'Template data generation completed',
          data: {
            updated: result.updated
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Template data generation failed',
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error generating template data:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to generate template data',
        message: error.message
      });
    }
  }
}

module.exports = new SyncController();
