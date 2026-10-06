# Lars Medical Centre - Clinic Management System

A comprehensive web-based clinic management system for registering clients, managing medical records, and searching patient information with automatic unique ID generation.

## Features

✅ **Client Registration**
- Register new clients with comprehensive medical information
- Automatic unique ID generation (format: LMC-XXXXXX)
- Capture personal, medical, and clinical details
- Support for procedure information and test results

✅ **Client Search**
- Search clients by unique ID (LMC-XXXXXX)
- Search clients by name
- View detailed client information
- Copy client ID to clipboard

✅ **Medical Records**
- Store comprehensive medical information
- Track procedure details and clinical findings
- Record medication and treatment recommendations
- Maintain doctor's comments and impressions

✅ **Database Management**
- PostgreSQL database for reliable data storage
- Automatic timestamps for all records
- Indexed searches for fast retrieval
- Data validation and error handling

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Notifications**: Sonner (Toast notifications)
- **Icons**: Lucide React

## Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   cd /home/code/clinic-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example file
   cp .env.example .env.local
   
   # Edit .env.local and add your database credentials
   # DATABASE_URL="postgresql://username:password@localhost:5432/clinic_management"
   ```

4. **Create the database**
   ```bash
   createdb -h localhost -U your_username clinic_management
   ```

5. **Run Prisma migrations**
   ```bash
   npx prisma migrate dev
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open in browser**
   Navigate to `http://localhost:3000`

## Usage

### Registering a New Client

1. Click on the **"Register Client"** tab
2. Fill in the required fields:
   - **Name** (required)
   - **Sex** (required) - Male, Female, or Other
   - **Age** (required)
3. Fill in optional medical information:
   - Address
   - Referring Doctor
   - Procedure Type
   - Clinical findings and test results
   - Medication and treatment recommendations
4. Click **"Register Client"**
5. A unique client ID (LMC-XXXXXX) will be automatically generated and displayed

### Searching for Clients

1. Click on the **"Search Clients"** tab
2. Enter a search query:
   - Client ID (e.g., LMC-ABC123)
   - Client name (partial or full)
3. Click **"Search"**
4. Click on a result to view full client details
5. Use **"Copy Client ID"** to copy the ID to clipboard

**Note:** every endpoint below now requires a valid Supabase session — pass it as `-H "Authorization: Bearer $TOKEN"`, where `$TOKEN` is that session's access token. Endpoints noted as admin-only below additionally require a `super_admin`-role account.

## API Endpoints

### GET /api/clients
Retrieve all clients or search by ID/name
- **Query Parameters**:
  - `search`: Search term (optional)
  - `limit`: Results per page (default: 50)
  - `offset`: Results to skip (default: 0)

**Example**:
```bash
curl "http://localhost:3000/api/clients?search=LMC-ABC123" \
  -H "Authorization: Bearer $TOKEN"
```

### POST /api/clients
Register a new client
- **Request Body**: Client information (JSON)
- **Returns**: Created client with generated ID

**Example**:
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "John Doe",
    "sex": "MALE",
    "age": 45,
    "address": "123 Main St",
    "procedure": "Upper Endoscopy"
  }'
```

### GET /api/clients/[clientId]
Retrieve a specific client by ID
- **Parameters**: `clientId` (e.g., LMC-ABC123)

**Example**:
```bash
curl "http://localhost:3000/api/clients/LMC-ABC123" \
  -H "Authorization: Bearer $TOKEN"
```

### PUT /api/clients/[clientId]
Update a client's information
- **Parameters**: `clientId`
- **Request Body**: Fields to update (JSON)

**Example**:
```bash
curl -X PUT http://localhost:3000/api/clients/LMC-ABC123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"medication": "Updated medication info"}'
```

### DELETE /api/clients/[clientId]
Delete a client record
- **Parameters**: `clientId`

**Example**:
```bash
curl -X DELETE "http://localhost:3000/api/clients/LMC-ABC123" \
  -H "Authorization: Bearer $TOKEN"
```

## Client ID Format

All clients receive a unique ID in the format: **LMC-XXXXXX**

- **LMC**: Lars Medical Centre (clinic prefix)
- **XXXXXX**: 6 random alphanumeric characters (A-Z, 0-9)

**Examples**:
- LMC-ABC123
- LMC-XYZ789
- LMC-K9M2P5

## Database Schema

### Client Table

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Internal database ID |
| clientId | String (Unique) | Public client ID (LMC-XXXXXX) |
| name | String | Client's full name |
| sex | String | MALE, FEMALE, or OTHER |
| age | Integer | Age in years |
| address | String (Optional) | Client's address |
| refDoctor | String (Optional) | Referring doctor's name |
| procedure | String (Optional) | Type of procedure |
| operationTeam | String[] | Array of team members |
| timeStarted | DateTime (Optional) | Procedure start time |
| timeEnded | DateTime (Optional) | Procedure end time |
| medicationGiven | String (Optional) | Medications administered |
| instrumentsUsed | String[] | Array of instruments used |
| clinicalSummary | String (Optional) | Summary of clinical findings |
| findings | String (Optional) | Detailed findings |
| hutTestResult | String (Optional) | HUT test result |
| impression | String (Optional) | Medical impression/diagnosis |
| comments | String (Optional) | Doctor's comments |
| medication | String (Optional) | Prescribed medication |
| dateOfRegistration | DateTime | Registration date/time |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Last update timestamp |

## Project Structure

```
clinic-management/
├── app/
│   ├── api/
│   │   └── clients/
│   │       ├── route.ts              # GET/POST clients
│   │       └── [clientId]/
│   │           └── route.ts          # GET/PUT/DELETE specific client
│   ├── layout.tsx                    # Root layout with metadata
│   ├── page.tsx                      # Home page with navigation
│   └── globals.css                   # Global styles
├── components/
│   ├── sections/
│   │   ├── RegisterClient.tsx        # Client registration form
│   │   └── SearchClient.tsx          # Client search interface
│   └── ui/                           # shadcn/ui components
├── lib/
│   ├── db.ts                         # Prisma client singleton
│   ├── client-id.ts                  # ID generation utilities
│   └── utils.ts                      # General utilities
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── migrations/                   # Database migrations
├── public/                           # Static assets
├── .env.example                      # Environment variables template
├── .env.local                        # Local environment variables (git ignored)
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # This file
```

## Development

### Running the Development Server
```bash
npm run dev
```
Server runs on `http://localhost:3000`

### Building for Production
```bash
npm run build
npm start
```

### Database Management

**View database schema**:
```bash
npx prisma studio
```

**Create a new migration**:
```bash
npx prisma migrate dev --name migration_name
```

**Reset database** (development only):
```bash
npx prisma migrate reset
```

## Error Handling

The system includes comprehensive error handling:
- Form validation on client registration
- API error responses with descriptive messages
- Toast notifications for user feedback
- Console logging for debugging
- Database constraint validation

## Security Considerations

- Input validation on all forms
- SQL injection prevention (Prisma ORM)
- Environment variables for sensitive data
- No sensitive data in client-side code
- CORS headers can be configured as needed

## Future Enhancements

- User authentication and authorization
- Appointment scheduling
- Medical report generation (PDF export)
- Patient portal for self-service
- SMS/Email notifications
- Advanced analytics and reporting
- Multi-clinic support
- Backup and disaster recovery

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in .env.local
- Ensure database exists: `createdb clinic_management`

### Port 3000 Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Prisma Client Not Generated
```bash
npx prisma generate
```

### Migration Issues
```bash
# Reset database (development only)
npx prisma migrate reset
```

## Support

For issues or questions:
- Email: larsmedicalscentre@yahoo.com
- Phone: 0200-638-932 / 0352196970
- Address: Opposite Victory Hardware, Sunyani

## License

© 2026 Lars Medical Centre. All rights reserved.

## Contributing

This is a proprietary system for Lars Medical Centre. Contact the clinic for contribution guidelines.
