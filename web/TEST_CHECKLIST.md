# Frontend Testing Checklist

## Basic Operation Tests

### Installation Test
- [ ] `npm install` completes successfully without errors
- [ ] All dependencies are installed (152 packages)

### Build Test
- [ ] `npm run build` completes successfully
- [ ] `dist/` directory is created with optimized bundles
- [ ] Bundle sizes are reasonable (CSS ~15KB, JS ~217KB)

### Development Server Test
- [ ] `npm run dev` starts the server on port 3000
- [ ] Application loads in browser
- [ ] No console errors on load

## Frontend Functionality Tests

### Navigation Test
- [ ] All navigation links work (Chat, Devotional Generator, Search)
- [ ] Routes render correct pages
- [ ] Back/forward browser buttons work

### Chat Page Tests
- [ ] Message input field is functional
- [ ] Send button enables/disables correctly
- [ ] Can type and send a message
- [ ] Loading spinner appears during API call
- [ ] Error messages display for API failures
- [ ] Chat history persists during session
- [ ] Clear button removes all messages
- [ ] Tool runs display correctly when returned

### Devotional Generator Page Tests
- [ ] Question input field works
- [ ] Search button triggers search
- [ ] Loading spinner shows during search
- [ ] Search results display with all fields (title, excerpt, distance)
- [ ] Generate Devotional button appears after search
- [ ] Devotional displays with proper formatting (title, intro, paragraphs, references)
- [ ] Sermon reference links are clickable

### Search Page Tests
- [ ] All form inputs work (question, topK, contextChars)
- [ ] Search button submits form
- [ ] Results display with all metadata
- [ ] External links to sermons work
- [ ] Token usage displays when available

## API Integration Tests

### Environment Variables
- [ ] `.env.local` is properly configured
- [ ] API base URL is correct
- [ ] Admin passcode is set

### API Connectivity
- [ ] Backend is running (emulator or cloud)
- [ ] Authorization headers are sent correctly
- [ ] CORS is not blocking requests

### Endpoint Tests (with Backend Running)
- [ ] `/spurgeonFunctions-chat` responds successfully
- [ ] `/spurgeonFunctions-searchSpurgeon` responds successfully
- [ ] `/spurgeonFunctions-generateSpurgeonDevotional` responds successfully
- [ ] Error responses are handled gracefully

## UI/UX Tests

### Responsive Design
- [ ] Layout works on mobile (< 640px)
- [ ] Layout works on tablet (640px - 1024px)
- [ ] Layout works on desktop (> 1024px)

### Styling
- [ ] TailwindCSS classes are applied correctly
- [ ] All components have proper spacing
- [ ] Colors and fonts are consistent
- [ ] Hover states work on interactive elements

### Loading States
- [ ] Spinners show during async operations
- [ ] Buttons disable during loading
- [ ] Loading messages are clear

### Error Handling
- [ ] API errors display user-friendly messages
- [ ] Form validation works
- [ ] Network errors are caught and displayed

## Production Build Test

### Build Verification
- [ ] `npm run preview` works
- [ ] Production build loads correctly
- [ ] Assets are optimized
- [ ] Source maps are generated

### Performance
- [ ] Initial page load is fast (< 3s)
- [ ] Navigation is instant
- [ ] No memory leaks in chat

## Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

## Documentation Tests
- [ ] `web/README.md` is accurate
- [ ] Root `README.md` includes web/ documentation
- [ ] Environment variables are documented
- [ ] Setup instructions are clear

## Test Results Summary

**Date**: _________________
**Tester**: _________________
**Environment**: Local Emulator / Cloud Functions
**Result**: Pass / Fail

**Notes**:
_________________________________________________________________________________
_________________________________________________________________________________
_________________________________________________________________________________
