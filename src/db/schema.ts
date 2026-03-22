import Dexie, { type EntityTable } from 'dexie';
import type { Tournament } from '@/types/tournament';

const db = new Dexie('PadelTournamentDB') as Dexie & {
  tournaments: EntityTable<Tournament, 'id'>;
};

db.version(1).stores({
  tournaments: 'id, status, created_at',
});

export { db };
