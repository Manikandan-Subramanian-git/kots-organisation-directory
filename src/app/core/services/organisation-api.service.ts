import { Injectable } from '@angular/core';
import { RawOrganisation } from '../models/raw-organisation.model';
import { RAW_ORGANISATIONS_FIXTURE } from '../data/organisations.fixture';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class OrganisationApiService {
  /** In-memory store of raw records simulating the database */
  private rawDatabase: RawOrganisation[] = [...RAW_ORGANISATIONS_FIXTURE];

  /** Sliding window for rate limiting: max 5 requests per 60,000 ms */
  private readonly requestTimestamps: number[] = [];
  private readonly RATE_LIMIT_MAX = 5;
  private readonly RATE_LIMIT_WINDOW_MS = 60000;

  /**
   * Fetches a paginated chunk of organizations with simulated latency,
   * random 15% failure rate, and rate-limiting enforcement.
   */
  async getOrganisations(page = 1, pageSize = 25): Promise<PaginatedResponse<RawOrganisation>> {
    // 1. Simulate 400-900ms network latency
    const delay = Math.floor(Math.random() * 501) + 400;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // 2. Enforce 5 req / minute rate limit
    const now = Date.now();
    this.cleanExpiredTimestamps(now);

    if (this.requestTimestamps.length >= this.RATE_LIMIT_MAX) {
      const oldest = this.requestTimestamps[0];
      const waitSeconds = Math.ceil((this.RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000);
      throw new ApiError(
        429,
        `Rate limit exceeded: Max ${this.RATE_LIMIT_MAX} requests per minute. Retry in ${waitSeconds}s.`
      );
    }

    this.requestTimestamps.push(now);

    // 3. Simulate ~15% random failure rate
    if (Math.random() < 0.15) {
      throw new ApiError(500, 'Upstream service error (simulated ~15% random failure)');
    }

    // 4. Slice data
    const total = this.rawDatabase.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const pageData = this.rawDatabase.slice(startIndex, startIndex + pageSize);

    return {
      data: JSON.parse(JSON.stringify(pageData)), // Clone to avoid mutation
      total,
      page,
      pageSize,
      totalPages
    };
  }

  /**
   * Simulates POST /organisations with case-insensitive uniqueness check.
   */
  async createOrganisation(payload: {
    name: string;
    status: string;
    ownerEmail: string;
    memberCount?: number | null;
  }): Promise<RawOrganisation> {
    const delay = 400;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const trimmedName = payload.name.trim();

    // Check case-insensitive uniqueness
    const exists = this.rawDatabase.some(
      (item) => item.name && item.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
      throw new ApiError(409, `An organisation named "${trimmedName}" already exists.`);
    }

    const nextId = Math.max(...this.rawDatabase.map((o) => (typeof o.id === 'number' ? o.id : 0)), 0) + 1;

    const newRecord: RawOrganisation = {
      id: nextId,
      name: trimmedName,
      status: payload.status,
      memberCount: payload.memberCount != null ? payload.memberCount : 0,
      owner: { email: payload.ownerEmail.trim() },
      createdAt: new Date().toISOString()
    };

    // Prepend so user immediately sees their newly added organization at the top of the list!
    this.rawDatabase.unshift(newRecord);

    return JSON.parse(JSON.stringify(newRecord));
  }

  /**
   * Checks whether a name is already taken (case-insensitive).
   */
  isNameTaken(name: string): boolean {
    const target = name.trim().toLowerCase();
    if (!target) return false;
    return this.rawDatabase.some(
      (item) => item.name && item.name.trim().toLowerCase() === target
    );
  }

  /**
   * Cleans rate-limiting window timestamps older than 60 seconds
   */
  private cleanExpiredTimestamps(now: number): void {
    while (this.requestTimestamps.length > 0 && now - this.requestTimestamps[0] > this.RATE_LIMIT_WINDOW_MS) {
      this.requestTimestamps.shift();
    }
  }

  /**
   * Manual reset for rate limiter during testing/demo
   */
  resetRateLimiter(): void {
    this.requestTimestamps.length = 0;
  }
}
