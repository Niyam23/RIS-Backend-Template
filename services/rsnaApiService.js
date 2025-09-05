const axios = require('axios');
const config = require('../config');

class RSNAApiService {
  constructor() {
    this.baseURL = config.rsnaApiBaseUrl;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000, // Reduced timeout
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RIS-Backend/1.0.0',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for better error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 500) {
          // Handle 500 errors specifically
          error.message = `RSNA API server error (500): ${error.response.data?.message || 'Internal server error'}`;
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch all subspecialties from RSNA API
   * @returns {Promise<Array>} Array of subspecialty objects
   */
  async fetchSubspecialties() {
    try {
      console.log('Fetching subspecialties from RSNA API...');
      const response = await this.client.get('/subspecialty/');
      
      if (!response.data.SUCCESS) {
        throw new Error('Failed to fetch subspecialties from RSNA API');
      }

      return response.data.DATA;
    } catch (error) {
      console.error('Error fetching subspecialties:', error.message);
      throw new Error(`Failed to fetch subspecialties: ${error.message}`);
    }
  }

  /**
   * Fetch all templates from RSNA API
   * @returns {Promise<Array>} Array of template objects
   */
  async fetchTemplates() {
    try {
      console.log('Fetching templates from RSNA API...');
      const response = await this.client.get('/templates');
      
      if (!response.data.SUCCESS) {
        throw new Error('Failed to fetch templates from RSNA API');
      }

      return response.data.DATA;
    } catch (error) {
      console.error('Error fetching templates:', error.message);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }
  }

  /**
   * Fetch detailed template information by ID and version
   * @param {string} templateId - Template ID
   * @param {string} version - Template version
   * @returns {Promise<Object>} Detailed template object
   */
  async fetchTemplateDetails(templateId, version) {
    try {
      console.log(`Fetching template details for ID: ${templateId}, Version: ${version}`);
      const response = await this.client.get(`/templates/${templateId}/details`, {
        params: { version },
        timeout: 10000, // 10 second timeout
        validateStatus: function (status) {
          // Accept 200-299 and 404 (not found) as valid responses
          return status >= 200 && status < 300 || status === 404;
        }
      });
      
      if (response.status === 404) {
        throw new Error(`Template details not found for ID: ${templateId}`);
      }
      
      if (!response.data.SUCCESS) {
        throw new Error(`Failed to fetch template details for ID: ${templateId}`);
      }

      return response.data.DATA;
    } catch (error) {
      if (error.response && error.response.status === 500) {
        throw new Error(`Server error (500) for template ${templateId}`);
      } else if (error.response && error.response.status === 404) {
        throw new Error(`Template details not found for ID: ${templateId}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error(`Timeout fetching details for template ${templateId}`);
      } else {
        throw new Error(`Failed to fetch template details: ${error.message}`);
      }
    }
  }

  /**
   * Fetch templates with detailed information
   * @returns {Promise<Array>} Array of templates with detailed information
   */
  async fetchTemplatesWithDetails() {
    try {
      const templates = await this.fetchTemplates();
      const templatesWithDetails = [];

      console.log(`Processing ${templates.length} templates...`);

      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        try {
          console.log(`Fetching details for template ${i + 1}/${templates.length}: ${template.template_id}`);
          
          const details = await this.fetchTemplateDetails(
            template.template_id, 
            template.template_version
          );
          
          // Merge basic template info with detailed info
          const enrichedTemplate = {
            ...template,
            ...details,
            // Ensure we keep the original template_id format
            template_id: template.template_id
          };

          templatesWithDetails.push(enrichedTemplate);
          
          // Add longer delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.warn(`Failed to fetch details for template ${template.template_id}:`, error.message);
          // Still include the basic template info
          templatesWithDetails.push(template);
          
          // Add delay even on error to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      return templatesWithDetails;
    } catch (error) {
      console.error('Error fetching templates with details:', error.message);
      throw error;
    }
  }
}

module.exports = new RSNAApiService();
