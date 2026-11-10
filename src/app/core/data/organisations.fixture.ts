import { RawOrganisation } from '../models/raw-organisation.model';

export const RAW_ORGANISATIONS_FIXTURE: RawOrganisation[] = [
  // 1-8: Original Fixture Entities (Preserving all intentional quirks)
  {
    id: 1,
    name: 'Northwind Traders',
    status: 'active',
    memberCount: 42,
    owner: { email: 'ops@northwind.example' },
    createdAt: '2024-03-11T09:12:00Z'
  },
  {
    id: 2,
    name: '',
    status: 'ACTIVE',
    memberCount: '12',
    owner: { email: 'a@b.example' },
    createdAt: 1710150720000
  },
  {
    id: 3,
    name: null,
    status: 'Active',
    memberCount: -1,
    createdAt: '2024-01-02T00:00:00Z'
  },
  {
    id: 42,
    name: 'Globex Corporation',
    status: 'suspended',
    memberCount: 7,
    owner: { email: 'hq@globex.example' },
    createdAt: '2023-11-30T14:45:10Z'
  },
  {
    id: 42, // Intentional duplicate ID
    name: 'Globex Corporation Ltd',
    status: 'actve', // Intentional typo
    memberCount: 7,
    owner: { email: 'hq@globex.example' },
    createdAt: '2023-11-30T14:45:10Z'
  },
  {
    id: 6,
    name: 'شركة الأمل 🚀', // RTL unicode + emoji
    status: 'active',
    memberCount: 3,
    owner: { email: 'info@amal.example' },
    createdAt: '2025-06-01T08:00:00Z'
  },
  {
    id: 7,
    name: 'The Very Long Organisation Name That Somebody Actually Typed Into The Field Because Nobody Validated It And It Keeps Going Well Past Any Reasonable Column Width And Still Has Not Stopped',
    status: 'inactive',
    memberCount: 0,
    owner: { email: 'long@example.com' },
    createdAt: '2024-07-19T16:20:00Z'
  },
  {
    id: 8,
    name: 'Initech',
    status: null,
    memberCount: null,
    owner: { email: 'not-an-email' },
    createdAt: 'not a date'
  }
];

// Helper to expand the dataset to exactly 137 records as specified in Conflict 1
const BASE_NAMES = [
  'Acme Corporation', 'Wayne Enterprises', 'Stark Industries', 'Cyberdyne Systems',
  'Pied Piper', 'Hooli', 'Dunder Mifflin Paper Co', 'Massive Dynamic',
  'Wonka Industries', 'Oceanic Airlines', 'Soylent Corp', 'Tyrell Corporation',
  'Aperture Science', 'Black Mesa', 'Weyland-Yutani', 'Gringotts Financial',
  'Umbrella Pharmaceuticals', 'Monsters Inc', 'Buy n Large', 'Bluth Company',
  'Prestige Worldwide', 'Vandelay Industries', 'Krusty Krab Holdings', 'Los Pollos Hermanos',
  'Sterling Cooper Draper Pryce', 'Duff Beer International', 'Nakatomi Trading', 'Oscorp Technologies',
  'LexCorp Global', 'Gekko & Co', 'InGen Genetics', 'Omni Consumer Products',
  'Milliways Dining Group', 'Sirius Cybernetics Corp', 'Cyberlife Systems', 'Strickland Propane',
  'Wernham Hogg Paper', 'Reynholm Industries', 'Veridian Dynamics', 'E Corp'
];

const STATUS_VARIANTS = ['active', 'ACTIVE', 'Active', 'actve', 'inactive', 'suspended', 'SUSPENDED', null];
const EMAIL_DOMAINS = ['kots.io', 'ops-hub.net', 'enterprise.internal', 'partner.org', 'cloud-corp.dev'];

// Expand records 9 to 137 (129 records)
for (let i = 9; i <= 137; i++) {
  const baseNameIndex = (i - 9) % BASE_NAMES.length;
  const loopCount = Math.floor((i - 9) / BASE_NAMES.length) + 1;
  const rawBaseName = BASE_NAMES[baseNameIndex];
  
  // Distribute intentional quirks
  let name: string | null = `${rawBaseName} ${loopCount > 1 ? '#' + loopCount : ''}`.trim();
  let status: string | null = STATUS_VARIANTS[i % STATUS_VARIANTS.length];
  let memberCount: number | string | null = ((i * 13) % 250);
  let ownerEmail: string | null = `admin${i}@${EMAIL_DOMAINS[i % EMAIL_DOMAINS.length]}`;
  let createdAt: string | number | null = new Date(1704067200000 + (i * 86400000 * 2.3)).toISOString();
  let id: number = i;

  // Sprinkle specific quirks across dataset
  if (i % 17 === 0) {
    // Empty / null name quirk
    name = i % 34 === 0 ? '' : null;
  } else if (i % 23 === 0) {
    // Unicode RTL + Emoji quirk
    name = `مؤسسة النور والريادة #${i} 🌟`;
  } else if (i % 31 === 0) {
    // Super long name quirk
    name = `Enterprise Division ${i} For Extended Automated Solutions And Infrastructure Management Across Global Regional Clusters`;
  }

  if (i % 19 === 0) {
    // String number quirk
    memberCount = String((i * 7) % 120);
  } else if (i % 29 === 0) {
    // Negative number quirk
    memberCount = -((i % 10) + 1);
  } else if (i % 41 === 0) {
    // Null member count quirk
    memberCount = null;
  }

  if (i % 21 === 0) {
    // Invalid email quirk
    ownerEmail = `user_${i}_invalid-email-format`;
  } else if (i % 37 === 0) {
    // Missing owner object quirk
    ownerEmail = null;
  }

  if (i % 15 === 0) {
    // Timestamp number quirk
    createdAt = 1704067200000 + (i * 86400000);
  } else if (i % 27 === 0) {
    // Unparseable date quirk
    createdAt = 'unverified-date-string';
  }

  if (i === 55 || i === 88) {
    // Intentional duplicate ID quirk
    id = i - 1;
  }

  RAW_ORGANISATIONS_FIXTURE.push({
    id,
    name,
    status,
    memberCount,
    owner: ownerEmail ? { email: ownerEmail } : null,
    createdAt
  });
}
