const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Template = sequelize.define('Template', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  template_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  template_version: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  lang: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'English'
  },
  created: {
    type: DataTypes.DATE,
    allowNull: false
  },
  specialty: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  specCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  TLAP_Approved: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  views: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  author: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: ''
  },
  firstname: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: ''
  },
  lastname: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: ''
  },
  downloads: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  dataType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'html'
  },
  templateData: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  }
}, {
  tableName: 'templates',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['template_id']
    },
    {
      fields: ['spec_code']
    },
    {
      fields: ['title']
    },
    {
      fields: ['specialty']
    }
  ]
});

module.exports = Template;
