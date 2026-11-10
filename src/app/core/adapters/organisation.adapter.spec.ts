import { OrganisationAdapter } from './organisation.adapter';
import { RawOrganisation } from '../models/raw-organisation.model';

describe('OrganisationAdapter', () => {
  it('should handle empty/null names with fallback without crashing', () => {
    const rawEmpty: RawOrganisation = { id: 2, name: '', status: 'ACTIVE' };
    const rawNull: RawOrganisation = { id: 3, name: null, status: 'Active' };

    const parsedEmpty = OrganisationAdapter.fromRaw(rawEmpty, 0, '(Unnamed Organisation)');
    const parsedNull = OrganisationAdapter.fromRaw(rawNull, 1, '(Unnamed Organisation)');

    expect(parsedEmpty.displayName).toBe('(Unnamed Organisation)');
    expect(parsedEmpty.isNameMissing).toBeTrue();

    expect(parsedNull.displayName).toBe('(Unnamed Organisation)');
    expect(parsedNull.isNameMissing).toBeTrue();
  });

  it('should normalize uppercase and typo statuses', () => {
    const rawUpper: RawOrganisation = { id: 2, name: 'Acme', status: 'ACTIVE' };
    const rawTypo: RawOrganisation = { id: 5, name: 'Globex Ltd', status: 'actve' };
    const rawSuspended: RawOrganisation = { id: 4, name: 'Wayne', status: 'suspended' };

    const parsedUpper = OrganisationAdapter.fromRaw(rawUpper, 0);
    const parsedTypo = OrganisationAdapter.fromRaw(rawTypo, 1);
    const parsedSuspended = OrganisationAdapter.fromRaw(rawSuspended, 2);

    expect(parsedUpper.status).toBe('active');
    expect(parsedTypo.status).toBe('active');
    expect(parsedTypo.hasStatusTypo).toBeTrue();
    expect(parsedSuspended.status).toBe('suspended');
  });

  it('should sanitize negative and string member counts', () => {
    const rawString: RawOrganisation = { id: 2, name: 'Acme', memberCount: '12' };
    const rawNegative: RawOrganisation = { id: 3, name: 'Null Co', memberCount: -1 };
    const rawNull: RawOrganisation = { id: 8, name: 'Initech', memberCount: null };

    const parsedString = OrganisationAdapter.fromRaw(rawString, 0);
    const parsedNegative = OrganisationAdapter.fromRaw(rawNegative, 1);
    const parsedNull = OrganisationAdapter.fromRaw(rawNull, 2);

    expect(parsedString.memberCount).toBe(12);
    expect(parsedString.hasDirtyMemberCount).toBeTrue();

    expect(parsedNegative.memberCount).toBe(0);
    expect(parsedNegative.hasDirtyMemberCount).toBeTrue();

    expect(parsedNull.memberCount).toBe(0);
    expect(parsedNull.hasDirtyMemberCount).toBeTrue();
  });

  it('should safely parse unix epoch numbers and invalid date strings', () => {
    const rawEpoch: RawOrganisation = { id: 2, name: 'Acme', createdAt: 1710150720000 };
    const rawInvalid: RawOrganisation = { id: 8, name: 'Initech', createdAt: 'not a date' };

    const parsedEpoch = OrganisationAdapter.fromRaw(rawEpoch, 0);
    const parsedInvalid = OrganisationAdapter.fromRaw(rawInvalid, 1);

    expect(parsedEpoch.createdAt).not.toBeNull();
    expect(parsedEpoch.isCreatedAtInvalid).toBeFalse();

    expect(parsedInvalid.createdAt).toBeNull();
    expect(parsedInvalid.isCreatedAtInvalid).toBeTrue();
    expect(parsedInvalid.createdAtFormatted).toBe('Invalid Date');
  });

  it('should detect RTL text and disambiguate duplicate IDs', () => {
    const rawRtl: RawOrganisation = { id: 6, name: 'شركة الأمل 🚀', status: 'active' };
    const rawDup1: RawOrganisation = { id: 42, name: 'Globex 1' };
    const rawDup2: RawOrganisation = { id: 42, name: 'Globex 2' };

    const parsedRtl = OrganisationAdapter.fromRaw(rawRtl, 0);
    const parsedDup1 = OrganisationAdapter.fromRaw(rawDup1, 0);
    const parsedDup2 = OrganisationAdapter.fromRaw(rawDup2, 1);

    expect(parsedRtl.isRtl).toBeTrue();
    expect(parsedDup1.clientUid).toBe('org_42_idx_0');
    expect(parsedDup2.clientUid).toBe('org_42_idx_1');
    expect(parsedDup1.clientUid).not.toBe(parsedDup2.clientUid);
  });
});

