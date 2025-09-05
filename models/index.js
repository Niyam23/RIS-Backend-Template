const Subspecialty = require('./Subspecialty');
const Template = require('./Template');
const SubspecialtyTemplate = require('./SubspecialtyTemplate');

// Define associations
Subspecialty.belongsToMany(Template, {
  through: SubspecialtyTemplate,
  foreignKey: 'subspecialtyId',
  otherKey: 'templateId',
  as: 'templates'
});

Template.belongsToMany(Subspecialty, {
  through: SubspecialtyTemplate,
  foreignKey: 'templateId',
  otherKey: 'subspecialtyId',
  as: 'subspecialties'
});

// Export models
module.exports = {
  Subspecialty,
  Template,
  SubspecialtyTemplate
};
