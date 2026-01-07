# Spurgeon Chat Bot - Web Frontend

A modern React SPA for interacting with the Spurgeon Chat Bot, built with Vite and TailwindCSS.

## Features

- **Chat Interface**: Interactive chat with Spurgeon's voice, powered by GPT with MCP tool orchestration
- **Devotional Generator**: Generate 500-word devotionals based on Spurgeon's sermons
- **Semantic Search**: Search through Spurgeon's sermon collection
- **Modern UI**: Responsive design with TailwindCSS
- **Fast Development**: Powered by Vite for instant HMR

## Project Structure

```
web/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ChatMessage.jsx
│   │   ├── DevotionalDisplay.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ToolRunDisplay.jsx
│   ├── pages/             # Route pages
│   │   ├── ChatPage.jsx
│   │   ├── DevotionalGeneratorPage.jsx
│   │   └── SearchPage.jsx
│   ├── services/          # API clients
│   │   └── spurgeonApi.js
│   ├── utils/             # Helper functions
│   ├── App.jsx            # Root component with routing
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles with Tailwind
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # TailwindCSS configuration
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variables template
└── .env.local             # Local environment variables (gitignored)
```

## Environment Variables

Create a `.env.local` file in the `web/` directory with the following variables:

### Local Development (Firebase Emulator)

```env
VITE_API_BASE_URL=http://127.0.0.1:5005/netware-326600/us-central1
VITE_PASSCODES_ADMIN=your-admin-passcode-here
```

### Production (Firebase Cloud Functions)

```env
VITE_API_BASE_URL=https://us-central1-netware-326600.cloudfunctions.net
VITE_PASSCODES_ADMIN=your-admin-passcode-here
```

## Local Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Firebase emulator running (for local development)

### Installation

1. Navigate to the web directory:
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

4. Update `.env.local` with your admin passcode

### Development

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Production Build

Build for production:

```bash
npm run build
```

The optimized bundle will be created in `web/dist/`

### Preview Production Build

Test the production build locally:

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run preview` - Preview production build locally

## API Integration

The frontend connects to four main Firebase Cloud Functions endpoints:

### 1. Chat (`spurgeonFunctions-chat`)
Interactive chat with Spurgeon's voice, with MCP tool orchestration.

### 2. Restate Question (`spurgeonFunctions-restateSpurgeonQuestion`)
Restates questions into 19th-century Spurgeon-style retrieval queries.

### 3. Search Spurgeon (`spurgeonFunctions-searchSpurgeon`)
Semantic search through Spurgeon's sermon collection using vector embeddings.

### 4. Generate Devotional (`spurgeonFunctions-generateSpurgeonDevotional`)
Generates 500-word devotionals from sermon excerpts.

All API calls are centralized in `src/services/spurgeonApi.js` using axios with automatic Authorization header injection.

## Running with Backend

### Option 1: Firebase Emulator (Local Development)

1. In a separate terminal, start the Firebase emulator:
   ```bash
   cd functions/spurgeon-functions
   npm run serve
   ```

2. Start the web frontend:
   ```bash
   cd web
   npm run dev
   ```

3. Ensure `.env.local` points to emulator:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:5005/netware-326600/us-central1
   ```

### Option 2: Cloud Functions (Production)

Update `.env.local` to point to cloud:
```env
VITE_API_BASE_URL=https://us-central1-netware-326600.cloudfunctions.net
```

## Deployment

The built static files in `web/dist/` can be deployed to:
- Firebase Hosting
- Netlify
- Vercel
- Any static hosting service

For Firebase Hosting:
```bash
firebase deploy --only hosting
```

## Technology Stack

- **React 18**: UI library
- **Vite 5**: Build tool and dev server
- **TailwindCSS 3**: Utility-first CSS framework
- **React Router 6**: Client-side routing
- **Axios**: HTTP client for API calls

## Development Guidelines

- Follow JavaScript (not TypeScript) as per UI standards
- Use functional components with hooks
- Keep components modular and reusable
- Use TailwindCSS utility classes for styling
- Centralize API calls in `services/` folder
- Handle loading and error states gracefully

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure the Firebase Functions backend has CORS enabled for your development origin.

### Environment Variables Not Loading
- Vite requires `VITE_` prefix for environment variables
- Restart dev server after changing `.env.local`

### API Authorization Errors
- Verify `VITE_PASSCODES_ADMIN` is set correctly
- Check that the backend expects the same authorization format

## License

Part of the Spurgeon Chat Bot project.
