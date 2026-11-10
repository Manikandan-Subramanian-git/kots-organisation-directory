export type OrgStatus = 'active' | 'inactive' | 'suspended' | 'unknown';

export interface Organisation {
  /** Stable unique key for Angular trackBy, avoiding collisions with duplicate backend IDs */
  clientUid: string;

  /** Upstream integer ID (may have duplicates in dirty data) */
  id: number;

  /** Sanitized name */
  name: string;

  /** Display-ready name with localized fallback if original was null/empty */
  displayName: string;

  /** True if upstream provided null, undefined, or empty name */
  isNameMissing: boolean;

  /** Normalized status enum */
  status: OrgStatus;

  /** Upstream raw status before normalization */
  rawStatus: string | null;

  /** True if the status was recognized as a typo (e.g. 'actve') */
  hasStatusTypo: boolean;

  /** Sanitized member count (always an integer >= 0) */
  memberCount: number;

  /** Raw member count as received from API */
  rawMemberCount: number | string | null;

  /** True if member count was missing, negative (-1), or a string ("12") */
  hasDirtyMemberCount: boolean;

  /** Sanitized owner email */
  ownerEmail: string;

  /** Raw email from upstream */
  rawOwnerEmail: string | null;

  /** True if the email fails RFC email validation (e.g. 'not-an-email') */
  isOwnerEmailValid: boolean;

  /** True if owner property or email was completely missing */
  isOwnerMissing: boolean;

  /** Validated JS Date object, or null if upstream sent invalid format */
  createdAt: Date | null;

  /** Raw createdAt as received from API */
  rawCreatedAt: string | number | null;

  /** Pre-formatted date string for resilient display */
  createdAtFormatted: string;

  /** True if date string could not be parsed (e.g. 'not a date') */
  isCreatedAtInvalid: boolean;

  /** True if name contains right-to-left characters (Arabic, Hebrew) */
  isRtl: boolean;

  /** True if name length exceeds reasonable display bounds (> 60 chars) */
  isLongName: boolean;
}

