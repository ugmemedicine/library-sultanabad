# Handoff

## Current State

- Project: Sultanabad Library
- Repo root: `C:\Users\Shaheen\Desktop\Library`
- App: Next.js 15 + React 19 + Firebase
- Local dev server: `http://localhost:3000`
- Firebase project currently linked in this workspace: `library-sultanabad`

## What Is Already Done

- Built the full app shell and core pages:
  - `/login`
  - `/dashboard`
  - `/books`
  - `/books/new`
  - `/books/[bookId]`
  - `/copies`
  - `/members`
  - `/members/new`
  - `/members/[memberId]`
  - `/circulation/issue`
  - `/circulation/return`
  - `/circulation/renew`
  - `/reports`
  - `/reports/issued`
  - `/reports/overdue`
  - `/reports/returned`
  - `/settings`
  - `/unauthorized`
- Added Firebase service layer for:
  - books
  - copies
  - members
  - loans
  - reports
  - settings
  - audit logs
- Added Firestore rules and indexes.
- Added README, TESTING, and seed script.
- Added `.env.local` and `.firebaserc` for `library-sultanabad`.

## Verification

- `npm run lint` passed.
- `npm run build` passed.
- Firestore rules were deployed to `library-sultanabad`.
- Firestore indexes were deployed to `library-sultanabad`.

## Firebase Setup

- New Firebase project created: `library-sultanabad`
- Firebase Web app created: `Library Sultanabad`
- Firestore database created in `asia-south1`
- Email/password auth was enabled in the Firebase console manually

## Test Login

Create a temporary test user in Firebase Authentication and a matching Firestore profile before testing protected routes.
Do not store plaintext credentials in repository files.

Suggested setup:

- Firebase Auth: create user with email/password.
- Firestore profile: create `users/{uid}` with role `admin` and status `active`.

Matching Firestore profile:

```text
users/{uid}
role: admin
status: active
displayName: Test Admin
```

## Important Constraints

- Do not touch `canteen-sultanabad`.
- Keep using explicit project targeting with `library-sultanabad`.
- The app is still Firebase-only. No separate backend has been added.

## Files To Read Next

- [README.md](./README.md)
- [TESTING.md](./TESTING.md)
- [src/lib/firebase.ts](./src/lib/firebase.ts)
- [src/services/loanService.ts](./src/services/loanService.ts)
- [firestore.rules](./firestore.rules)

## Good Next Steps

1. Finish the member/book/copy CRUD UX if you want the app more complete.
2. Add better report filters and CSV export actions.
3. Add seed data to Firestore using the provided seed script.
4. Deploy the app to Vercel once the Firebase env vars are set in the deployment environment.
