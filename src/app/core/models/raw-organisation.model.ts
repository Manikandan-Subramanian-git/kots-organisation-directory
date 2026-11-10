/**
 * Represents the unvalidated, untyped payload directly returned by the upstream API.
 * Contains deliberate real-world quirks (nulls, typos, duplicate IDs, mixed formats).
 */
export interface RawOrganisation {
  id?: number | string | null;
  name?: string | null;
  status?: string | null;
  memberCount?: number | string | null;
  owner?: {
    email?: string | null;
  } | null;
  createdAt?: string | number | null;
}

