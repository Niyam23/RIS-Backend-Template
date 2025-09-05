const rsnaApiService = require('./rsnaApiService');
const { Template } = require('../models');

class TemplateDataService {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds
    this.batchSize = 5; // Process 5 templates at a time
  }

  /**
   * Dynamically fetch and update template data for all templates
   */
  async updateAllTemplateData() {
    try {
      console.log('🔄 Starting dynamic template data update...');
      
      // Get all templates that don't have template data
      const templatesWithoutData = await Template.findAll({
        where: {
          templateData: null
        },
        order: [['views', 'DESC']] // Start with most viewed templates
      });

      console.log(`Found ${templatesWithoutData.length} templates without data`);

      if (templatesWithoutData.length === 0) {
        console.log('✅ All templates already have data');
        return { success: true, updated: 0, failed: 0 };
      }

      let updated = 0;
      let failed = 0;

      // Process templates in batches
      for (let i = 0; i < templatesWithoutData.length; i += this.batchSize) {
        const batch = templatesWithoutData.slice(i, i + this.batchSize);
        console.log(`\n📦 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(templatesWithoutData.length / this.batchSize)}`);
        
        const batchResults = await this.processBatch(batch);
        updated += batchResults.updated;
        failed += batchResults.failed;

        // Add delay between batches to avoid overwhelming the API
        if (i + this.batchSize < templatesWithoutData.length) {
          console.log('⏳ Waiting 3 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      console.log(`\n🎉 Dynamic update completed!`);
      console.log(`✅ Updated: ${updated} templates`);
      console.log(`❌ Failed: ${failed} templates`);

      return { success: true, updated, failed };

    } catch (error) {
      console.error('❌ Error in dynamic template data update:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process a batch of templates
   */
  async processBatch(templates) {
    let updated = 0;
    let failed = 0;

    // Process templates in parallel within the batch
    const promises = templates.map(template => this.updateSingleTemplate(template));
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        updated++;
        console.log(`✅ Updated template ${templates[index].template_id}: ${templates[index].title}`);
      } else {
        failed++;
        console.log(`❌ Failed template ${templates[index].template_id}: ${result.reason || 'Unknown error'}`);
      }
    });

    return { updated, failed };
  }

  /**
   * Update a single template with retry logic
   */
  async updateSingleTemplate(template) {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.retryAttempts} for template ${template.template_id}`);
        
        const details = await rsnaApiService.fetchTemplateDetails(
          template.template_id,
          template.template_version
        );

        // Update template with the fetched data
        await template.update({
          templateData: details.templateData || null,
          description: details.description || template.description,
          author: details.author || template.author,
          firstname: details.firstname || template.firstname,
          lastname: details.lastname || template.lastname,
          downloads: details.downloads || template.downloads
        });

        return { success: true, template_id: template.template_id };

      } catch (error) {
        console.log(`⚠️  Attempt ${attempt} failed for template ${template.template_id}: ${error.message}`);
        
        if (attempt === this.retryAttempts) {
          // Last attempt failed, try to get basic data from RSNA API
          return await this.fallbackUpdate(template);
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
  }

  /**
   * Fallback method to get basic template data when detailed fetch fails
   */
  async fallbackUpdate(template) {
    try {
      console.log(`🔄 Fallback: Trying to get basic data for template ${template.template_id}`);
      
      // Try to get basic template info from the main templates endpoint
      const templates = await rsnaApiService.fetchTemplates();
      const basicTemplate = templates.find(t => t.template_id === template.template_id);
      
      if (basicTemplate) {
        // Update with any additional info we can get
        await template.update({
          description: basicTemplate.description || template.description,
          author: basicTemplate.author || template.author,
          firstname: basicTemplate.firstname || template.firstname,
          lastname: basicTemplate.lastname || template.lastname
        });
        
        console.log(`✅ Fallback update successful for template ${template.template_id}`);
        return { success: true, template_id: template.template_id, fallback: true };
      }
      
      throw new Error('Template not found in basic templates list');
      
    } catch (error) {
      console.log(`❌ Fallback failed for template ${template.template_id}: ${error.message}`);
      return { success: false, template_id: template.template_id, error: error.message };
    }
  }

  /**
   * Update template data for a specific template ID
   */
  async updateSpecificTemplate(templateId) {
    try {
      const template = await Template.findOne({
        where: { template_id: templateId }
      });

      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      console.log(`🔄 Updating specific template: ${templateId}`);
      const result = await this.updateSingleTemplate(template);
      
      if (result.success) {
        console.log(`✅ Successfully updated template ${templateId}`);
      } else {
        console.log(`❌ Failed to update template ${templateId}`);
      }

      return result;

    } catch (error) {
      console.error(`❌ Error updating template ${templateId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get statistics about template data
   */
  async getTemplateDataStats() {
    try {
      const totalTemplates = await Template.count();
      const templatesWithData = await Template.count({
        where: {
          templateData: {
            [require('sequelize').Op.ne]: null
          }
        }
      });
      const templatesWithoutData = totalTemplates - templatesWithData;

      return {
        total: totalTemplates,
        withData: templatesWithData,
        withoutData: templatesWithoutData,
        percentage: totalTemplates > 0 ? Math.round((templatesWithData / totalTemplates) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting template data stats:', error.message);
      throw error;
    }
  }
}

module.exports = new TemplateDataService();
