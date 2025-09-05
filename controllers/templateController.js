const { Template, Subspecialty } = require('../models');
const relationshipService = require('../services/relationshipService');

class TemplateController {
  /**
   * Get all templates with optional filtering and pagination
   */
  async getAllTemplates(req, res) {
    try {
      const {
        sortBy = 'created',
        sortOrder = 'desc',
        limit,
        skip = 0,
        search,
        specialty,
        specCode
      } = req.query;

      const { Op } = require('sequelize');
      let whereClause = {};

      // Add search functionality
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { specialty: { [Op.like]: `%${search}%` } }
        ];
      }

      // Filter by specialty
      if (specialty) {
        whereClause.specialty = { [Op.like]: `%${specialty}%` };
      }

      // Filter by specCode
      if (specCode) {
        whereClause.specCode = { [Op.like]: `%${specCode}%` };
      }

      const orderClause = [[sortBy, sortOrder.toUpperCase()]];

      const queryOptions = {
        where: whereClause,
        include: [{
          model: Subspecialty,
          as: 'subspecialties',
          attributes: ['code', 'name', 'shortName'],
          through: { attributes: [] }
        }],
        order: orderClause,
        offset: parseInt(skip)
      };

      if (limit) {
        queryOptions.limit = parseInt(limit);
      }

      const templates = await Template.findAll(queryOptions);
      const total = await Template.count({ where: whereClause });

      res.json({
        success: true,
        data: templates,
        pagination: {
          total,
          skip: parseInt(skip),
          limit: limit ? parseInt(limit) : null,
          hasMore: limit ? (parseInt(skip) + parseInt(limit)) < total : false
        }
      });
    } catch (error) {
      console.error('Error getting templates:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch templates',
        message: error.message
      });
    }
  }

  /**
   * Get template by ID with its subspecialties
   */
  async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const { includeSubspecialties = true } = req.query;

      let queryOptions = {
        where: { template_id: id }
      };

      if (includeSubspecialties === 'true') {
        queryOptions.include = [{
          model: Subspecialty,
          as: 'subspecialties',
          attributes: ['code', 'name', 'shortName', 'count'],
          through: { attributes: [] }
        }];
      }

      const template = await Template.findOne(queryOptions);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found',
          message: `No template found with ID: ${id}`
        });
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error(`Error getting template ${req.params.id}:`, error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch template',
        message: error.message
      });
    }
  }

  /**
   * Get subspecialties for a specific template
   */
  async getSubspecialtiesByTemplate(req, res) {
    try {
      const { id } = req.params;
      const subspecialties = await relationshipService.getSubspecialtiesByTemplate(id);

      res.json({
        success: true,
        data: subspecialties
      });
    } catch (error) {
      console.error(`Error getting subspecialties for template ${req.params.id}:`, error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subspecialties',
        message: error.message
      });
    }
  }

  /**
   * Search templates by multiple criteria
   */
  async searchTemplates(req, res) {
    try {
      const {
        q, // general search query
        title,
        specialty,
        specCode,
        author,
        sortBy = 'created',
        sortOrder = 'desc',
        limit = 20,
        skip = 0
      } = req.query;

      const { Op } = require('sequelize');
      let whereClause = {};

      // General search across multiple fields
      if (q) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
          { specialty: { [Op.like]: `%${q}%` } },
          { author: { [Op.like]: `%${q}%` } },
          { firstname: { [Op.like]: `%${q}%` } },
          { lastname: { [Op.like]: `%${q}%` } }
        ];
      }

      // Specific field searches
      if (title) {
        whereClause.title = { [Op.like]: `%${title}%` };
      }

      if (specialty) {
        whereClause.specialty = { [Op.like]: `%${specialty}%` };
      }

      if (specCode) {
        whereClause.specCode = { [Op.like]: `%${specCode}%` };
      }

      if (author) {
        whereClause[Op.or] = [
          { author: { [Op.like]: `%${author}%` } },
          { firstname: { [Op.like]: `%${author}%` } },
          { lastname: { [Op.like]: `%${author}%` } }
        ];
      }

      const orderClause = [[sortBy, sortOrder.toUpperCase()]];

      const templates = await Template.findAll({
        where: whereClause,
        include: [{
          model: Subspecialty,
          as: 'subspecialties',
          attributes: ['code', 'name', 'shortName'],
          through: { attributes: [] }
        }],
        order: orderClause,
        offset: parseInt(skip),
        limit: parseInt(limit)
      });

      const total = await Template.count({ where: whereClause });

      res.json({
        success: true,
        data: templates,
        pagination: {
          total,
          skip: parseInt(skip),
          limit: parseInt(limit),
          hasMore: (parseInt(skip) + parseInt(limit)) < total
        },
        searchCriteria: {
          q, title, specialty, specCode, author
        }
      });
    } catch (error) {
      console.error('Error searching templates:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to search templates',
        message: error.message
      });
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStatistics(req, res) {
    try {
      const { sequelize } = require('../database/connection');
      const totalTemplates = await Template.count();
      
      const totalViewsResult = await Template.findAll({
        attributes: [[sequelize.fn('SUM', sequelize.col('views')), 'total']],
        raw: true
      });
      const totalViews = totalViewsResult[0]?.total || 0;

      const totalDownloadsResult = await Template.findAll({
        attributes: [[sequelize.fn('SUM', sequelize.col('downloads')), 'total']],
        raw: true
      });
      const totalDownloads = totalDownloadsResult[0]?.total || 0;

      // Get templates by specialty
      const templatesBySpecialty = await Template.findAll({
        attributes: [
          'specialty',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['specialty'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10,
        raw: true
      });

      // Get most viewed templates
      const mostViewedTemplates = await Template.findAll({
        order: [['views', 'DESC']],
        limit: 10,
        attributes: ['template_id', 'title', 'views', 'specialty']
      });

      // Get most downloaded templates
      const mostDownloadedTemplates = await Template.findAll({
        order: [['downloads', 'DESC']],
        limit: 10,
        attributes: ['template_id', 'title', 'downloads', 'specialty']
      });

      res.json({
        success: true,
        data: {
          totalTemplates,
          totalViews: totalViews[0]?.total || 0,
          totalDownloads: totalDownloads[0]?.total || 0,
          templatesBySpecialty,
          mostViewedTemplates,
          mostDownloadedTemplates
        }
      });
    } catch (error) {
      console.error('Error getting template statistics:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch template statistics',
        message: error.message
      });
    }
  }
}

module.exports = new TemplateController();
