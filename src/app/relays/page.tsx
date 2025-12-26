"use client";

import { useState, useEffect, useMemo } from "react";
import { relayApi, clubApi } from "@/lib/api-client";
import type { RelayGenerationRequest, RelayGenerationResponse, ClubSwimmersResponse } from "@/types/api";
import { ApiClientError } from "@/lib/api-client";

export default function RelayOptimizationPage() {
  const [formData, setFormData] = useState<RelayGenerationRequest>({
    club_code: "",
    age_range: [10, 18],
    sex: "F",
    course: "SCY",
    relay_date: new Date().toISOString().split("T")[0],
    num_relays: 1,
    event_type: "4x100_FREE",
    excluded_swimmer_ids: [],
  });

  const [results, setResults] = useState<RelayGenerationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clubSwimmers, setClubSwimmers] = useState<ClubSwimmersResponse | null>(null);
  const [newExcludedId, setNewExcludedId] = useState("");
  const [excludedIdError, setExcludedIdError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await relayApi.generateRelays(formData);
      setResults(data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to generate relay teams");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof RelayGenerationRequest,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // When club code changes, fetch club swimmers for validation
    if (field === "club_code" && value.trim()) {
      fetchClubSwimmers(value.trim().toUpperCase());
    }
  };

  const fetchClubSwimmers = async (clubCode: string) => {
    try {
      const data = await clubApi.getClubSwimmers(clubCode);
      setClubSwimmers(data);
      setExcludedIdError(null);
      // Clear excluded IDs that are no longer valid for this club
      if (formData.excluded_swimmer_ids && formData.excluded_swimmer_ids.length > 0) {
        const validIds = formData.excluded_swimmer_ids.filter(id => {
          return data.swimmers.some(s => s.id === id || s.id_short === id);
        });
        if (validIds.length !== formData.excluded_swimmer_ids.length) {
          setFormData(prev => ({ ...prev, excluded_swimmer_ids: validIds }));
        }
      }
    } catch (err) {
      setClubSwimmers(null);
      if (err instanceof ApiClientError) {
        // Club not found - this is okay, validation will happen on submit
      }
    }
  };

  const validateSwimmerId = (id: string): { valid: boolean; error?: string } => {
    const trimmedId = id.trim();
    
    if (!trimmedId) {
      return { valid: false, error: "ID cannot be empty" };
    }

    if (!clubSwimmers) {
      return { valid: false, error: "Club data not loaded" };
    }
    
    // Check if ID matches any swimmer in the club
    const found = clubSwimmers.swimmers.some(
      swimmer => swimmer.id === trimmedId || swimmer.id_short === trimmedId
    );

    if (!found) {
      return { valid: false, error: `Swimmer ID "${trimmedId}" not found in club "${formData.club_code}"` };
    }

    return { valid: true };
  };

  const handleAddExcludedId = () => {
    const trimmedId = newExcludedId.trim();
    
    if (!trimmedId) {
      setExcludedIdError("Please enter a swimmer ID");
      return;
    }

    // Check if already excluded
    if (formData.excluded_swimmer_ids?.includes(trimmedId)) {
      setExcludedIdError("This swimmer ID is already excluded");
      return;
    }

    // Validate that the ID belongs to the selected club
    if (!formData.club_code.trim()) {
      setExcludedIdError("Please select a club code first");
      return;
    }

    if (!clubSwimmers) {
      setExcludedIdError("Please wait for club data to load");
      return;
    }

    const validation = validateSwimmerId(trimmedId);
    if (!validation.valid) {
      setExcludedIdError(validation.error || "Invalid swimmer ID");
      return;
    }

    // Add to excluded list
    setFormData((prev) => ({
      ...prev,
      excluded_swimmer_ids: [...(prev.excluded_swimmer_ids || []), trimmedId],
    }));
    
    setNewExcludedId("");
    setExcludedIdError(null);
  };

  const handleRemoveExcludedId = (idToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      excluded_swimmer_ids: prev.excluded_swimmer_ids?.filter(id => id !== idToRemove) || [],
    }));
  };

  const handleAgeRangeChange = (index: 0 | 1, value: number) => {
    setFormData((prev) => {
      const newRange: [number, number] = [...prev.age_range];
      newRange[index] = value;
      return { ...prev, age_range: newRange };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-lg font-semibold text-gray-900 dark:text-white">
          Relay Optimization
        </h1>
        <p className="mt-2 text-theme-sm text-gray-600 dark:text-gray-400">
          Generate optimal relay teams based on swimmer best times
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-theme-xl font-semibold text-gray-900 dark:text-white mb-6">
            Relay Configuration
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Club Code *
              </label>
              <input
                type="text"
                value={formData.club_code}
                onChange={(e) =>
                  handleInputChange("club_code", e.target.value.toUpperCase())
                }
                required
                placeholder="e.g., SCSC"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-theme-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Type *
              </label>
              <select
                value={formData.event_type}
                onChange={(e) =>
                  handleInputChange("event_type", e.target.value)
                }
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-theme-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
              >
                <option value="4x50_FREE">4x50 Free Relay</option>
                <option value="4x50_MEDLEY">4x50 Medley Relay</option>
                <option value="4x100_FREE">4x100 Free Relay</option>
                <option value="4x100_MEDLEY">4x100 Medley Relay</option>
                <option value="4x200_FREE">4x200 Free Relay</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Age *
                </label>
                <input
                  type="number"
                  value={formData.age_range[0]}
                  onChange={(e) =>
                    handleAgeRangeChange(0, parseInt(e.target.value) || 0)
                  }
                  required
                  min="0"
                  max="100"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-theme-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                />
              </div>
              <div>
                <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Age *
                </label>
                <input
                  type="number"
                  value={formData.age_range[1]}
                  onChange={(e) =>
                    handleAgeRangeChange(1, parseInt(e.target.value) || 0)
                  }
                  required
                  min="0"
                  max="100"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-theme-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sex *
              </label>
              <select
                value={formData.sex}
                onChange={(e) => handleInputChange("sex", e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-theme-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
              >
                <option value="F">Female</option>
                <option value="M">Male</option>
                <option value="X">Mixed</option>
              </select>
            </div>

            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course *
              </label>
              <select
                value={formData.course}
                onChange={(e) => handleInputChange("course", e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-theme-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
              >
                <option value="SCY">Short Course Yards (SCY)</option>
                <option value="SCM">Short Course Meters (SCM)</option>
                <option value="LCM">Long Course Meters (LCM)</option>
              </select>
            </div>

            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Relay Date *
              </label>
              <input
                type="date"
                value={formData.relay_date}
                onChange={(e) => handleInputChange("relay_date", e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-theme-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Relay Teams
              </label>
              <input
                type="number"
                value={formData.num_relays}
                onChange={(e) =>
                  handleInputChange("num_relays", parseInt(e.target.value) || 1)
                }
                min="1"
                max="10"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-theme-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exclude Swimmer IDs
              </label>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400 mb-3">
                Optionally exclude specific swimmers from relay generation
              </p>
              
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newExcludedId}
                  onChange={(e) => {
                    setNewExcludedId(e.target.value);
                    setExcludedIdError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddExcludedId();
                    }
                  }}
                  placeholder="Enter swimmer ID"
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-theme-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-500"
                />
                <button
                  type="button"
                  onClick={handleAddExcludedId}
                  disabled={!formData.club_code.trim()}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Add
                </button>
              </div>

              {excludedIdError && (
                <p className="mt-1 text-theme-xs text-error-600 dark:text-error-400">
                  {excludedIdError}
                </p>
              )}

              {formData.excluded_swimmer_ids && formData.excluded_swimmer_ids.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.excluded_swimmer_ids.map((id) => {
                    const swimmer = clubSwimmers?.swimmers.find(
                      s => s.id === id || s.id_short === id
                    );
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-white/5"
                      >
                        <div>
                          <p className="text-theme-sm font-medium text-gray-900 dark:text-white font-mono">
                            {id}
                          </p>
                          {swimmer && (
                            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                              {swimmer.full_name}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExcludedId(id)}
                          className="ml-2 rounded-md p-1 text-gray-400 hover:text-error-600 dark:hover:text-error-400 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-500 px-6 py-2.5 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : "Generate Relay Teams"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="rounded-lg border border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-500/10">
              <p className="text-error-600 dark:text-error-400">{error}</p>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              {results.relays.map((relay, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-theme-xl font-semibold text-gray-900 dark:text-white">
                      Relay Team {idx + 1}
                    </h3>
                    {relay.total_time && (
                      <span className="rounded-lg bg-brand-50 px-3 py-1 text-theme-sm font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                        {relay.total_time}
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400">Event</p>
                    <p className="text-theme-sm font-medium text-gray-900 dark:text-white">
                      {relay.event}
                    </p>
                  </div>

                  {relay.time_standards.length > 0 && (
                    <div className="mb-4">
                      <p className="text-theme-xs text-gray-500 dark:text-gray-400 mb-2">
                        Time Standards
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {relay.time_standards.map((standard, sIdx) => (
                          <span
                            key={sIdx}
                            className="rounded-md bg-success-50 px-2 py-1 text-theme-xs font-medium text-success-600 dark:bg-success-500/10 dark:text-success-400"
                          >
                            {standard}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400 mb-2">
                      Swimmers ({relay.swimmers.length})
                    </p>
                    <div className="space-y-2">
                      {relay.swimmers.map((swimmer, sIdx) => (
                        <div
                          key={swimmer.id || sIdx}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/5"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-theme-sm font-medium text-gray-900 dark:text-white">
                                {swimmer.full_name}
                              </p>
                              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                                Leg {sIdx + 1}: {relay.leg_events[sIdx] || "N/A"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                                Age: {swimmer.age_range.min}-{swimmer.age_range.max}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!results && !loading && !error && (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-4 text-theme-sm font-medium text-gray-900 dark:text-white">
                Configure and generate relay teams
              </h3>
              <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
                Fill out the form to generate optimal relay team compositions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

