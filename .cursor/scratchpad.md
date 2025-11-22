# Project Dashboard

## Background and Motivation

The user wants to ensure that when a new submission is successfully created, the list of current submissions is immediately refreshed or fetched. Also addressing several UI bugs.
The user reported that username and pfp were not being saved in the flow.

## Key Challenges and Analysis

- **API Persistence**: `app/api/user/status/route.ts` was missing logic to handle `username` and `profilePictureUrl`.
- **Frontend Sync**: `app/page.tsx` sync logic only sent `username` but not `profilePictureUrl`.
- **Resolution**:
  - Updated API route to accept and upsert `username` and `profilePictureUrl`.
  - Updated Frontend sync call to send `profilePictureUrl` as well.

## High-level Task Breakdown

1.  **Fix API Persistence**: Completed.
2.  **Fix Frontend Sync**: Completed.

## Project Status Board

- [x] Analyze codebase for submission creation and fetching logic.
- [x] Update `app/page.tsx` to disable caching for submissions fetch.
- [x] Update `app/api/submissions/route.ts` to force dynamic rendering.
- [x] Implement session persistence in `components/minikit-provider.tsx`.
- [x] Replace mock leaderboard data with real DB data in `app/page.tsx`.
- [x] Fix `PGRST116` error in `app/api/user/status/route.ts`.
- [x] Implement hybrid/fallback mock data for leaderboard in `app/page.tsx`.
- [x] Fix World ID verification error in `components/human-verification-modal.tsx`.
- [x] Fix "Already Submitted" state not updating after submission.
- [x] Fix "Anonymous" usernames (added sync logic + local fallback).
- [x] Fix current user ranking card image in leaderboard.
- [x] Fix username and PFP persistence in API.

## Executor's Feedback or Assistance Requests

(None yet)

## Lessons

- Ensure API DTOs match the frontend payload fully.
