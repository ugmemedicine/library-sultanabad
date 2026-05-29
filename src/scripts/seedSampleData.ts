import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function main() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("Set NEXT_PUBLIC_FIREBASE_* environment variables before seeding.");
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  await setDoc(doc(db, "settings", "library"), {
    defaultLoanDays: 14,
    maxBooksPerMember: 3,
    finePerDay: 10,
    maxRenewals: 2,
    blockBorrowingIfOverdue: true,
    currencyLabel: "PKR",
    updatedAt: serverTimestamp(),
    updatedBy: "seed"
  });

  const books = [
    ["book-ai", "Artificial Intelligence: A Modern Approach", ["Stuart Russell", "Peter Norvig"], "Computer Science", "9780134610993"],
    ["book-clean-code", "Clean Code", ["Robert C. Martin"], "Software Engineering", "9780132350884"],
    ["book-db", "Database System Concepts", ["Abraham Silberschatz", "Henry Korth", "S. Sudarshan"], "Computer Science", "9780073523323"]
  ] as const;

  for (const [id, title, authors, category, isbn] of books) {
    await setDoc(doc(db, "books", id), {
      title,
      subtitle: "",
      authors,
      isbn,
      publisher: "",
      publicationYear: null,
      category,
      language: "English",
      description: "",
      coverImageUrl: "",
      keywords: [title.toLowerCase(), category.toLowerCase(), isbn, ...authors.map((author) => author.toLowerCase())],
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: "seed",
      updatedBy: "seed"
    });
  }

  const copies = [
    ["copy-1", "book-ai", "ACC-000001"],
    ["copy-2", "book-ai", "ACC-000002"],
    ["copy-3", "book-clean-code", "ACC-000003"],
    ["copy-4", "book-db", "ACC-000004"]
  ] as const;

  for (const [id, bookId, accessionNumber] of copies) {
    await setDoc(doc(db, "bookCopies", id), {
      bookId,
      accessionNumber,
      barcode: accessionNumber,
      status: "available",
      location: "Main Library",
      shelf: "General",
      condition: "good",
      notes: "",
      currentLoanId: null,
      currentIssuedToMemberId: null,
      currentIssuedToNameSnapshot: null,
      currentIssuedAt: null,
      currentDueAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: "seed",
      updatedBy: "seed"
    });
  }

  console.log("Seed data written.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
