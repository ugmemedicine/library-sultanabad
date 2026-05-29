# Sultanabad Library

Next.js, Firebase Authentication, Cloud Firestore, and Vercel-ready library circulation system.

## Features

- Firebase email/password login.
- Firestore user profiles with `admin`, `librarian`, and `member` roles.
- Protected dashboard shell with role-based navigation.
- Book catalog, physical copy tracking, member profiles, issue, return, renew, settings, and reports.
- Firestore transactions for issue, return, and renewal writes.
- Historical loan records are preserved.
- Firestore Security Rules included with no hard deletes.
- Mobile-friendly dashboard layout and barcode/accession-first circulation forms.

## Local Setup

1. Install dependencies.

```bash
npm install
```

2. Create a Firebase project.

3. Enable Firebase Authentication with email/password.

4. Create a Cloud Firestore database.

5. Copy the environment example.

```bash
copy .env.local.example .env.local
```

6. Add your Firebase web app config values to `.env.local`.

7. Create the first Firebase Auth user in Firebase Console.

8. On first sign-in, the app will create a default active `member` profile at `users/{uid}` if one does not already exist. To make that account staff-capable, update `users/{uid}.role` in Firestore Console to `admin` or `librarian`.

```json
{
  "uid": "firebase-auth-uid",
  "displayName": "Admin User",
  "email": "admin@example.com",
  "role": "admin",
  "status": "active"
}
```

9. Run locally.

```bash
npm run dev
```

10. Deploy Firestore rules.

```bash
firebase deploy --only firestore:rules
```

11. Build before deploying.

```bash
npm run build
```

## Vercel Deployment

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Add the same `NEXT_PUBLIC_FIREBASE_*` variables in Vercel Project Settings.
4. Deploy.

Do not add service account keys or private Firebase Admin credentials to the frontend or Vercel environment.

## Data Model

- `users/{uid}` stores role, status, profile, and member metadata.
- `books/{bookId}` stores catalog title metadata.
- `bookCopies/{copyId}` tracks each physical copy by `accessionNumber` and `barcode`.
- `loans/{loanId}` stores issue, due, return, fine, and snapshot history.
- `settings/library` stores loan/fine configuration.
- `auditLogs/{logId}` stores staff circulation and admin events.

## First Admin

The app self-provisions a basic active `member` profile on first login so the account can get into the system immediately. After that, promote the profile in Firestore Console to `admin` or `librarian` for staff access.

## Notes

This is a frontend-only Firebase app. It intentionally avoids PHP, MySQL, XAMPP, Laravel, Django, MongoDB backend services, and local-only servers.
