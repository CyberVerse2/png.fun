# Project Dashboard

## Background and Motivation

The user wants to ensure that when a new submission is successfully created, the list of current submissions is immediately refreshed or fetched. This is likely to improve the user experience by showing the user's new submission or updating the feed immediately.

Also, the user reported that refreshing the app triggers the World ID sign-in modal (drawer), which is annoying. They requested to check the database (or persistence) first.

## Key Challenges and Analysis

- **Submission Refresh**: Addressed by disabling cache and forcing dynamic API.
- **Auth Modal on Refresh**:
  - **Root Cause**: `MiniKitProvider` was configured to automatically call `authenticate()` (which calls `walletAuth`) on every mount. `walletAuth` triggers the World ID drawer.
  - **Solution**: Implement session persistence using `localStorage`.
    - On mount, check `localStorage` for a valid session. If found, restore it and set `isAuthenticated = true`.
    - Do NOT call `authenticate()` automatically if no session is found (let the user click "Connect" on the Onboarding screen).
    - Save session to `localStorage` upon successful authentication.

## High-level Task Breakdown

1.  **Analyze Codebase**: Completed. Logic is in `app/page.tsx`.
2.  **Ensure Fresh Data**:
    - [x] Modify `app/page.tsx`: Add `{ cache: 'no-store' }` to the `fetch` call in `fetchSubmissions`.
    - [x] Modify `app/api/submissions/route.ts`: Add `export const dynamic = 'force-dynamic'` to ensure the API route is not cached.
3.  **Fix Auth Modal**:
    - [x] Modify `components/minikit-provider.tsx` to use `localStorage` for session persistence and remove auto-auth.
4.  **Verify**: Check if the changes ensure data freshness.

## Project Status Board

- [x] Analyze codebase for submission creation and fetching logic.
- [x] Update `app/page.tsx` to disable caching for submissions fetch.
- [x] Update `app/api/submissions/route.ts` to force dynamic rendering.
- [x] Implement session persistence in `components/minikit-provider.tsx`.

## Executor's Feedback or Assistance Requests

(None yet)

## Lessons

- Always check if an SDK method triggers a UI element (like a modal) before calling it automatically on mount.
- Next.js `fetch` caching can be aggressive; use `no-store` for real-time-like data.
