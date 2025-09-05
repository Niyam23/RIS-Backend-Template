# RIS Backend - RSNA Radiology Templates API

A Node.js backend service that manages the parent-child relationship between radiology subspecialties and report templates from the RSNA API using MySQL database.

## Features

- **Parent-Child Relationship Management**: Automatically creates and maintains relationships between subspecialties (parents) and templates (children)
- **RSNA API Integration**: Fetches data from the official RSNA radiology templates API
- **Hierarchical Data Structure**: Provides organized access to subspecialties with their associated templates
- **Comprehensive Search**: Search templates by multiple criteria including title, specialty, author, etc.
- **Statistics & Analytics**: Get insights about subspecialties and templates usage
- **Data Synchronization**: Sync data from RSNA API with detailed template information
- **RESTful API**: Clean and well-documented API endpoints

## Project Structure

```
RIS/
├── controllers/          # Request handlers
│   ├── subspecialtyController.js
│   ├── templateController.js
│   └── syncController.js
├── middleware/           # Custom middleware
│   ├── errorHandler.js
│   └── validation.js
├── models/              # Sequelize models for MySQL
│   ├── Subspecialty.js
│   ├── Template.js
│   ├── SubspecialtyTemplate.js
│   └── index.js
├── database/            # Database connection
│   └── connection.js
├── routes/              # API routes
│   ├── subspecialtyRoutes.js
│   ├── templateRoutes.js
│   └── syncRoutes.js
├── services/            # Business logic
│   ├── rsnaApiService.js
│   └── relationshipService.js
├── config.js            # Configuration
├── package.json         # Dependencies
├── server.js           # Main server file
└── README.md           # This file
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RIS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MySQL Database**
   - Install MySQL locally
   - Create database and user (see `MYSQL_SETUP.md` for detailed instructions)
   - Update database credentials in `config.js` if needed

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Subspecialties

- `GET /api/subspecialties` - Get all subspecialties
- `GET /api/subspecialties/statistics` - Get subspecialty statistics
- `GET /api/subspecialties/hierarchical` - Get hierarchical data (subspecialties with templates)
- `GET /api/subspecialties/:code` - Get subspecialty by code
- `GET /api/subspecialties/:code/templates` - Get templates for a specific subspecialty

### Templates

- `GET /api/templates` - Get all templates
- `GET /api/templates/search` - Search templates
- `GET /api/templates/statistics` - Get template statistics
- `GET /api/templates/:id` - Get template by ID
- `GET /api/templates/:id/subspecialties` - Get subspecialties for a specific template

### Data Synchronization

- `GET /api/sync/status` - Get sync status
- `POST /api/sync/all` - Sync all data from RSNA API
- `POST /api/sync/detailed` - Sync data with detailed template information
- `POST /api/sync/subspecialties` - Sync only subspecialties
- `POST /api/sync/templates` - Sync only templates

## Parent-Child Relationship Logic

The system creates parent-child relationships based on the following logic:

### 1. **Code Matching**
- **Parent**: Subspecialty `code` field (e.g., "NR", "CA", "CT")
- **Child**: Template `specCode` field (e.g., "NR", "CA,CT")
- **Relationship**: Template belongs to subspecialty if its specCode contains the subspecialty code

### 2. **Multiple Code Handling**
- Templates can belong to multiple subspecialties
- Example: Template with specCode "CA,CT" belongs to both Cardiac Radiology and Computed Tomography

### 3. **Name-Based Matching (Fallback)**
- Uses subspecialty `name` and template `specialty` fields for additional validation

## Usage Examples

### 1. Initial Data Sync
```bash
# Sync all data from RSNA API
curl -X POST http://localhost:3000/api/sync/all
```

### 2. Get Hierarchical Data
```bash
# Get all subspecialties with their templates
curl http://localhost:3000/api/subspecialties/hierarchical
```

### 3. Search Templates
```bash
# Search templates by title
curl "http://localhost:3000/api/templates/search?q=MRI"

# Search by specialty
curl "http://localhost:3000/api/templates/search?specialty=Neuroradiology"
```

### 4. Get Templates for a Subspecialty
```bash
# Get all templates for Neuroradiology
curl http://localhost:3000/api/subspecialties/NR/templates
```

## Configuration

Update `config.js` to modify:

- **Port**: Server port (default: 3000)
- **Database**: MySQL connection settings (host, port, username, password, database name)
- **RSNA API Base URL**: RSNA API endpoint
- **Environment**: Development/Production settings

## Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: Invalid parameters, malformed data
- **Not Found Errors**: Missing resources
- **Rate Limiting**: Protection against abuse
- **Database Errors**: MySQL connection and query issues
- **External API Errors**: RSNA API failures

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Request throttling
- **Input Validation**: Parameter validation middleware
- **Error Sanitization**: Safe error messages

## Development

### Running in Development Mode
```bash
npm run dev
```

### Testing
```bash
npm test
```

### Environment Variables
Create a `.env` file (optional):
```
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_NAME=ris_database
RSNA_API_BASE_URL=https://api3.rsna.org/radreport/v1
```

## API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 100,
    "skip": 0,
    "limit": 20,
    "hasMore": true
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
