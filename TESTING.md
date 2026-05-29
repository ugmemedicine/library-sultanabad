# Testing Checklist

## Authentication

- Unauthenticated user is redirected to `/login`.
- Authenticated user without `users/{uid}` profile sees the controlled profile-missing state.
- Suspended or inactive user is blocked.
- Admin can access settings.
- Librarian cannot access settings.
- Member cannot access issue, return, renew, reports, or settings.

## Books

- Admin/librarian can create a book.
- Member cannot create a book.
- Duplicate ISBN is surfaced as a staff warning in implementation follow-up.
- Search works from title, author, ISBN, and category keywords.

## Copies

- Copy accession number is required.
- Copy accession number must be unique.
- Available copy can be issued.
- Damaged, lost, maintenance, removed, and issued copies cannot be issued.

## Issue

- Active member can borrow when copy is available.
- Suspended member cannot borrow.
- Copy status changes from `available` to `issued`.
- Loan record is created.
- Copy stores `currentLoanId`, issued-to member, issued date, and due date.
- Duplicate issue is blocked by Firestore transaction logic.

## Return

- Active loan can be returned by accession/barcode.
- Loan status changes to `returned`, `damaged`, or `lost`.
- Returned loan remains in history.
- Copy status becomes `available`, `damaged`, or `lost`.
- Fine is calculated from overdue days and `settings/library.finePerDay`.

## Reports

- Issued report shows active records.
- Overdue report calculates active overdue records.
- Returned report shows historical returns.
- Member detail shows active/history loans.

## Responsive UI

- Check 375px mobile width.
- Check 390px iPhone width.
- Check 768px tablet width.
- Check 1024px laptop/tablet landscape width.
- Check 1366px laptop width.
- Check 1920px desktop width.

## Security Rules

Use Firebase rules simulator or emulator:

- Member cannot write to books.
- Member cannot create loans.
- Member cannot read another member's loans.
- Librarian can create loans.
- Admin can update settings.
- Librarian cannot update settings.
- Deletes are blocked for users, books, copies, loans, and audit logs.
