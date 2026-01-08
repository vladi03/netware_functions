# Spurgeon Chat Bot

A full-stack application that brings the wisdom of Charles Spurgeon to life through AI-powered chat, devotional generation, and semantic search of his sermons.

## Project Overview

This repository contains:
- **Firebase Cloud Functions** (`functions/`) - Backend API for Spurgeon services
- **React SPA** (`web/`) - Modern frontend for interacting with Spurgeon
- **POC Scripts** (`poc/`) - Proof of concept and utility scripts
- **Tests** (`tests/`) - Backend service tests

## Repository Structure

```
/
├── functions/
│   └── spurgeon-functions/      # Firebase Cloud Functions backend
│       ├── server/              # Service orchestrators
│       │   ├── chatSpurgeonService.js
│       │   ├── generateSpurgeonDevotionalService.js
│       │   ├── restateSpurgeonQuestionService.js
│       │   └── searchSpurgeonIndexService.js
│       ├── spurgeonRoute.js     # Function route definitions
│       ├── mcpServer.js         # MCP server implementation
│       └── docs/                # API documentation
├── web/                         # React SPA frontend (NEW)
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Route pages (Chat, Devotional, Search)
│   │   ├── services/            # API client (spurgeonApi.js)
│   │   └── App.jsx              # Root component with routing
│   ├── package.json
│   └── README.md                # Frontend documentation
├── poc/
│   └── spurgeon/                # POC scripts and utilities
└── tests/
    └── spurgeon/                # Backend tests
```

## Features

### Backend (Firebase Functions)
- **Chat API**: Interactive chat with Spurgeon's voice using GPT with MCP tool orchestration
- **Search API**: Semantic search through Spurgeon's sermon collection using vector embeddings
- **Devotional Generator**: Creates 500-word devotionals from sermon excerpts
- **Question Restater**: Converts modern questions into 19th-century Spurgeon-style queries

### Frontend (React SPA)
- **Chat Interface**: Real-time chat with typing indicators and tool run visualization
- **Devotional Generator**: Search sermons and generate devotionals with beautiful formatting
- **Search Page**: Explore Spurgeon's sermons with configurable search parameters
- **Modern UI**: Responsive design with TailwindCSS

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase CLI (for backend)
- npm or yarn

### Backend Setup

1. Navigate to functions directory:
   ```bash
   cd functions/spurgeon-functions
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see functions/spurgeon-functions/docs for required env vars)

4. Start Firebase emulator:
   ```bash
   npm run serve
   ```

The backend will be available at `http://127.0.0.1:5005/netware-326600/us-central1`

### Frontend Setup

1. Navigate to web directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your configuration:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:5005/netware-326600/us-central1
   VITE_PASSCODES_ADMIN=your-admin-passcode
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

The frontend will open at `http://localhost:3000`

## Running the Full Stack

### Option 1: Local Development

Terminal 1 (Backend):
```bash
cd functions/spurgeon-functions
npm run serve
```

Terminal 2 (Frontend):
```bash
cd web
npm run dev
```

### Option 2: Production

1. Deploy backend to Firebase:
   ```bash
   cd functions/spurgeon-functions
   firebase deploy --only functions
   ```

2. Build and deploy frontend:
   ```bash
   cd web
   npm run build
   # Deploy dist/ to your hosting service
   ```

## API Endpoints

### Base URLs
- **Local**: `http://127.0.0.1:5005/netware-326600/us-central1`
- **Production**: `https://us-central1-netware-326600.cloudfunctions.net`

### Endpoints
- `POST /spurgeonFunctions-chat` - Interactive chat
- `POST /spurgeonFunctions-searchSpurgeon` - Search sermons
- `POST /spurgeonFunctions-generateSpurgeonDevotional` - Generate devotional
- `POST /spurgeonFunctions-restateSpurgeonQuestion` - Restate question
- `POST /spurgeonMcp` - MCP server endpoint

All endpoints require `Authorization: Bearer <PASSCODES_ADMIN>` header.

See `functions/spurgeon-functions/docs/spurgeon-vector-api.md` for complete API documentation.

## Testing

Run backend tests:
```bash
cd tests/spurgeon
npm test
```

## Development Guidelines

### UI Standards
- All web apps are React SPA apps
- Written in JavaScript (not TypeScript)
- Use functional components with hooks
- TailwindCSS for styling

### Backend Patterns
- Route files contain only function wireup
- Business logic in `server/` folder
- One orchestrator file per endpoint
- External calls in `lib/externalCalls/`
- Firestore queries in `lib/firestore/`

## Environment Variables

### Backend Required Variables
- `PASSCODES_ADMIN` - API authorization
- `OPENAI_API_KEY` - OpenAI API access
- `AWS_S3_KEY` - AWS S3 access
- `AWS_S3_SECRET` - AWS S3 secret
- `SPURGEON_BODIES_PATH` - Path to sermon bodies (optional)
- `SPURGEON_MCP_URL` - MCP endpoint URL (required for chat)

### Frontend Required Variables
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_PASSCODES_ADMIN` - Admin passcode for authorization

## Technology Stack

### Backend
- Firebase Cloud Functions
- Node.js
- OpenAI API
- AWS S3 (for vector storage)

### Frontend
- React 18
- Vite 5
- TailwindCSS 3
- React Router 6
- Axios

## Documentation

- Frontend: `web/README.md`
- API Reference: `functions/spurgeon-functions/docs/spurgeon-vector-api.md`
- MCP Implementation: `functions/spurgeon-functions/docs/spurgeon-vector-task.md`
- Performance Notes: `functions/spurgeon-functions/docs/chatSpurgeonService-performance.md`

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with emulator
4. Submit a pull request

## License

Spurgeon Chat Bot Project

## Project Links

- Repository: https://github.com/vladi03/netware_functions
- Firebase Project: netware-326600
