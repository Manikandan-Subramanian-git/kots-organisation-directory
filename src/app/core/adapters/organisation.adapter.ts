import { RawOrganisation } from '../models/raw-organisation.model';
import { Organisation, OrgStatus } from '../models/organisation.model';

const RTL_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class OrganisationAdapter {
  private static dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  /**
   * Transforms a raw, potentially dirty API entity into a safe domain model.
   * Never throws exceptions regardless of upstream anomalies.
   */
  static fromRaw(raw: RawOrganisation, index: number, fallbackUnnamed = '(Unnamed Organisation)'): Organisation {
    // 1. Disambiguate duplicate or missing IDs
    const rawId = typeof raw.id === 'number' ? raw.id : parseInt(String(raw.id ?? index + 1), 10);
    const validId = isNaN(rawId) ? index + 1 : rawId;
    const clientUid = `org_${validId}_idx_${index}`;

    // 2. Name sanitization, RTL detection & length checking
    const rawName = raw.name;
    const trimmedName = typeof rawName === 'string' ? rawName.trim() : '';
    const isNameMissing = trimmedName.length === 0;
    const name = isNameMissing ? '' : trimmedName;
    const displayName = isNameMissing ? fallbackUnnamed : trimmedName;
    const isRtl = RTL_REGEX.test(trimmedName);
    const isLongName = trimmedName.length > 50;

    // 3. Status normalization & typo recovery
    const rawStatus = raw.status != null ? String(raw.status).trim() : null;
    const normalizedRawStatus = rawStatus?.toLowerCase() ?? '';
    let status: OrgStatus = 'unknown';
    let hasStatusTypo = false;

    if (normalizedRawStatus === 'active') {
      status = 'active';
    } else if (normalizedRawStatus === 'actve') {
      // Intentional quirk: backend typo 'actve'
      status = 'active';
      hasStatusTypo = true;
    } else if (normalizedRawStatus === 'inactive') {
      status = 'inactive';
    } else if (normalizedRawStatus === 'suspended') {
      status = 'suspended';
    } else {
      status = 'unknown';
    }

    // 4. Member count sanitization (handles strings, negatives, nulls)
    const rawMembers = raw.memberCount;
    let memberCount = 0;
    let hasDirtyMemberCount = false;

    if (rawMembers == null) {
      memberCount = 0;
      hasDirtyMemberCount = true;
    } else if (typeof rawMembers === 'string') {
      const parsed = parseInt(rawMembers, 10);
      if (isNaN(parsed) || parsed < 0) {
        memberCount = 0;
      } else {
        memberCount = parsed;
      }
      hasDirtyMemberCount = true;
    } else if (typeof rawMembers === 'number') {
      if (rawMembers < 0) {
        memberCount = 0;
        hasDirtyMemberCount = true;
      } else {
        memberCount = Math.floor(rawMembers);
      }
    }

    // 5. Owner email validation & null recovery
    const ownerObj = raw.owner;
    const rawEmail = ownerObj?.email != null ? String(ownerObj.email).trim() : null;
    const isOwnerMissing = ownerObj == null || rawEmail == null || rawEmail === '';
    let ownerEmail = isOwnerMissing ? 'Unassigned' : rawEmail;
    let isOwnerEmailValid = false;

    if (!isOwnerMissing) {
      isOwnerEmailValid = EMAIL_REGEX.test(ownerEmail);
    }

    // 6. CreatedAt resilient date parsing (ISO, Epoch, or invalid string)
    const rawCreated = raw.createdAt;
    let createdAt: Date | null = null;
    let isCreatedAtInvalid = false;
    let createdAtFormatted = '—';

    if (rawCreated == null) {
      isCreatedAtInvalid = true;
    } else if (typeof rawCreated === 'number') {
      const d = new Date(rawCreated);
      if (isNaN(d.getTime())) {
        isCreatedAtInvalid = true;
      } else {
        createdAt = d;
        createdAtFormatted = OrganisationAdapter.dateFormatter.format(d);
      }
    } else if (typeof rawCreated === 'string') {
      const d = new Date(rawCreated);
      if (isNaN(d.getTime())) {
        isCreatedAtInvalid = true;
        createdAtFormatted = 'Invalid Date';
      } else {
        createdAt = d;
        createdAtFormatted = OrganisationAdapter.dateFormatter.format(d);
      }
    }

    return {
      clientUid,
      id: validId,
      name,
      displayName,
      isNameMissing,
      status,
      rawStatus,
      hasStatusTypo,
      memberCount,
      rawMemberCount: rawMembers ?? null,
      hasDirtyMemberCount,
      ownerEmail,
      rawOwnerEmail: rawEmail,
      isOwnerEmailValid,
      isOwnerMissing,
      createdAt,
      rawCreatedAt: rawCreated ?? null,
      createdAtFormatted,
      isCreatedAtInvalid,
      isRtl,
      isLongName
    };
  }

  /**
   * Transforms an array of raw organisations safely.
   */
  static fromRawList(rawList: RawOrganisation[], fallbackUnnamed = '(Unnamed Organisation)'): Organisation[] {
    return rawList.map((item, idx) => OrganisationAdapter.fromRaw(item, idx, fallbackUnnamed));
  }
}
