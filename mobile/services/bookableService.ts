import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

export type Bookable = {
  id: string;
  name: string;
  site: string;
  sitesCol: string;     // which top-level collection name actually worked
  bookablesCol: string; // which subcollection name actually worked
};

async function tryFetch(sitesCol: string, bookablesCol: string): Promise<Bookable[]> {
  const sitesSnap = await getDocs(collection(db, sitesCol));
  const results: Bookable[] = [];
  for (const siteDoc of sitesSnap.docs) {
    const bookSnap = await getDocs(
      collection(db, sitesCol, siteDoc.id, bookablesCol),
    );
    for (const b of bookSnap.docs) {
      const data = b.data();
      const name = (
        data.name ?? data.title ?? data.roomName ?? data.room ?? data.spotName ?? b.id
      ) as string;
      results.push({ id: b.id, site: siteDoc.id, name, sitesCol, bookablesCol });
    }
  }
  return results;
}

export async function listAllBookables(): Promise<Bookable[]> {
  const attempts: [string, string][] = [
    ['Sites',  'bookables'],
    ['sites',  'bookables'],
    ['Sites',  'Bookables'],
    ['sites',  'Bookables'],
  ];
  for (const [sitesCol, bookablesCol] of attempts) {
    const results = await tryFetch(sitesCol, bookablesCol);
    if (results.length > 0) return results;
  }
  return [];
}

export async function listTypesForBookable(bookable: Bookable): Promise<string[]> {
  // Try common subcollection names for types
  const typeColNames = ['type', 'types', 'Type', 'Types'];
  for (const typeCol of typeColNames) {
    try {
      const snap = await getDocs(
        collection(db, bookable.sitesCol, bookable.site, bookable.bookablesCol, bookable.id, typeCol),
      );
      if (!snap.empty) {
        return snap.docs.map((d) => {
          const data = d.data();
          return (data.name ?? data.title ?? data.type ?? d.id) as string;
        });
      }
    } catch {
      // try next name
    }
  }
  return [];
}
