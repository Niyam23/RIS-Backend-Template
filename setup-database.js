#!/usr/bin/env node

/**
 * Database Setup Script
 * This script helps you set up the MySQL database for the RIS Backend
 */

const readline = require('readline');
const mysql = require('mysql2/promise');
const config = require('./config');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupDatabase() {
  console.log('🗄️  RIS Backend Database Setup\n');
  console.log('This script will help you set up the MySQL database.\n');

  try {
    // Get database credentials
    const host = await question('MySQL Host (default: localhost): ') || 'localhost';
    const port = await question('MySQL Port (default: 3306): ') || '3306';
    const username = await question('MySQL Username (default: root): ') || 'root';
    const password = await question('MySQL Password: ');
    const database = await question('Database Name (default: ris_database): ') || 'ris_database';

    console.log('\n📡 Connecting to MySQL...');

    // Connect to MySQL server (without specifying database)
    const connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user: username,
      password
    });

    console.log('✅ Connected to MySQL server successfully!');

    // Create database
    console.log(`\n📦 Creating database '${database}'...`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${database}' created successfully!`);

    // Ask if user wants to create a dedicated user
    const createUser = await question('\n🔐 Do you want to create a dedicated database user? (y/n): ');
    
    if (createUser.toLowerCase() === 'y' || createUser.toLowerCase() === 'yes') {
      const dbUsername = await question('Database Username (default: ris_user): ') || 'ris_user';
      const dbPassword = await question('Database Password: ');

      console.log(`\n👤 Creating user '${dbUsername}'...`);
      await connection.execute(`CREATE USER IF NOT EXISTS '${dbUsername}'@'localhost' IDENTIFIED BY '${dbPassword}'`);
      await connection.execute(`GRANT ALL PRIVILEGES ON \`${database}\`.* TO '${dbUsername}'@'localhost'`);
      await connection.execute('FLUSH PRIVILEGES');
      console.log(`✅ User '${dbUsername}' created successfully!`);

      // Update config suggestion
      console.log('\n📝 Update your config.js with these credentials:');
      console.log(`host: '${host}',`);
      console.log(`port: ${port},`);
      console.log(`username: '${dbUsername}',`);
      console.log(`password: '${dbPassword}',`);
      console.log(`database: '${database}'`);
    } else {
      console.log('\n📝 Update your config.js with these credentials:');
      console.log(`host: '${host}',`);
      console.log(`port: ${port},`);
      console.log(`username: '${username}',`);
      console.log(`password: '${password}',`);
      console.log(`database: '${database}'`);
    }

    await connection.end();
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your config.js with the database credentials');
    console.log('2. Run: npm start');
    console.log('3. The application will automatically create the required tables');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure MySQL server is running:');
      console.log('   - macOS: brew services start mysql');
      console.log('   - Ubuntu: sudo systemctl start mysql');
      console.log('   - Windows: Start MySQL service from Services.msc');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Check your MySQL username and password');
    }
  } finally {
    rl.close();
  }
}

// Run the setup
setupDatabase();
