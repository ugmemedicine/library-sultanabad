# Sultanabad Library

## Spec-Driven Build Guide for Codex CLI

## 1. Purpose

Build a complete web-based Sultanabad Library system using a free-deployable stack:

- Next.js / React frontend
- Firebase Authentication for login
- Cloud Firestore for database
- Optional Firebase Storage for book-cover images
- Vercel for frontend deployment
- GitHub as source repository

The system must support the real library workflow of adding books, managing members, issuing books, returning books, tracking due dates, and reporting overdue books.

This guide is written for Codex CLI or another coding agent. Follow it as the implementation contract. Do not skip security, validation, database structure, or deployment readiness.

Required filename for this specification:

```text
library_issue_return_firebase_vercel_codex_spec.md
```

If your local downloaded file has browser-added suffixes such as `(1)` or `(1) (1)`, rename it to the exact filename above before giving it to Codex.

---

## 2. Target Deployment Decision

Use this architecture:

```text
GitHub repository
        ↓
Vercel deployment
        ↓
Next.js app
        ↓
Firebase Authentication + Firestore
```

### Why this stack

- Vercel Hobby plan is suitable for small/personal applications and supports GitHub-based deployment.
- Firebase provides a no-cost Spark plan suitable for small apps/prototypes.
- Next.js is a React framework suitable for full-stack web applications.
- Firebase Security Rules must protect Firestore data from unauthorized access.

### Official references to check during implementation

- Firebase pricing / Spark plan: https://firebase.google.com/pricing
- Firebase pricing plans: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- Firebase Security Rules: https://firebase.google.com/docs/rules
- Firestore rules getting started: https://firebase.google.com/docs/firestore/security/get-started
- Vercel Hobby plan: https://vercel.com/docs/plans/hobby
- Vercel deployments: https://vercel.com/docs/deployments
- Next.js docs: https://nextjs.org/docs
- Next.js on Vercel: https://vercel.com/docs/frameworks/full-stack/nextjs

---

## 3. Non-Negotiable Requirements

The app must:

1. Be deployable to Vercel free/Hobby plan.
2. Use Firebase for authentication and database.
3. Avoid PHP, MySQL, XAMPP, Laravel, Django, local-only servers, or MongoDB backend.
4. Include role-based access control.
5. Include Firestore Security Rules.
6. Include issue/return transaction records.
7. Never delete historical issue records when a book is returned.
8. Track every book copy independently.
9. Prevent issuing unavailable copies.
10. Prevent normal members from issuing or returning books directly unless explicitly designed as a request workflow.
11. Include seed/sample data for local testing.
12. Include a clear README with setup and deployment steps.

---

## 4. User Roles

Implement these roles:

### 4.1 Admin

Admin can:

- Manage all users.
- Assign roles.
- Add/edit/delete books.
- Add/edit/delete book copies.
- Add/edit/delete members.
- Issue books.
- Return books.
- Renew books.
- View all reports.
- Configure fine settings.

### 4.2 Librarian

Librarian can:

- Add/edit books.
- Add/edit book copies.
- Add/edit members.
- Issue books.
- Return books.
- Renew books.
- View reports.

Librarian must not:

- Assign admin roles.
- Delete admin users.
- Modify system-level settings unless permitted.

### 4.3 Member / Student

Member can:

- Login.
- View/search available books.
- View their own borrowed books.
- View their own overdue books/fines.
- Optionally request issue/reservation if request workflow is implemented.

Member must not:

- Directly create issue records.
- Directly mark books as returned.
- View other members' private borrowing records.
- Modify books or copies.

---

## 5. Core Use Cases

### 5.1 Login

Actors:

- Admin
- Librarian
- Member

Flow:

1. User enters email/password.
2. Firebase Authentication validates credentials.
3. App fetches user profile from Firestore.
4. App routes user to the correct dashboard based on role.

Acceptance criteria:

- Unauthenticated users cannot access dashboards.
- Authenticated users without a Firestore profile see a controlled error page.
- Suspended/inactive users cannot access protected workflows.

---

### 5.2 Add Book Title

Actors:

- Admin
- Librarian

Fields:

- title
- subtitle optional
- authors array
- isbn optional
- publisher optional
- publicationYear optional
- category
- language optional
- description optional
- coverImageUrl optional
- keywords array
- createdAt
- updatedAt
- createdBy
- updatedBy

Flow:

1. Staff opens Add Book page.
2. Staff enters metadata.
3. App validates required fields.
4. App creates a `books` document.
5. App redirects to book detail page.

Acceptance criteria:

- Empty title is rejected.
- Duplicate ISBN warning is shown if ISBN already exists.
- Book title can exist with zero copies.
- Created/updated metadata is saved.

---

### 5.3 Add Book Copy

Actors:

- Admin
- Librarian

Fields:

- bookId
- accessionNumber / barcode
- status
- location
- shelf optional
- condition
- notes optional
- createdAt
- updatedAt

Copy statuses:

```text
available
issued
lost
damaged
maintenance
removed
```

Flow:

1. Staff opens a book detail page.
2. Staff clicks Add Copy.
3. Staff enters accession/barcode and location.
4. App creates a `bookCopies` document.
5. Book availability count updates.

Acceptance criteria:

- Accession number/barcode must be unique.
- New copy defaults to `available` unless otherwise selected.
- Removed/lost/damaged copies cannot be issued.
- If staff does not manually enter a barcode/accession number, the system must auto-generate one.
- Auto-generated barcode/accession number must follow a predictable format such as `ACC-000001`, `ACC-000002`, `ACC-000003`.
- Barcode/accession number belongs to the physical copy record, not only to the book title.
- The copy detail view must show the barcode/accession number clearly and provide a printable barcode/label area as a future-friendly UI.

Barcode generation rule:

1. Prefer `ACC-000001` style for MVP.
2. Never generate a duplicate barcode.
3. Store both `accessionNumber` and `barcode`; for MVP they may contain the same value.
4. Issue and return workflows must use barcode/accession search as the primary staff workflow.

---

### 5.4 Register Member

Actors:

- Admin
- Librarian

Fields:

- displayName
- email
- memberCode / studentId optional
- phone optional
- department optional
- role = `member`
- status = `active` or `suspended`
- createdAt
- updatedAt

Flow:

1. Staff opens Members page.
2. Staff adds a new member profile.
3. If authentication account creation is included, create Firebase Auth account separately or document manual process.
4. Store user profile in Firestore.

Acceptance criteria:

- Duplicate email/member code warning is shown.
- Suspended members cannot borrow.
- Member profile can be searched by name/email/code.

---

### 5.5 Issue Book

Actors:

- Admin
- Librarian

Required entities:

- Member must be active.
- Book copy must be available.
- Member must not exceed borrowing limit.
- Member must not have blocking overdue/fine rules if configured.

Fields stored in transaction:

- memberId
- memberNameSnapshot
- memberEmailSnapshot
- bookId
- bookTitleSnapshot
- copyId
- accessionNumberSnapshot
- issuedAt
- dueAt
- returnedAt = null
- status = `issued`
- issuedBy
- returnedBy = null
- renewedCount = 0
- fineAmount = 0
- notes optional

Flow:

1. Staff searches member.
2. Staff searches/scans copy barcode.
3. App validates member and copy.
4. App displays current copy status before confirmation.
5. Staff confirms issue only if the copy is available.
6. App creates a `loans` document.
7. App updates the copy status to `issued`.
8. App writes `currentLoanId`, `currentIssuedToMemberId`, `currentIssuedToNameSnapshot`, `currentIssuedAt`, and `currentDueAt` on the copy for fast status display.
9. App shows receipt/confirmation.

Acceptance criteria:

- Same copy cannot be issued twice at the same time.
- Transaction and copy status must remain consistent.
- Use a Firestore transaction or batched write.
- Due date is calculated automatically from configured loan period.
- Historical snapshot values are saved, so reports still show old title/member names if they later change.
- When a copy is already issued, the UI must show status `Issued`.
- The issued status view must show who it is issued to, issue date/time, due date, accession/barcode, book title, member email/code if available, and current loan ID/reference if useful to staff.
- The Issue button must be disabled for issued, lost, damaged, maintenance, or removed copies.
- The disabled Issue button must show a helpful reason such as `Already issued to Ali Khan until 15 June 2026`.
- Staff must not be able to bypass duplicate-issue prevention by manually editing the URL, refreshing the page, using another browser tab, or double-clicking the Issue button.

Important implementation note:

Use Firestore transaction logic when issuing a book:

1. Read copy document.
2. Confirm status is `available`.
3. Create loan document.
4. Update copy status to `issued`.
5. Commit atomically.

---

### 5.6 Return Book

Actors:

- Admin
- Librarian

Flow:

1. Staff searches/scans accession number or active loan.
2. App finds active loan where status is `issued` or `overdue`.
3. App calculates overdue days and fine amount.
4. Staff confirms return.
5. App updates loan with returnedAt, returnedBy, fineAmount, and status = `returned`.
6. App updates copy status to `available`, unless returned as damaged/lost.

Acceptance criteria:

- Returned loan remains in history.
- Copy becomes available after return unless marked damaged/lost.
- App prevents returning a copy with no active loan.
- Fine is calculated consistently.
- Use Firestore transaction or batched write.

---

### 5.7 Renew Book

Actors:

- Admin
- Librarian
- Member only if allowed

Flow:

1. User opens active loan.
2. App checks renewal eligibility.
3. App extends due date.
4. App increments renewedCount.
5. App stores renewal history.

Acceptance criteria:

- Renewal limit is enforced.
- Overdue items may be blocked from renewal if configured.
- Renewal history is preserved.

---

### 5.8 Search Catalog

Actors:

- All authenticated users

Search fields:

- title
- author
- ISBN
- category
- accession number for staff

Acceptance criteria:

- Members see only active book titles and availability summary.
- Staff can see all copies and statuses.
- Search should work even if the exact title is not typed.

Implementation note:

Firestore does not provide full text search by default. Implement simple lowercase keyword arrays for basic search:

```text
books/{bookId}.keywords = ["ai", "artificial", "intelligence", "machine", "learning"]
```

For advanced search later, document possible Algolia/Meilisearch integration, but do not implement now.

---

### 5.9 Reports

Actors:

- Admin
- Librarian

Reports required:

1. All issued books.
2. All overdue books.
3. All returned books.
4. Active loans by member.
5. Loan history by member.
6. Copy status report.
7. Most borrowed books.
8. Fines report.

Acceptance criteria:

- Reports can be filtered by date range.
- Reports can be filtered by member/book/category/status.
- Export to CSV is available for main reports.

---

## 6. Firestore Data Model

Use these collections.

### 6.1 users

Path:

```text
users/{uid}
```

Example:

```json
{
  "uid": "firebase-auth-uid",
  "displayName": "Ali Khan",
  "email": "ali@example.com",
  "role": "member",
  "status": "active",
  "memberCode": "STU-001",
  "department": "Computer Science",
  "phone": "",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

Roles:

```text
admin
librarian
member
```

Statuses:

```text
active
suspended
inactive
```

---

### 6.2 books

Path:

```text
books/{bookId}
```

Example:

```json
{
  "title": "Artificial Intelligence: A Modern Approach",
  "subtitle": "",
  "authors": ["Stuart Russell", "Peter Norvig"],
  "isbn": "9780134610993",
  "publisher": "Pearson",
  "publicationYear": 2020,
  "category": "Computer Science",
  "language": "English",
  "description": "",
  "coverImageUrl": "",
  "keywords": ["artificial", "intelligence", "ai", "russell", "norvig"],
  "isActive": true,
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp",
  "createdBy": "uid",
  "updatedBy": "uid"
}
```

---

### 6.3 bookCopies

Path:

```text
bookCopies/{copyId}
```

Example:

```json
{
  "bookId": "book-doc-id",
  "accessionNumber": "ACC-000001",
  "barcode": "ACC-000001",
  "status": "available",
  "location": "Main Library",
  "shelf": "CS-AI-01",
  "condition": "good",
  "currentLoanId": null,
  "currentIssuedToMemberId": null,
  "currentIssuedToNameSnapshot": null,
  "currentIssuedAt": null,
  "currentDueAt": null,
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp",
  "createdBy": "uid",
  "updatedBy": "uid"
}
```

---

### 6.4 loans

Path:

```text
loans/{loanId}
```

Example:

```json
{
  "memberId": "uid",
  "memberNameSnapshot": "Ali Khan",
  "memberEmailSnapshot": "ali@example.com",
  "bookId": "book-doc-id",
  "bookTitleSnapshot": "Artificial Intelligence: A Modern Approach",
  "copyId": "copy-doc-id",
  "accessionNumberSnapshot": "ACC-000001",
  "issuedAt": "serverTimestamp",
  "dueAt": "timestamp",
  "returnedAt": null,
  "status": "issued",
  "issuedBy": "uid",
  "returnedBy": null,
  "renewedCount": 0,
  "fineAmount": 0,
  "notes": ""
}
```

Loan statuses:

```text
issued
overdue
returned
lost
damaged
cancelled
```

Important:

Do not update every loan to `overdue` with client-only logic. For MVP, calculate overdue status at read/display time using `dueAt < now && returnedAt == null`. Optionally add a server/admin maintenance action later.

---

### 6.5 settings

Path:

```text
settings/library
```

Example:

```json
{
  "defaultLoanDays": 14,
  "maxBooksPerMember": 3,
  "finePerDay": 10,
  "maxRenewals": 2,
  "blockBorrowingIfOverdue": true,
  "currencyLabel": "PKR",
  "updatedAt": "serverTimestamp",
  "updatedBy": "uid"
}
```

---

### 6.6 auditLogs

Path:

```text
auditLogs/{logId}
```

Example:

```json
{
  "actorUid": "uid",
  "actorRole": "librarian",
  "action": "ISSUE_BOOK",
  "entityType": "loan",
  "entityId": "loan-doc-id",
  "message": "Issued ACC-000001 to Ali Khan",
  "createdAt": "serverTimestamp"
}
```

Required audit actions:

```text
CREATE_BOOK
UPDATE_BOOK
CREATE_COPY
UPDATE_COPY
CREATE_MEMBER
UPDATE_MEMBER
ISSUE_BOOK
RETURN_BOOK
RENEW_BOOK
MARK_LOST
MARK_DAMAGED
UPDATE_SETTINGS
CHANGE_USER_ROLE
```

---

## 7. Recommended Project Structure

Use Next.js App Router.

```text
library-issue-return-system/
  README.md
  package.json
  next.config.js
  tsconfig.json
  .env.local.example
  .gitignore
  firestore.rules
  firestore.indexes.json
  firebase.json
  src/
    app/
      layout.tsx
      page.tsx
      login/
        page.tsx
      dashboard/
        page.tsx
      books/
        page.tsx
        new/
          page.tsx
        [bookId]/
          page.tsx
      copies/
        page.tsx
      members/
        page.tsx
        new/
          page.tsx
        [memberId]/
          page.tsx
      circulation/
        issue/
          page.tsx
        return/
          page.tsx
        renew/
          page.tsx
      reports/
        page.tsx
        issued/
          page.tsx
        overdue/
          page.tsx
        returned/
          page.tsx
      settings/
        page.tsx
      unauthorized/
        page.tsx
    components/
      AppShell.tsx
      Navbar.tsx
      Sidebar.tsx
      ProtectedRoute.tsx
      RoleGate.tsx
      LoadingState.tsx
      EmptyState.tsx
      ErrorState.tsx
      ConfirmDialog.tsx
      BookForm.tsx
      CopyForm.tsx
      MemberForm.tsx
      IssueBookForm.tsx
      ReturnBookForm.tsx
      ReportFilters.tsx
    lib/
      firebase.ts
      auth.ts
      roles.ts
      routes.ts
      validators.ts
      dates.ts
      fines.ts
      search.ts
      csv.ts
    services/
      bookService.ts
      copyService.ts
      memberService.ts
      loanService.ts
      reportService.ts
      settingsService.ts
      auditService.ts
    types/
      index.ts
    styles/
      globals.css
    scripts/
      seedSampleData.ts
```

---

## 8. UI Requirements

Build a polished, modern SaaS-style admin dashboard UI. The interface must look professional and production-ready, not like a basic student project. Treat UI quality as a required feature, not decoration.

The visual direction should be close to a premium Tailwind/Next.js dashboard: dark navy or indigo navigation, light content area, rounded cards, soft shadows, clean typography, strong spacing discipline, status badges, helpful icons, and mobile-friendly workflows for barcode-based issue and return.

### 8.1 Modern UI Theme and Visual Standard

Codex must implement a modern responsive UI theme with these rules:

#### Visual style

- Overall style: modern SaaS dashboard for library circulation.
- Main background: soft light gray / off-white dashboard background.
- Sidebar: dark navy, midnight blue, or indigo gradient.
- Primary accent: indigo / violet / blue for main actions.
- Success accent: green for available, returned, and successful scan states.
- Warning/accent: orange for issued / due-soon states.
- Error/accent: red for overdue, lost, duplicate issue, and blocking validation.
- Cards: rounded `2xl`, soft border, subtle shadow, generous padding.
- Tables: clean, readable, zebra/hover row support on desktop, card fallback on mobile.
- Typography: modern readable sans-serif, clear hierarchy, large page headings, compact helper text.
- Icons: use Lucide icons consistently for dashboard, books, users, barcode scan, issue, return, reports, settings, alerts, and status badges.
- Avoid clutter: leave whitespace between cards, sections, and form fields.

#### Required UI library approach

Prefer this stack unless the generated project already has a better equivalent:

```text
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui components
Lucide React icons
Recharts for simple charts, if reports/charts are implemented
Firebase SDK
```

Use shadcn/ui-style components for buttons, cards, dialogs, sheets/drawers, dropdowns, inputs, tables, badges, tabs, and toasts.

#### Layout structure

Authenticated staff layout must include:

- Desktop left sidebar with logo/app name.
- Sidebar sections for Dashboard, Books, Book Copies, Add Book, Issue/Return, Members, Reservations, Fines, Reports, Settings.
- Top search bar for title, author, ISBN, barcode/accession number, or member.
- Top user area showing logged-in user name, role, avatar placeholder, and logout.
- Notification/alert icon for overdue and pending actions.
- Main content area using cards and responsive grids.

Mobile layout must include:

- Compact top bar with menu button, page title, notification icon, and user/avatar menu.
- Bottom navigation or bottom-friendly quick actions for Dashboard, Books, Scan, Issue, and More.
- Slide-out drawer for full navigation.
- Large barcode scan/input action centered or prominently visible.

#### UI inspiration contract

The target UI should resemble a modern product dashboard like:

- premium Tailwind admin dashboards,
- Vercel/Linear/Notion-style clean layouts,
- modern LMS/admin dashboards,
- mobile-first SaaS dashboard screens.

Do not create a plain HTML table-only interface. Do not use default browser styling. Do not create an old Bootstrap-looking admin panel.

### 8.2 General UI

- Responsive layout.
- Sidebar for authenticated dashboard users on desktop.
- Drawer or bottom navigation for tablet/mobile.
- Top bar showing logged-in user name and role.
- Clear buttons: Add Book, Add Copy, Issue Book, Return Book.
- Professional table layout with mobile card fallback where useful.
- Search/filter controls above lists.
- Status badges for available/issued/overdue/returned/lost/damaged/reserved.
- Confirmation dialogs for destructive or important actions.
- Loading skeletons and empty states.
- Toasts for success, warning, and error feedback.
- Error messages must be human-readable.
- All major buttons must have icons and clear labels.

### 8.3 Dashboard Cards

Show modern KPI cards with icons, small helper text, and optional trend text:

- Total book titles.
- Total copies.
- Available copies.
- Issued copies.
- Returned today.
- Overdue loans.
- Active members.
- Fines pending.

Cards must:

- Use rounded cards, subtle border, soft shadow, and clear status color.
- Be clickable and lead to filtered pages/reports.
- Wrap cleanly across desktop, laptop, tablet, and mobile.
- Show compact cards on mobile in a 2-column layout where possible.
- Never overflow or overlap at mobile widths.

Dashboard must also include:

- Recent issued books table/list.
- Overdue books panel.
- Quick actions panel: Scan Barcode, Add New Book, Issue Book, Return Book, Add Member, Generate Report.
- Issued vs Returned chart if charting is implemented.
- Book status overview: Available, Issued, Reserved, Lost/Damaged if implemented.

### 8.4 Book Detail Page

Show:

- Book metadata.
- Cover image placeholder if no cover exists.
- Barcode/accession number for each physical copy.
- Availability summary.
- Copies table/card list.
- Active loans for this book.
- Loan history for this book.

For each copy, the UI must show:

- Copy barcode/accession number.
- Current status badge: Available, Issued, Overdue, Reserved, Damaged, Lost.
- Current borrower if issued.
- Issue date/time if issued.
- Due date if issued.
- Fine/overdue warning if overdue.

Issue button behavior:

- If copy is `available`, show enabled `Issue Book` button.
- If copy is `issued`, show disabled `Issue` button with text like `Already Issued` or `Issue Disabled`.
- If copy is `issued`, show enabled `Return Book` button for staff.
- If copy is `lost`, `damaged`, or unavailable, disable issue and show the reason.
- UI disabling is not enough; Firestore transaction logic must also prevent duplicate issuance.

### 8.5 Member Detail Page

Show:

- Member profile.
- Active loans.
- Overdue loans.
- Loan history.
- Fine summary.

### 8.6 Issue Page

Must support:

- Search/select member.
- Search/select copy by accession/barcode.
- Auto-display book title after copy selected.
- Auto-calculate due date.
- Show warning if member is suspended, over limit, or has blocking overdue items.

### 8.7 Return Page

Must support:

- Search by accession/barcode.
- Show active loan details.
- Show due date.
- Show overdue days.
- Show calculated fine.
- Allow return condition: normal, damaged, lost.

### 8.8 Barcode Scan and Issue/Return UI

The system must be optimized for barcode/accession workflows. A physical barcode scanner usually behaves like keyboard input, so the app must work with normal text inputs as well as manual typing.

Required scan UI behavior:

- Provide a prominent `Scan Barcode` quick action on dashboard.
- Issue page must focus the barcode/accession input when the page opens.
- Return page must focus the barcode/accession input when the page opens.
- Barcode field must support scanner input followed by Enter.
- Manual typing/search must also work if no scanner is connected.
- After scanning a copy barcode, immediately show book title, copy status, cover/placeholder, and availability.
- If available, show member selection and due date confirmation for issue.
- If issued, show borrower, issue date/time, due date, overdue status, and return action.
- If issued and user is on the issue flow, block issue and clearly show: `This copy is already issued to [Member Name] until [Due Date]`.
- If return is successful, show success state and reset/focus barcode input for the next scan.
- If issue is successful, show success state and reset/focus barcode/member flow for the next issue.

Required scanner/mobile design:

- Large barcode input, at least 44px tall.
- Clear scan icon button inside or beside the input.
- Optional camera scanning can be added later, but do not require camera scanning for v1.
- The primary v1 requirement is barcode/accession input that works with USB/Bluetooth barcode scanners and manual typing.

### 8.9 Responsive UI Requirements

The UI must be responsive and usable on:

- Large desktop screens
- Standard PC/laptop screens
- Tablet screens
- Mobile Android browsers
- Mobile iOS/Safari browsers

Implementation requirements:

1. Use a mobile-first responsive layout.
2. Use a sidebar on desktop and a collapsible drawer/bottom-friendly menu on tablet/mobile.
3. Avoid fixed-width layouts that break below laptop size.
4. Tables must not overflow the screen badly on mobile. Use one of these patterns:
   - horizontal scroll container for data-heavy staff tables; or
   - stacked card layout for mobile views; or
   - priority columns with expandable details.
5. Issue and return pages must be easy to use on mobile barcode-scanning workflows. The barcode input should be large, focused, and accessible.
6. Buttons must have touch-friendly sizes, minimum 44px height where practical.
7. Forms must use responsive grids: one column on mobile, two columns on tablet/laptop, wider layouts only on large screens.
8. Dashboard cards must wrap cleanly across screen sizes.
9. Modal dialogs must fit mobile screens and allow scrolling.
10. Do not depend on hover-only interactions because touch devices do not have hover.
11. Test responsive behavior using browser dev tools for at least:
    - 375px mobile width
    - 390px iPhone width
    - 768px tablet width
    - 1024px laptop/tablet landscape width
    - 1366px laptop width
    - 1920px large desktop width
12. iOS Safari must not break form inputs, sticky headers, or modal scrolling.
13. Android Chrome must not break barcode input, table scrolling, or navigation drawer behavior.

Acceptance criteria:

- No page has unreadable overlapping content at mobile width.
- Staff can issue a book from a phone using barcode/accession input.
- Staff can return a book from a phone using barcode/accession input.
- Member catalog and member loan pages are comfortable on mobile.
- Admin/staff reports remain usable on mobile through scroll/card fallback.

---

## 9. Validation Rules

### 9.1 Book Validation

- title required
- category required
- authors optional but recommended
- isbn optional but if present must be normalized
- publicationYear must be reasonable if provided

### 9.2 Copy Validation

- bookId required
- accessionNumber required and unique
- status required
- location required

### 9.3 Member Validation

- displayName required
- email required
- role required
- status required
- memberCode unique if provided

### 9.4 Issue Validation

Before issuing:

- current user role is admin or librarian
- member exists
- member status is active
- copy exists
- copy status is available
- copy `currentLoanId` is null
- no active loan already exists for the same copy
- member active loan count < maxBooksPerMember
- if blockBorrowingIfOverdue is true, member has no blocking overdue loans

### 9.5 Return Validation

Before return:

- current user role is admin or librarian
- active loan exists
- loan status is issued or overdue
- copy exists
- copy is currently issued against this loan

---

## 10. Security Requirements

### 10.1 Client-side checks are not enough

Implement role checks in UI, but do not depend only on UI. Firestore Security Rules must enforce access.

### 10.2 Firestore Security Rules expectations

Rules must enforce:

- Only authenticated users can read allowed data.
- Members can read their own profile.
- Members can read public/active book catalog data.
- Members can read their own loans only.
- Librarians/admins can read operational data.
- Only librarians/admins can create/update books, copies, and loans.
- Only admins can change user roles and settings.
- Users cannot escalate their own role.

### 10.3 Custom claims or Firestore role document

For MVP, roles can be stored in `users/{uid}.role` and checked in rules using Firestore `get()` calls. For stronger production setup, document Firebase custom claims as a later improvement.

### 10.4 First admin bootstrap

Because the first admin cannot assign themselves safely from the public UI, implement one of these documented approaches:

Option A, recommended for MVP:

1. First user signs up.
2. Developer manually creates/updates `users/{uid}` in Firebase Console with role `admin`.
3. App then allows that admin to manage roles.

Option B:

Create a one-time local/admin script that sets the first admin. The script must not be deployed publicly.

---

## 11. Firestore Rules Skeleton

Create `firestore.rules` with a secure starting point. Codex must refine, run, and test these rules using the Firebase emulator or Firebase rules test tooling before finalizing.

Important policy decision: the MVP must avoid hard deletes. Operational records must be deactivated, suspended, marked removed, or returned through status fields instead of being deleted. Therefore, the rules skeleton below blocks deletes for `users`, `books`, `bookCopies`, `loans`, and `auditLogs`.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function userPath() {
      return /databases/$(database)/documents/users/$(request.auth.uid);
    }

    function hasUserProfile() {
      return signedIn() && exists(userPath());
    }

    function userRole() {
      return hasUserProfile() ? get(userPath()).data.role : null;
    }

    function isAdmin() {
      return userRole() == 'admin';
    }

    function isLibrarian() {
      return userRole() == 'librarian';
    }

    function isStaff() {
      return isAdmin() || isLibrarian();
    }

    function isActive() {
      return hasUserProfile() && get(userPath()).data.status == 'active';
    }

    function protectedUserFieldsUnchanged() {
      return !request.resource.data.diff(resource.data).changedKeys().hasAny(['role', 'status']);
    }

    match /users/{userId} {
      allow read: if signedIn() && (request.auth.uid == userId || isStaff());
      allow create: if isAdmin();
      allow update: if isAdmin() || (request.auth.uid == userId && protectedUserFieldsUnchanged());
      allow delete: if false;
    }

    match /books/{bookId} {
      allow read: if signedIn() && isActive();
      allow create, update: if isStaff() && isActive();
      allow delete: if false;
    }

    match /bookCopies/{copyId} {
      allow read: if signedIn() && isActive();
      allow create, update: if isStaff() && isActive();
      allow delete: if false;
    }

    match /loans/{loanId} {
      allow read: if signedIn() && isActive() && (isStaff() || resource.data.memberId == request.auth.uid);
      allow create, update: if isStaff() && isActive();
      allow delete: if false;
    }

    match /settings/{settingId} {
      allow read: if signedIn() && isActive();
      allow write: if isAdmin() && isActive();
    }

    match /auditLogs/{logId} {
      allow read: if isAdmin() && isActive();
      allow create: if isStaff() && isActive();
      allow update, delete: if false;
    }
  }
}
```

Codex must validate that the final rules compile. If any helper syntax needs adjustment for the selected Firebase tooling version, Codex must correct the implementation while preserving the security intent: active authenticated users only, staff-only circulation writes, admin-only settings, and no hard deletes.

Important:

- Validate this syntax during implementation.
- Add field-level validation where practical.
- Add tests or manual verification steps for each role.

---

## 12. Environment Variables

Create `.env.local.example`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Rules:

- Do not commit `.env.local`.
- Use Vercel Project Settings to add environment variables.
- Only expose Firebase public client config through `NEXT_PUBLIC_` variables.
- Do not put private service account keys in the frontend.

---

## 13. Implementation Phases for Codex CLI

### Phase 1: Project setup

Codex must:

1. Create a Next.js TypeScript project.
2. Install Firebase SDK.
3. Configure Firebase client initialization.
4. Add Tailwind CSS or a simple CSS system.
5. Create base layout, login page, and protected dashboard shell.

Done when:

- App runs locally.
- Firebase config is read from environment variables.
- Login page exists.
- Protected dashboard redirects unauthenticated users.

---

### Phase 2: Authentication and roles

Codex must:

1. Implement email/password login.
2. Implement logout.
3. Create auth context/provider.
4. Fetch Firestore user profile after login.
5. Implement `ProtectedRoute` and `RoleGate`.
6. Add unauthorized page.

Done when:

- Admin/librarian/member see different navigation.
- Unauthenticated users cannot access dashboard pages.
- Suspended users are blocked.

---

### Phase 3: Books and copies

Codex must:

1. Implement books list.
2. Implement add/edit book form.
3. Implement book detail page.
4. Implement copies table.
5. Implement add/edit copy form.
6. Implement copy status badges.

Done when:

- Staff can create books and copies.
- Members can search/view available book catalog.
- Duplicate accession number is blocked.

---

### Phase 4: Members

Codex must:

1. Implement members list.
2. Implement add/edit member profile.
3. Implement member detail page.
4. Show active loans and history per member.

Done when:

- Staff can manage members.
- Members can view only their own profile/loans.

---

### Phase 5: Issue workflow

Codex must:

1. Implement issue page.
2. Search/select member.
3. Search/select available copy.
4. Validate borrowing rules.
5. Create loan and update copy in transaction/batch.
6. Create audit log.

Done when:

- Book copy status changes from available to issued.
- Loan record appears.
- Same copy cannot be issued twice.

---

### Phase 6: Return workflow

Codex must:

1. Implement return page.
2. Search active loan by accession/barcode.
3. Calculate overdue fine.
4. Update loan and copy in transaction/batch.
5. Create audit log.

Done when:

- Returned loan remains in history.
- Copy becomes available again.
- Fine is calculated and stored.

---

### Phase 7: Renew workflow

Codex must:

1. Implement renew function.
2. Enforce max renewal count.
3. Extend due date.
4. Add audit log.

Done when:

- Due date changes correctly.
- Renewed count increments.
- Renewal limit is enforced.

---

### Phase 8: Reports and CSV export

Codex must:

1. Implement issued report.
2. Implement overdue report.
3. Implement returned report.
4. Implement member history report.
5. Implement CSV export utility.

Done when:

- Staff can filter and export reports.
- Members cannot access staff reports.

---

### Phase 9: Settings

Codex must:

1. Implement library settings page for admin.
2. Store defaultLoanDays, maxBooksPerMember, finePerDay, maxRenewals.
3. Use settings in issue/return/renew flows.

Done when:

- Changing default loan days affects future issues.
- Fine per day affects future returns.

---

### Phase 10: Deployment readiness

Codex must:

1. Add README setup instructions.
2. Add `.env.local.example`.
3. Add `firestore.rules`.
4. Add `firebase.json` if needed.
5. Add Vercel deployment notes.
6. Confirm `npm run build` passes.
7. Confirm no secrets are committed.

Done when:

- Project can be pushed to GitHub.
- Project can be imported into Vercel.
- Firebase config can be added in Vercel environment variables.

---

## 14. Service Layer Requirements

Do not put all Firebase logic directly in UI components. Use service files.

### bookService.ts

Functions:

- createBook(data)
- updateBook(bookId, data)
- getBook(bookId)
- listBooks(filters)
- searchBooks(query)
- deactivateBook(bookId)

### copyService.ts

Functions:

- createCopy(data)
- updateCopy(copyId, data)
- getCopy(copyId)
- getCopyByAccession(accessionNumber)
- listCopiesByBook(bookId)
- listAvailableCopies(bookId)

### memberService.ts

Functions:

- createMember(data)
- updateMember(uid, data)
- getMember(uid)
- searchMembers(query)
- suspendMember(uid)
- activateMember(uid)

### loanService.ts

Functions:

- issueBook({ memberId, copyId, dueAt, issuedBy })
- returnBook({ loanId, returnedBy, condition })
- renewLoan({ loanId, renewedBy })
- getActiveLoanByCopy(copyId)
- getActiveLoansByMember(memberId)
- getLoanHistoryByMember(memberId)
- getOverdueLoans()

### reportService.ts

Functions:

- getIssuedReport(filters)
- getOverdueReport(filters)
- getReturnedReport(filters)
- getFinesReport(filters)
- getMostBorrowedBooks(filters)

### auditService.ts

Functions:

- createAuditLog(action, entityType, entityId, message)

---

## 15. Date and Fine Logic

Create `dates.ts`:

- addDays(date, days)
- startOfDay(date)
- formatDate(date)
- isOverdue(dueAt, returnedAt)
- daysOverdue(dueAt, now)

Create `fines.ts`:

```text
fine = max(0, daysOverdue) * finePerDay
```

Rules:

- If returned before or on due date, fine is 0.
- If overdue by N days, fine is N * finePerDay.
- Store fine amount on return.
- For active overdue report, calculate fine live.

---

## 16. UI Pages Detailed List

### Public

- `/login`
- `/unauthorized`

### Authenticated

- `/dashboard`
- `/books`
- `/books/new`
- `/books/[bookId]`
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

### Role access matrix

| Page | Admin | Librarian | Member |
|---|---:|---:|---:|
| Dashboard | Yes | Yes | Yes, member version |
| Books list | Yes | Yes | Yes, catalog only |
| Add book | Yes | Yes | No |
| Book detail | Yes | Yes | Limited |
| Members list | Yes | Yes | No |
| Member detail | Yes | Yes | Own only |
| Issue book | Yes | Yes | No |
| Return book | Yes | Yes | No |
| Renew book | Yes | Yes | Optional own request only |
| Reports | Yes | Yes | No |
| Settings | Yes | No | No |

---

## 17. Data Consistency Rules

### Issuing

When a book is issued:

- Create loan document.
- Update copy status to `issued`.
- Set copy `currentLoanId`.
- Set copy `currentIssuedToMemberId`.
- Set copy `currentIssuedToNameSnapshot`.
- Set copy `currentIssuedAt`.
- Set copy `currentDueAt`.
- Add audit log.

These must happen together using transaction/batch. The service must re-read the copy inside the transaction and confirm its status is still `available` before writing. This prevents duplicate issuance from double-clicks, stale screens, multiple tabs, or two staff users acting at the same time.

### Returning

When a book is returned:

- Update loan status to `returned`.
- Set returnedAt.
- Set returnedBy.
- Set fineAmount.
- Update copy status to `available` or damaged/lost based on return condition.
- Clear copy `currentLoanId`.
- Clear copy `currentIssuedToMemberId`.
- Clear copy `currentIssuedToNameSnapshot`.
- Clear copy `currentIssuedAt`.
- Clear copy `currentDueAt`.
- Add audit log.

These must happen together using transaction/batch. The service must confirm that the active loan being returned matches the copy's `currentLoanId`.

### Deleting

Avoid hard deletes for operational records.

Preferred behavior:

- Books: set `isActive = false`.
- Copies: set status `removed`.
- Members: set status `inactive` or `suspended`.
- Loans: never delete in MVP. Corrections must be handled through an admin-only correction/update workflow plus audit log, not document deletion.

---

## 18. Local Development Setup Expected README

README must include:

1. Clone repository.
2. Install dependencies.
3. Create Firebase project.
4. Enable Firebase Authentication email/password.
5. Create Firestore database.
6. Copy Firebase config to `.env.local`.
7. Add first admin user.
8. Run locally.
9. Deploy rules.
10. Deploy to Vercel.

Example commands:

```bash
npm install
npm run dev
npm run build
```

Firebase CLI optional commands:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

Vercel CLI optional commands:

```bash
npm install -g vercel
vercel
vercel --prod
```

---

## 19. Testing Checklist

Codex must create a `TESTING.md` or include this in README.

### Authentication

- Unauthenticated user redirected to login.
- Admin can access all pages.
- Librarian cannot access settings.
- Member cannot access issue/return pages.
- Suspended user blocked.

### Books

- Admin/librarian can create book.
- Member cannot create book.
- Duplicate ISBN shows warning.

### Copies

- Copy accession number must be unique.
- Available copy can be issued.
- Damaged/lost/removed copy cannot be issued.

### Issue

- Active member can borrow if under limit.
- Suspended member cannot borrow.
- Copy status changes to issued.
- Issued copy shows status `Issued`.
- Issued copy shows issued-to member, issue date/time, due date, and barcode/accession number.
- Issue button is disabled for already-issued copies.
- Same copy cannot be issued twice.
- Duplicate issue is blocked even with double-click, refresh, stale tab, or two simultaneous staff actions.

### Return

- Active loan can be returned.
- Copy status changes to available.
- Overdue fine is calculated.
- Loan history remains visible.

### Reports

- Issued report shows active loans.
- Overdue report shows overdue active loans.
- Returned report shows returned loans.
- CSV export works.

### Responsive UI

- Check 375px mobile width.
- Check 390px iPhone width.
- Check 768px tablet width.
- Check 1024px laptop/tablet landscape width.
- Check 1366px laptop width.
- Check 1920px large desktop width.
- Confirm navigation, forms, tables, issue workflow, return workflow, and modals remain usable.

### Security rules

Test manually with Firebase console/rules simulator:

- Member cannot write to books.
- Member cannot create loan.
- Member cannot read another member's loans.
- Librarian can create loan.
- Admin can update settings.
- Librarian cannot update settings.

---

## 20. Seed Data

Provide a seed script or documented manual seed data.

Sample users:

```text
admin@example.com / Admin User / admin / active
librarian@example.com / Librarian User / librarian / active
student@example.com / Student User / member / active
```

Sample books:

```text
Artificial Intelligence: A Modern Approach
Clean Code
Database System Concepts
```

Sample copies:

```text
ACC-000001 / Artificial Intelligence / available
ACC-000002 / Artificial Intelligence / available
ACC-000003 / Clean Code / available
ACC-000004 / Database System Concepts / available
```

Sample settings:

```text
defaultLoanDays = 14
maxBooksPerMember = 3
finePerDay = 10
maxRenewals = 2
currencyLabel = PKR
```

---

## 21. Accessibility and Usability

- Forms must have labels.
- Buttons must have clear text.
- Do not depend on color alone for statuses.
- Error messages must explain what went wrong.
- Tables should be readable on laptop screens.
- Use confirmation before issuing/returning.
- Use keyboard-accessible controls where practical.

---

## 22. Performance Notes

Firestore limitations must be respected:

- Use indexes for common compound filters.
- Avoid loading all loans into memory for reports.
- Use pagination for large lists.
- Keep search simple for MVP.
- Avoid expensive queries on every dashboard load.

Dashboard counts can be:

- calculated live for MVP if small data;
- later optimized with aggregate counters.

For MVP, keep implementation simple but avoid obviously unbounded reads.

---

## 23. What Not to Build in MVP

Do not build these unless all core features are complete:

- Barcode scanner hardware integration.
- Email notifications.
- SMS notifications.
- Online payment for fines.
- Advanced full-text search.
- Multi-branch complex permissions.
- Public unauthenticated catalog.
- Mobile app.
- Import/export from MARC records.
- ISBN metadata API integration.

Document these as future enhancements.

---

## 24. UI Self-Review and Polish Requirement

After creating the first working version, Codex must run the app locally and inspect the UI before finalizing.

Codex must review and improve:

- spacing
- alignment
- card sizing
- table readability
- mobile responsiveness
- tablet responsiveness
- sidebar behavior
- mobile bottom navigation behavior
- button states
- empty states
- loading states
- issued/available/overdue status badges
- visual polish

The final UI must not look like a basic student project. It must look like a modern SaaS admin dashboard suitable for real library staff usage.

---

## 25. Final Acceptance Criteria

Project is complete when:

1. App runs locally with `npm run dev`.
2. App builds with `npm run build`.
3. Login works with Firebase Authentication.
4. Admin/librarian/member roles work.
5. Staff can add books and copies.
6. Staff can issue an available copy to an active member.
7. Staff can return an issued copy.
8. Copy status changes correctly during issue/return.
9. Issued copy displays `Issued` status with issued-to member and due-date details.
10. Issue button is disabled for already-issued or otherwise unavailable copies.
11. Loan history is preserved.
12. Overdue/fine calculation works.
13. Reports show issued, overdue, and returned records.
14. CSV export works for reports.
15. Responsive UI works on PC, laptop, large screen, tablet, Android mobile, and iOS mobile.
16. UI looks like a modern SaaS dashboard, not a basic student project.
17. Desktop uses a polished sidebar/topbar layout with cards, icons, badges, filters, and responsive tables.
18. Mobile uses compact navigation, large touch-friendly controls, readable cards, and practical barcode issue/return workflows.
19. Codex has completed the required UI self-review and polish pass after the first working version.
20. Already-issued copies show issued status, borrower, issue date/time, due date, and disabled Issue button.
21. Barcode/accession input works for issue and return flows using manual typing or scanner-as-keyboard input.
22. Firestore rules are included and documented.
23. README explains Firebase and Vercel deployment.
24. No secrets are committed.

---

## 26. Additional Must-Have Behaviour Added by Project Owner

Codex must treat the following as mandatory, not optional:

1. New physical book copies must receive a unique barcode/accession number.
2. Barcode/accession search is the primary issue and return workflow.
3. A copy that is already issued must show `Issued` status everywhere relevant.
4. The issued status must show who the copy is issued to, when it was issued, and when it is due.
5. The Issue button must be disabled for already-issued/unavailable copies.
6. Duplicate issuance must be prevented in both UI and Firestore transaction logic.
7. The UI must be responsive for PC, laptop, large screens, tablets, Android phones, and iPhones/iOS Safari.

---

## 27. Very Short Prompt to Give Codex CLI

Use this prompt after placing this file in the repository root:

```text
Read `library_issue_return_firebase_vercel_codex_spec.md` fully. If the file has a browser-added suffix such as `(1)` or `(1) (1)`, rename it first or use the exact available filename. Build the project exactly according to the specification. Use Next.js TypeScript, Firebase Authentication, Cloud Firestore, and Vercel-compatible deployment. Implement the work phase by phase. Do not skip Firestore security rules, role-based access, issue/return transaction consistency, README setup, or build verification. After the first working version, run the app locally, inspect the UI, improve spacing, alignment, mobile responsiveness, and visual polish, then run lint/build checks and report what was created, what remains, and how to deploy.
```

---

## 28. Notes for Codex

- Prefer simple, maintainable code over clever code.
- Use TypeScript types for all major entities.
- Keep Firebase access in service files.
- Keep UI components focused on display and form handling.
- Never expose private Firebase Admin credentials in frontend code.
- Do not fake security by hiding buttons only.
- Do not hard-delete loan history.
- Do not implement a backend server unless absolutely necessary.
- Keep the app Vercel-friendly.
- Keep the database Firebase/Firestore-friendly.
