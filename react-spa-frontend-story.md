# Story: Add React SPA Frontend for Spurgeon Functions

## Title
Build a React single-page app (SPA) frontend for `functions/spurgeon-functions`

## Description
As a user, I want a modern web app UI that lets me interact with the Spurgeon services exposed by `functions/spurgeon-functions` so that I can ask questions and receive responses (e.g., chat/devotional/search) through an accessible, fast, and attractive interface.

The app will be a standalone React SPA (separate folder/project) that calls the existing backend endpoints (local emulator and deployed environment), handling loading/error states, basic input validation, and clear presentation of results.

## Acceptance Criteria

- **Project structure**
  - A new React SPA exists as its own project in a new top-level folder (e.g., `web/`), without refactoring or moving `functions/spurgeon-functions`.
  - The SPA can be run locally with a single command from its folder (e.g., `npm install` then `npm run dev`) and built for production (`npm run build`).

- **Backend connectivity**
  - The SPA can target **local emulators** and **production** via environment configuration (e.g., `.env` values), without code edits to switch environments.
  - The SPA can successfully call at least one endpoint backed by `functions/spurgeon-functions` and display the response.
  - All API calls show **loading state**, handle **network/server errors**, and present a user-friendly error message with a retry option.

- **Core UX flows**
  - The app includes a primary “Ask” experience:
    - An input field for a question/prompt.
    - A submit action (button + Enter key support).
    - Response rendering in a readable format (supports multiline text).
  - The app includes a way to view **recent interactions** in-session (e.g., a simple history list of prompts and responses).
  - The UI is responsive and usable on mobile, tablet, and desktop breakpoints.

- **Styling & design requirements**
  - Clean, modern visual design with consistent spacing and typography.
  - Uses a cohesive design system approach (tokens/variables for spacing, colors, typography) and consistent component styles.
  - Accessible color contrast (WCAG AA for text) and visible focus states for keyboard navigation.
  - Layout requirements:
    - Max content width for readability on large screens.
    - Sticky or clearly visible primary action area (question input + submit).
    - Clear separation between input area, results area, and history/secondary content.
  - UI states styled distinctly:
    - Loading: skeleton or spinner with disabled submit to prevent duplicate requests.
    - Error: inline alert component with clear copy and retry.
    - Empty: helpful onboarding text explaining what the user can do.

- **Accessibility**
  - Fully keyboard navigable (tab order, focus management after submit, accessible buttons/inputs).
  - Semantic HTML usage and ARIA only when necessary.
  - Screen-reader friendly labels for all interactive controls.

- **Quality & maintainability**
  - Linting/formatting configured for the SPA project (separate from backend if desired).
  - No secrets committed; environment variables are documented and a sample env file is provided (e.g., `.env.example`).
  - Clear README section describing how to run the SPA against:
    - local emulator backend
    - deployed backend

- **Out of scope (explicit)**
  - Refactoring the backend functions code.
  - Adding authentication/authorization (unless explicitly requested later).
  - Persisting history server-side (session-only is sufficient for this story).
