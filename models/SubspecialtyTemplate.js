const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const SubspecialtyTemplate = sequelize.define('SubspecialtyTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  subspecialtyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subspecialties',
      key: 'id'
    }
  },
  templateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'templates',
      key: 'id'
    }
  }
}, {
  tableName: 'subspecialty_templates',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['subspecialty_id', 'template_id']
    },
    {
      fields: ['subspecialty_id']
    },
    {
      fields: ['template_id']
    }
  ]
});

module.exports = SubspecialtyTemplate;
