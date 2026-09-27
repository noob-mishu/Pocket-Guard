import { openDB } from "idb";

const DB_NAME = "yo-wallet";
const DB_VERSION = 1;
const STORE = "pending";

let dbPromise;

// indexedDB only exists in browsers (and jsdom); return null elsewhere so
// tests and non-PWA environments degrade to "nothing pending".
function getDb() {
  if (typeof indexedDB === "undefined") {
    return null;
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id", autoIncrement: false });
        }
      },
    });
  }
  return dbPromise;
}

export async function addPendingTransaction(transaction) {
  const db = await getDb();
  if (!db) return null;
  try {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await db.put(STORE, { id, transaction, createdAt: Date.now() });
    return id;
  } catch (e) {
    return null;
  }
}

export async function getPendingTransactions() {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.getAll(STORE);
    return rows.sort((a, b) => a.createdAt - b.createdAt);
  } catch (e) {
    return [];
  }
}

export async function removePendingTransaction(id) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.delete(STORE, id);
  } catch (e) {
    // Ignore: the queue still works, it'll just retry.
  }
}

export async function clearPendingTransactions() {
  const db = await getDb();
  if (!db) return;
  try {
    await db.clear(STORE);
  } catch (e) {
    // Ignore: resetting already removes what it can.
  }
}