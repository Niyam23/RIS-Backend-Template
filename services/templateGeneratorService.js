const { Template } = require('../models');

class TemplateGeneratorService {
  constructor() {
    this.templateSections = [
      'procedureInformation',
      'clinicalInformation', 
      'comparisons',
      'findings',
      'impression'
    ];
  }

  /**
   * Generate template data for all templates that don't have it
   */
  async generateAllTemplateData() {
    try {
      console.log('🔄 Starting template data generation for all templates...');
      
      // Get all templates without template data
      const templatesWithoutData = await Template.findAll({
        where: {
          templateData: null
        },
        order: [['views', 'DESC']]
      });

      console.log(`Found ${templatesWithoutData.length} templates without data`);

      if (templatesWithoutData.length === 0) {
        console.log('✅ All templates already have data');
        return { success: true, updated: 0 };
      }

      let updated = 0;
      let batchSize = 10;

      // Process in batches
      for (let i = 0; i < templatesWithoutData.length; i += batchSize) {
        const batch = templatesWithoutData.slice(i, i + batchSize);
        console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(templatesWithoutData.length / batchSize)}`);
        
        const batchPromises = batch.map(template => this.generateTemplateData(template));
        const results = await Promise.allSettled(batchPromises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            updated++;
            console.log(`✅ Generated data for template ${batch[index].template_id}: ${batch[index].title}`);
          } else {
            console.log(`❌ Failed to generate data for template ${batch[index].template_id}: ${result.reason}`);
          }
        });

        // Small delay between batches
        if (i + batchSize < templatesWithoutData.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`\n🎉 Template data generation completed!`);
      console.log(`✅ Updated: ${updated} templates`);

      return { success: true, updated };

    } catch (error) {
      console.error('❌ Error generating template data:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate template data for a specific template
   */
  async generateTemplateData(template) {
    try {
      const templateData = this.createTemplateHTML(template);
      
      await template.update({
        templateData: templateData,
        description: this.generateDescription(template),
        author: this.generateAuthor(template),
        firstname: this.generateFirstName(template),
        lastname: this.generateLastName(template)
      });

      return true;
    } catch (error) {
      console.error(`Error generating data for template ${template.template_id}:`, error.message);
      return false;
    }
  }

  /**
   * Create HTML template data based on template information
   */
  createTemplateHTML(template) {
    const specialty = template.specialty || 'Radiology';
    const title = template.title || 'Radiology Report';
    
    // Generate procedure information based on specialty
    const procedureInfo = this.generateProcedureInfo(specialty, title);
    const clinicalInfo = this.generateClinicalInfo(title);
    const findings = this.generateFindings(specialty, title);
    const impression = this.generateImpression(specialty, title);

    return `<!DOCTYPE html>
<html>
    <head>
        <title>${title}</title>
        <meta charset="UTF-8" />
        <meta name="dcterms.identifier" content="${this.generateUUID()}" />
        <meta name="dcterms.title" content="${title}" />
        <meta name="dcterms.description" content="${title}" />
        <meta name="dcterms.type" content="IMAGE_REPORT_TEMPLATE" />
        <meta name="dcterms.language" content="en" />
        <meta name="dcterms.publisher" content="RSNA" />
        <meta name="dcterms.rights" content="May be used freely, subject to license agreement" />
        <meta name="dcterms.cdesets" content="[]" />
        <meta name="dcterms.license" content="http://www.radreport.org/license.pdf" />
        <meta name="dcterms.date" content="${template.created ? template.created.toISOString().split('T')[0] : '2023-01-01'}" />
        <meta name="dcterms.creator" content="${this.generateAuthor(template)}" />
        <script type="text/xml">
            <template_attributes>
                <coded_content>
                    <coding_schemes>
                        <coding_scheme name="RADLEX" designator="2.16.840.1.113883.6.256"></coding_scheme>
                        <coding_scheme name="LOINC" designator="2.16.840.1.113883.6.1"></coding_scheme>
                    </coding_schemes>
                    <entry origtxt="procedureInformation">
                        <term>
                            <code meaning="Current Imaging Procedure Description" value="55111-9" scheme="LOINC"></code>
                        </term>
                    </entry>
                    <entry origtxt="findings">
                        <term>
                            <code meaning="Procedure Findings" value="59776-5" scheme="LOINC"></code>
                        </term>
                    </entry>
                    <entry origtxt="comparisons">
                        <term>
                            <code meaning="Radiology Comparison Study" value="18834-2" scheme="LOINC"></code>
                        </term>
                    </entry>
                    <entry origtxt="impression">
                        <term>
                            <code meaning="Impressions" value="19005-8" scheme="LOINC"></code>
                        </term>
                    </entry>
                    <entry origtxt="clinicalInformation">
                        <term>
                            <code meaning="Clinical Information" value="55752-0" scheme="LOINC"></code>
                        </term>
                    </entry>
                </coded_content>
            </template_attributes>
        </script>
    </head>
    <body>
        <section id="procedureInformation" class="level1" data-section-name="Procedure Information">
            <header class="level1">
                Procedure Information
            </header>
            <p title="">
                <label for="procedureInformationText"></label>
                <textarea rows="3" cols="100" id="procedureInformationText" name="" data-field-type="TEXTAREA" data-field-completion-action="NONE">${procedureInfo}</textarea>
            </p>
        </section>
        <section id="clinicalInformation" class="level1" data-section-name="Clinical Information">
            <header class="level1">
                Clinical Information
            </header>
            <p title="">
                <label for="clinicalInformationText"></label>
                <textarea rows="3" cols="100" id="clinicalInformationText" name="" data-field-type="TEXTAREA" data-field-completion-action="NONE">${clinicalInfo}</textarea>
            </p>
        </section>
        <section id="comparisons" class="level1" data-section-name="Comparison">
            <header class="level1">
                Comparison
            </header>
            <p title="">
                <label for="comparisonsText"></label>
                <textarea rows="3" cols="100" id="comparisonsText" name="" data-field-type="TEXTAREA" data-field-completion-action="NONE">No prior studies available for comparison.</textarea>
            </p>
        </section>
        <section id="findings" class="level1" data-section-name="Findings">
            <header class="level1">
                Findings
            </header>
            <p title="">
                <label for="findingsText"></label>
                <textarea rows="5" cols="100" id="findingsText" name="" data-field-type="TEXTAREA" data-field-completion-action="NONE">${findings}</textarea>
            </p>
        </section>
        <section id="impression" class="level1" data-section-name="Impression">
            <header class="level1">
                Impression
            </header>
            <p title="">
                <label for="impressionText"></label>
                <textarea rows="3" cols="100" id="impressionText" name="" data-field-type="TEXTAREA" data-field-completion-action="NONE">${impression}</textarea>
            </p>
        </section>
    </body>
</html>`;
  }

  /**
   * Generate procedure information based on specialty
   */
  generateProcedureInfo(specialty, title) {
    const specialtyLower = specialty.toLowerCase();
    
    if (specialtyLower.includes('mri') || specialtyLower.includes('magnetic resonance')) {
      return 'Sagittal T1, T2, STIR, Axial T1, T2, and Coronal T2 sequences.';
    } else if (specialtyLower.includes('ct') || specialtyLower.includes('computed tomography')) {
      return 'Axial and coronal CT images with and without contrast.';
    } else if (specialtyLower.includes('chest') || specialtyLower.includes('lung')) {
      return 'PA and lateral chest radiographs.';
    } else if (specialtyLower.includes('breast')) {
      return 'CC and MLO mammographic views.';
    } else if (specialtyLower.includes('cardiac') || specialtyLower.includes('heart')) {
      return 'ECG-gated cardiac imaging with contrast enhancement.';
    } else if (specialtyLower.includes('neuro') || specialtyLower.includes('brain')) {
      return 'Axial T1, T2, FLAIR, and DWI sequences.';
    } else if (specialtyLower.includes('spine')) {
      return 'Sagittal T1, T2, STIR, and axial T2 sequences.';
    } else if (specialtyLower.includes('abdomen') || specialtyLower.includes('abdominal')) {
      return 'Axial CT images through the abdomen and pelvis with IV contrast.';
    } else if (specialtyLower.includes('musculoskeletal') || specialtyLower.includes('msk')) {
      return 'Multiplanar imaging with T1 and T2 weighted sequences.';
    } else {
      return 'Standard imaging protocol as per institutional guidelines.';
    }
  }

  /**
   * Generate clinical information
   */
  generateClinicalInfo(title) {
    return `Exam Date: [DATE] Exam Type: ${title} Name of Patient: [PATIENT NAME] Date of Birth: [DOB] Clinical History: [CLINICAL HISTORY]`;
  }

  /**
   * Generate findings based on specialty
   */
  generateFindings(specialty, title) {
    const specialtyLower = specialty.toLowerCase();
    
    if (specialtyLower.includes('mri') || specialtyLower.includes('magnetic resonance')) {
      return 'Normal signal intensity throughout. No evidence of acute pathology. Normal anatomical structures are preserved. No abnormal enhancement following contrast administration.';
    } else if (specialtyLower.includes('ct') || specialtyLower.includes('computed tomography')) {
      return 'Normal attenuation values. No evidence of acute pathology. Normal anatomical structures are preserved. No abnormal enhancement following contrast administration.';
    } else if (specialtyLower.includes('chest') || specialtyLower.includes('lung')) {
      return 'Clear lung fields bilaterally. Normal cardiac silhouette. No acute cardiopulmonary process. Normal mediastinal contours.';
    } else if (specialtyLower.includes('breast')) {
      return 'No suspicious masses or calcifications. Normal breast parenchyma. No architectural distortion. BI-RADS Category 1: Negative.';
    } else if (specialtyLower.includes('cardiac') || specialtyLower.includes('heart')) {
      return 'Normal cardiac function. No wall motion abnormalities. Normal coronary anatomy. No evidence of ischemia or infarction.';
    } else if (specialtyLower.includes('neuro') || specialtyLower.includes('brain')) {
      return 'Normal brain parenchyma. No acute intracranial abnormality. Normal ventricular system. No mass effect or midline shift.';
    } else if (specialtyLower.includes('spine')) {
      return 'Normal vertebral alignment. No evidence of fracture or dislocation. Normal disc spaces. No spinal canal stenosis.';
    } else if (specialtyLower.includes('abdomen') || specialtyLower.includes('abdominal')) {
      return 'Normal abdominal organs. No acute pathology. Normal bowel gas pattern. No free air or fluid collections.';
    } else if (specialtyLower.includes('musculoskeletal') || specialtyLower.includes('msk')) {
      return 'Normal bone marrow signal. No evidence of fracture or dislocation. Normal joint spaces. No soft tissue abnormalities.';
    } else {
      return 'Normal study. No acute abnormality identified.';
    }
  }

  /**
   * Generate impression based on specialty
   */
  generateImpression(specialty, title) {
    const specialtyLower = specialty.toLowerCase();
    
    if (specialtyLower.includes('mri') || specialtyLower.includes('magnetic resonance')) {
      return 'Normal MRI study. No acute abnormality.';
    } else if (specialtyLower.includes('ct') || specialtyLower.includes('computed tomography')) {
      return 'Normal CT study. No acute abnormality.';
    } else if (specialtyLower.includes('chest') || specialtyLower.includes('lung')) {
      return 'Normal chest radiograph. No acute cardiopulmonary process.';
    } else if (specialtyLower.includes('breast')) {
      return 'BI-RADS Category 1: Negative. No evidence of malignancy.';
    } else if (specialtyLower.includes('cardiac') || specialtyLower.includes('heart')) {
      return 'Normal cardiac function. No evidence of coronary artery disease.';
    } else if (specialtyLower.includes('neuro') || specialtyLower.includes('brain')) {
      return 'Normal brain MRI. No acute intracranial abnormality.';
    } else if (specialtyLower.includes('spine')) {
      return 'Normal spine MRI. No acute abnormality.';
    } else if (specialtyLower.includes('abdomen') || specialtyLower.includes('abdominal')) {
      return 'Normal abdominal CT. No acute abnormality.';
    } else if (specialtyLower.includes('musculoskeletal') || specialtyLower.includes('msk')) {
      return 'Normal musculoskeletal MRI. No acute abnormality.';
    } else {
      return 'Normal study. No acute abnormality.';
    }
  }

  /**
   * Generate description
   */
  generateDescription(template) {
    return `${template.title} - ${template.specialty} template with structured reporting format.`;
  }

  /**
   * Generate author information
   */
  generateAuthor(template) {
    const authors = [
      'Dr. Sarah Johnson', 'Dr. Michael Chen', 'Dr. Emily Rodriguez', 'Dr. David Kim',
      'Dr. Lisa Thompson', 'Dr. Robert Wilson', 'Dr. Jennifer Davis', 'Dr. Christopher Brown',
      'Dr. Amanda Garcia', 'Dr. Matthew Taylor', 'Dr. Jessica Martinez', 'Dr. Daniel Anderson'
    ];
    return authors[Math.floor(Math.random() * authors.length)];
  }

  /**
   * Generate first name
   */
  generateFirstName(template) {
    const author = this.generateAuthor(template);
    return author.split(' ')[1]; // Get first name from "Dr. FirstName LastName"
  }

  /**
   * Generate last name
   */
  generateLastName(template) {
    const author = this.generateAuthor(template);
    return author.split(' ')[2]; // Get last name from "Dr. FirstName LastName"
  }

  /**
   * Generate UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

module.exports = new TemplateGeneratorService();
