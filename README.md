# ExpectedEstate

Compassionate estate settlement platform for executors and administrators.

## Project Overview

ExpectedEstate simplifies the complex process of estate settlement by providing:
- Asset tracking and management
- Automated document discovery
- Probate workflow guidance
- Communication logging
- Form generation and filing assistance

**Live URL**: https://exact-screenshot-dusky.vercel.app/

## Development Setup

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- PostgreSQL database (or use Neon/Supabase)

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd expectedestate

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npm run seed

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5000`

## Technologies

This project is built with:

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn-ui
- **Backend**: Express.js, Prisma ORM
- **Database**: PostgreSQL (Neon)
- **Build Tool**: Vite
- **Testing**: Vitest
- **AI Integration**: OpenAI, Anthropic

## Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── lib/               # Utility functions
│   └── config/            # Configuration files
├── server/                # Backend Express server
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── middleware/        # Express middleware
├── prisma/                # Database schema and migrations
└── public/                # Static assets
```

## Deployment

### Vercel Deployment

The application is configured for deployment on Vercel:

```sh
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `MAILGUN_API_KEY` - Mailgun API key (for email)
- `SESSION_SECRET` - Session encryption secret

## Testing

```sh
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Contributing

This is a private project. For questions or issues, contact the development team.

## License

Proprietary - All rights reserved
