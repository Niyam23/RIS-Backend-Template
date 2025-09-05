const { Subspecialty, Template } = require('../models');
const relationshipService = require('../services/relationshipService');

class SubspecialtyController {
  /**
   * Get all subspecialties with optional filtering and pagination
   */
  async getAllSubspecialties(req, res) {
    try {
      const {
        includeEmpty = false,
        sortBy = 'name',
        sortOrder = 'asc',
        limit,
        skip = 0,
        search
      } = req.query;

      const { Op } = require('sequelize');
      let whereClause = {};
      
      // Filter out empty subspecialties if requested
      if (!includeEmpty) {
        whereClause.count = { [Op.gt]: 0 };
      }

      // Add search functionality
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { shortName: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } }
        ];
      }

      const orderClause = [[sortBy, sortOrder.toUpperCase()]];

      const queryOptions = {
        where: whereClause,
        order: orderClause,
        offset: parseInt(skip)
      };

      if (limit) {
        queryOptions.limit = parseInt(limit);
      }

      const subspecialties = await Subspecialty.findAll(queryOptions);
      const total = await Subspecialty.count({ where: whereClause });

      res.json({
        success: true,
        data: subspecialties,
        pagination: {
          total,
          skip: parseInt(skip),
          limit: limit ? parseInt(limit) : null,
          hasMore: limit ? (parseInt(skip) + parseInt(limit)) < total : false
        }
      });
    } catch (error) {
      console.error('Error getting subspecialties:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subspecialties',
        message: error.message
      });
    }
  }

  /**
   * Get subspecialty by code with its templates
   */
  async getSubspecialtyByCode(req, res) {
    try {
      const { code } = req.params;
      const { includeTemplates = true } = req.query;

      let queryOptions = {
        where: { code }
      };

      if (includeTemplates === 'true') {
        queryOptions.include = [{
          model: Template,
          as: 'templates',
          attributes: ['template_id', 'title', 'created', 'views', 'downloads', 'specialty', 'specCode', 'description', 'author'],
          through: { attributes: [] },
          order: [['created', 'DESC']]
        }];
      }

      const subspecialty = await Subspecialty.findOne(queryOptions);

      if (!subspecialty) {
        return res.status(404).json({
          success: false,
          error: 'Subspecialty not found',
          message: `No subspecialty found with code: ${code}`
        });
      }

      res.json({
        success: true,
        data: subspecialty
      });
    } catch (error) {
      console.error(`Error getting subspecialty ${req.params.code}:`, error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subspecialty',
        message: error.message
      });
    }
  }

  /**
   * Get templates for a specific subspecialty
   */
  async getTemplatesBySubspecialty(req, res) {
    try {
      const { code } = req.params;
      const {
        sortBy = 'created',
        sortOrder = 'desc',
        limit,
        skip = 0
      } = req.query;

      const templates = await relationshipService.getTemplatesBySubspecialty(code);

      // Apply sorting
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      templates.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });

      // Apply pagination
      const startIndex = parseInt(skip);
      const endIndex = limit ? startIndex + parseInt(limit) : templates.length;
      const paginatedTemplates = templates.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedTemplates,
        pagination: {
          total: templates.length,
          skip: parseInt(skip),
          limit: limit ? parseInt(limit) : null,
          hasMore: limit ? endIndex < templates.length : false
        }
      });
    } catch (error) {
      console.error(`Error getting templates for subspecialty ${req.params.code}:`, error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch templates',
        message: error.message
      });
    }
  }

  /**
   * Get hierarchical data (subspecialties with their templates)
   */
  async getHierarchicalData(req, res) {
    try {
      const {
        includeEmpty = false,
        sortBy = 'name',
        sortOrder = 'asc',
        limit,
        skip = 0
      } = req.query;

      const subspecialties = await relationshipService.getHierarchicalData({
        includeEmpty: includeEmpty === 'true',
        sortBy,
        sortOrder,
        limit: limit ? parseInt(limit) : null,
        skip: parseInt(skip)
      });

      const { Op } = require('sequelize');
      const whereClause = includeEmpty === 'true' ? {} : { count: { [Op.gt]: 0 } };
      const total = await Subspecialty.count({ where: whereClause });

      res.json({
        success: true,
        data: subspecialties,
        pagination: {
          total,
          skip: parseInt(skip),
          limit: limit ? parseInt(limit) : null,
          hasMore: limit ? (parseInt(skip) + parseInt(limit)) < total : false
        }
      });
    } catch (error) {
      console.error('Error getting hierarchical data:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch hierarchical data',
        message: error.message
      });
    }
  }

  /**
   * Get statistics about subspecialties and templates
   */
  async getStatistics(req, res) {
    try {
      const { Op } = require('sequelize');
      const totalSubspecialties = await Subspecialty.count();
      const totalTemplates = await Template.count();
      const subspecialtiesWithTemplates = await Subspecialty.count({ where: { count: { [Op.gt]: 0 } } });
      
      // Get top subspecialties by template count
      const topSubspecialties = await Subspecialty.findAll({
        where: { count: { [Op.gt]: 0 } },
        order: [['count', 'DESC']],
        limit: 10,
        attributes: ['code', 'name', 'count']
      });

      // Get recent templates
      const recentTemplates = await Template.findAll({
        order: [['created', 'DESC']],
        limit: 10,
        attributes: ['template_id', 'title', 'created', 'specialty']
      });

      res.json({
        success: true,
        data: {
          totalSubspecialties,
          totalTemplates,
          subspecialtiesWithTemplates,
          emptySubspecialties: totalSubspecialties - subspecialtiesWithTemplates,
          topSubspecialties,
          recentTemplates
        }
      });
    } catch (error) {
      console.error('Error getting statistics:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
        message: error.message
      });
    }
  }
}

module.exports = new SubspecialtyController();
