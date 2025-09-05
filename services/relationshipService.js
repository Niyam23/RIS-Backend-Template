const { Subspecialty, Template, SubspecialtyTemplate } = require('../models');

class RelationshipService {
  /**
   * Parse specCode string and return array of individual codes
   * @param {string} specCode - Comma-separated spec codes (e.g., "CA,CT")
   * @returns {Array<string>} Array of individual spec codes
   */
  parseSpecCode(specCode) {
    if (!specCode) return [];
    return specCode.split(',').map(code => code.trim()).filter(code => code.length > 0);
  }

  /**
   * Create parent-child relationships between subspecialties and templates
   * @param {Array} subspecialties - Array of subspecialty objects
   * @param {Array} templates - Array of template objects
   * @returns {Promise<Object>} Result object with success status and statistics
   */
  async createRelationships(subspecialties, templates) {
    try {
      console.log('Creating parent-child relationships...');
      
      const stats = {
        subspecialtiesProcessed: 0,
        templatesProcessed: 0,
        relationshipsCreated: 0,
        errors: []
      };

      // Clear existing relationships
      await this.clearExistingRelationships();

      // Create subspecialties first
      const subspecialtyMap = new Map();
      for (const subspecialtyData of subspecialties) {
        try {
          const [subspecialty, created] = await Subspecialty.findOrCreate({
            where: { code: subspecialtyData.code },
            defaults: {
              code: subspecialtyData.code,
              shortName: subspecialtyData.shortName,
              name: subspecialtyData.name,
              radlexID: subspecialtyData.radlexID,
              count: parseInt(subspecialtyData.count) || 0
            }
          });

          // Update if not created
          if (!created) {
            await subspecialty.update({
              shortName: subspecialtyData.shortName,
              name: subspecialtyData.name,
              radlexID: subspecialtyData.radlexID,
              count: parseInt(subspecialtyData.count) || 0
            });
          }

          subspecialtyMap.set(subspecialtyData.code, subspecialty);
          stats.subspecialtiesProcessed++;
        } catch (error) {
          console.error(`Error creating subspecialty ${subspecialtyData.code}:`, error.message);
          stats.errors.push(`Subspecialty ${subspecialtyData.code}: ${error.message}`);
        }
      }

      // Create templates and establish relationships
      for (const templateData of templates) {
        try {
          // Parse specCode to get individual codes
          const specCodes = this.parseSpecCode(templateData.specCode);
          
          // Find related subspecialties
          const relatedSubspecialties = [];
          for (const code of specCodes) {
            const subspecialty = subspecialtyMap.get(code);
            if (subspecialty) {
              relatedSubspecialties.push(subspecialty);
            }
          }

          // Create or update template
          const [template, created] = await Template.findOrCreate({
            where: { template_id: templateData.template_id },
            defaults: {
              template_id: templateData.template_id,
              template_version: templateData.template_version,
              title: templateData.title,
              lang: templateData.lang,
              created: new Date(templateData.created),
              specialty: templateData.specialty,
              specCode: templateData.specCode,
              TLAP_Approved: templateData.TLAP_Approved,
              views: parseInt(templateData.views) || 0,
              description: templateData.description || null,
              author: templateData.author || '',
              firstname: templateData.firstname || '',
              lastname: templateData.lastname || '',
              downloads: parseInt(templateData.downloads) || 0,
              dataType: templateData.dataType || 'html',
              templateData: templateData.templateData || null
            }
          });

          // Update if not created
          if (!created) {
            await template.update({
              template_version: templateData.template_version,
              title: templateData.title,
              lang: templateData.lang,
              created: new Date(templateData.created),
              specialty: templateData.specialty,
              specCode: templateData.specCode,
              TLAP_Approved: templateData.TLAP_Approved,
              views: parseInt(templateData.views) || 0,
              description: templateData.description || null,
              author: templateData.author || '',
              firstname: templateData.firstname || '',
              lastname: templateData.lastname || '',
              downloads: parseInt(templateData.downloads) || 0,
              dataType: templateData.dataType || 'html',
              templateData: templateData.templateData || null
            });
          }

          // Create relationships in junction table
          for (const subspecialty of relatedSubspecialties) {
            await SubspecialtyTemplate.findOrCreate({
              where: {
                subspecialtyId: subspecialty.id,
                templateId: template.id
              }
            });
            stats.relationshipsCreated++;
          }

          stats.templatesProcessed++;
        } catch (error) {
          console.error(`Error creating template ${templateData.template_id}:`, error.message);
          stats.errors.push(`Template ${templateData.template_id}: ${error.message}`);
        }
      }

      // Update subspecialty counts based on actual relationships
      await this.updateSubspecialtyCounts();

      console.log('Relationship creation completed:', stats);
      return {
        success: true,
        stats
      };

    } catch (error) {
      console.error('Error creating relationships:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear existing relationships between subspecialties and templates
   */
  async clearExistingRelationships() {
    try {
      console.log('Clearing existing relationships...');
      
      // Clear junction table
      await SubspecialtyTemplate.destroy({ where: {} });
      
      console.log('Existing relationships cleared');
    } catch (error) {
      console.error('Error clearing relationships:', error.message);
      throw error;
    }
  }

  /**
   * Update subspecialty counts based on actual template relationships
   */
  async updateSubspecialtyCounts() {
    try {
      console.log('Updating subspecialty counts...');
      
      const subspecialties = await Subspecialty.findAll();
      
      for (const subspecialty of subspecialties) {
        const actualCount = await SubspecialtyTemplate.count({
          where: { subspecialtyId: subspecialty.id }
        });
        
        await subspecialty.update({ count: actualCount });
      }
      
      console.log('Subspecialty counts updated');
    } catch (error) {
      console.error('Error updating counts:', error.message);
      throw error;
    }
  }

  /**
   * Get hierarchical data (subspecialties with their templates)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of subspecialties with populated templates
   */
  async getHierarchicalData(options = {}) {
    try {
      const {
        includeEmpty = false,
        sortBy = 'name',
        sortOrder = 'asc',
        limit,
        skip = 0
      } = options;

      let whereClause = {};
      if (!includeEmpty) {
        whereClause.count = { [require('sequelize').Op.gt]: 0 };
      }

      const orderClause = [[sortBy, sortOrder.toUpperCase()]];

      const queryOptions = {
        where: whereClause,
        include: [{
          model: Template,
          as: 'templates',
          attributes: ['template_id', 'title', 'created', 'views', 'downloads', 'specialty', 'specCode'],
          through: { attributes: [] },
          order: [['created', 'DESC']]
        }],
        order: orderClause,
        offset: skip
      };

      if (limit) {
        queryOptions.limit = limit;
      }

      const subspecialties = await Subspecialty.findAll(queryOptions);

      return subspecialties;
    } catch (error) {
      console.error('Error getting hierarchical data:', error.message);
      throw error;
    }
  }

  /**
   * Get templates by subspecialty code
   * @param {string} subspecialtyCode - Subspecialty code
   * @returns {Promise<Array>} Array of templates for the subspecialty
   */
  async getTemplatesBySubspecialty(subspecialtyCode) {
    try {
      const subspecialty = await Subspecialty.findOne({
        where: { code: subspecialtyCode },
        include: [{
          model: Template,
          as: 'templates',
          attributes: ['template_id', 'title', 'created', 'views', 'downloads', 'specialty', 'specCode', 'description', 'author'],
          through: { attributes: [] }
        }]
      });

      if (!subspecialty) {
        throw new Error(`Subspecialty with code ${subspecialtyCode} not found`);
      }

      return subspecialty.templates;
    } catch (error) {
      console.error(`Error getting templates for subspecialty ${subspecialtyCode}:`, error.message);
      throw error;
    }
  }

  /**
   * Get subspecialties for a specific template
   * @param {string} templateId - Template ID
   * @returns {Promise<Array>} Array of subspecialties for the template
   */
  async getSubspecialtiesByTemplate(templateId) {
    try {
      const template = await Template.findOne({
        where: { template_id: templateId },
        include: [{
          model: Subspecialty,
          as: 'subspecialties',
          attributes: ['code', 'shortName', 'name', 'count'],
          through: { attributes: [] }
        }]
      });

      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }

      return template.subspecialties;
    } catch (error) {
      console.error(`Error getting subspecialties for template ${templateId}:`, error.message);
      throw error;
    }
  }
}

module.exports = new RelationshipService();
