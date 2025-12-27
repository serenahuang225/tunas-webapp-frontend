/**
 * API Client utilities for Tunas API
 * Uses fetch with error handling and type safety
 */

import type {
  SwimmerResponse,
  SwimmerBestTimesResponse,
  SwimmerTimeHistoryResponse,
  ClubResponse,
  ClubSwimmersResponse,
  DatabaseStatsResponse,
  RelayGenerationRequest,
  RelayGenerationResponse,
  ApiError,
} from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tunas-webapp-backend-production.up.railway.app";

class ApiClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: ApiError
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData: ApiError | null = null;
      try {
        errorData = await response.json();
      } catch {
        // If response is not JSON, use status text
      }

      throw new ApiClientError(
        errorData?.detail || response.statusText || "API request failed",
        response.status,
        errorData || undefined
      );
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return {} as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : "Network error occurred"
    );
  }
}

/**
 * Swimmer API endpoints
 */
export const swimmerApi = {
  /**
   * Get swimmer by ID
   */
  getSwimmer: async (swimmerId: string): Promise<SwimmerResponse> => {
    return fetchApi<SwimmerResponse>(`/api/swimmers/${swimmerId}`);
  },

  /**
   * Get swimmer's best times
   */
  getBestTimes: async (
    swimmerId: string
  ): Promise<SwimmerBestTimesResponse> => {
    return fetchApi<SwimmerBestTimesResponse>(
      `/api/swimmers/${swimmerId}/best-times`
    );
  },

  /**
   * Get swimmer's full time history
   */
  getTimeHistory: async (
    swimmerId: string
  ): Promise<SwimmerTimeHistoryResponse> => {
    return fetchApi<SwimmerTimeHistoryResponse>(
      `/api/swimmers/${swimmerId}/times`
    );
  },
};

/**
 * Club API endpoints
 */
export const clubApi = {
  /**
   * Get club by code
   */
  getClub: async (clubCode: string): Promise<ClubResponse> => {
    return fetchApi<ClubResponse>(`/api/clubs/${clubCode.toUpperCase()}`);
  },

  /**
   * Get all swimmers in a club
   */
  getClubSwimmers: async (clubCode: string): Promise<ClubSwimmersResponse> => {
    return fetchApi<ClubSwimmersResponse>(
      `/api/clubs/${clubCode.toUpperCase()}/swimmers`
    );
  },
};

/**
 * Relay API endpoints
 */
export const relayApi = {
  /**
   * Generate optimal relay teams
   */
  generateRelays: async (
    request: RelayGenerationRequest
  ): Promise<RelayGenerationResponse> => {
    return fetchApi<RelayGenerationResponse>("/api/relays/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
};

/**
 * Stats API endpoints
 */
export const statsApi = {
  /**
   * Get database statistics
   */
  getStats: async (): Promise<DatabaseStatsResponse> => {
    return fetchApi<DatabaseStatsResponse>("/api/stats");
  },
};

/**
 * Health check endpoint
 */
export const healthApi = {
  /**
   * Check API health
   */
  check: async (): Promise<{ status: string; [key: string]: any }> => {
    return fetchApi<{ status: string; [key: string]: any }>("/health");
  },
};

export { ApiClientError };

