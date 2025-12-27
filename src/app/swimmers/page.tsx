"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { swimmerApi } from "@/lib/api-client";
import type { SwimmerBestTimesResponse, SwimmerTimeHistoryResponse } from "@/types/api";
import { ApiClientError } from "@/lib/api-client";
import TimeHistoryChart from "@/components/TimeHistoryChart";

export default function SwimmerAnalysisPage() {
  const searchParams = useSearchParams();
  const [swimmerId, setSwimmerId] = useState("");
  const [bestTimes, setBestTimes] = useState<SwimmerBestTimesResponse | null>(null);
  const [timeHistory, setTimeHistory] = useState<SwimmerTimeHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"best" | "history">("best");
  const [hasAutoSearched, setHasAutoSearched] = useState(false);

  const handleSearchWithId = async (id: string, tab: "best" | "history" = activeTab) => {
    if (!id.trim()) {
      setError("Please enter a swimmer ID");
      return;
    }

    setLoading(true);
    setError(null);
    // Only clear the data for the tab we're NOT searching
    if (tab === "best") {
      setBestTimes(null);
    } else {
      setTimeHistory(null);
    }

    try {
      if (tab === "best") {
        const data = await swimmerApi.getBestTimes(id.trim());
        setBestTimes(data);
        setActiveTab("best"); // Ensure we're on the best tab
      } else {
        const data = await swimmerApi.getTimeHistory(id.trim());
        setTimeHistory(data);
        setActiveTab("history"); // Ensure we're on the history tab
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to fetch swimmer data");
      }
    } finally {
      setLoading(false);
    }
  };

  // Read ID from URL query params and auto-search
  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (idFromUrl && !hasAutoSearched) {
      setSwimmerId(idFromUrl);
      setHasAutoSearched(true);
      
      // Auto-search with best times tab
      const performAutoSearch = async () => {
        setLoading(true);
        setError(null);
        setBestTimes(null);
        setTimeHistory(null);

        try {
          const data = await swimmerApi.getBestTimes(idFromUrl.trim());
          setBestTimes(data);
        } catch (err) {
          if (err instanceof ApiClientError) {
            setError(err.message);
          } else {
            setError("Failed to fetch swimmer data");
          }
        } finally {
          setLoading(false);
        }
      };

      performAutoSearch();
    }
  }, [searchParams, hasAutoSearched]);

  const handleSearch = async (tab?: "best" | "history") => {
    if (!swimmerId.trim()) {
      setError("Please enter a swimmer ID");
      return;
    }
    setHasAutoSearched(false);
    const tabToUse = tab || activeTab;
    await handleSearchWithId(swimmerId, tabToUse);
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-lg font-semibold text-gray-900 dark:text-white">
          Swimmer Analysis
        </h1>
        <p className="mt-2 text-theme-sm text-gray-600 dark:text-gray-400">
          Search for a swimmer by USA Swimming ID to view their performance data
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Swimmer ID (USA Swimming ID)
            </label>
            <input
              type="text"
              value={swimmerId}
              onChange={(e) => setSwimmerId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(activeTab)}
              placeholder="Enter 14-character USA Swimming ID"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-theme-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => handleSearch(activeTab)}
              disabled={loading}
              className="w-full sm:w-auto rounded-lg bg-brand-500 px-6 py-2.5 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-500/10">
          <p className="text-error-600 dark:text-error-400">{error}</p>
        </div>
      )}

      {(bestTimes || timeHistory) && (
        <div className="space-y-6">
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => {
                setActiveTab("best");
                if (swimmerId && !bestTimes) {
                  handleSearchWithId(swimmerId, "best");
                }
              }}
              className={`px-4 py-2 text-theme-sm font-medium transition-colors ${
                activeTab === "best"
                  ? "border-b-2 border-brand-500 text-brand-500"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Best Times
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                if (swimmerId && !timeHistory) {
                  handleSearchWithId(swimmerId, "history");
                }
              }}
              className={`px-4 py-2 text-theme-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "border-b-2 border-brand-500 text-brand-500"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Time History
            </button>
          </div>

          {activeTab === "best" && bestTimes && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
                <h2 className="text-theme-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Swimmer Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400">Name</p>
                    <p className="text-theme-sm font-medium text-gray-900 dark:text-white">
                      {bestTimes.swimmer.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400">Sex</p>
                    <p className="text-theme-sm font-medium text-gray-900 dark:text-white">
                      {bestTimes.swimmer.sex}
                    </p>
                  </div>
                  <div>
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400">Age Range</p>
                    <p className="text-theme-sm font-medium text-gray-900 dark:text-white">
                      {bestTimes.swimmer.age_range.min} - {bestTimes.swimmer.age_range.max} years
                    </p>
                  </div>
                  <div>
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400">Club</p>
                    <p className="text-theme-sm font-medium text-gray-900 dark:text-white">
                      {bestTimes.swimmer.club?.full_name || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-theme-xl font-semibold text-gray-900 dark:text-white">
                    Best Times
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                          Course
                        </th>
                        <th className="px-6 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                          Meet
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {bestTimes.best_times.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                            No best times found
                          </td>
                        </tr>
                      ) : (
                        bestTimes.best_times.map((result, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5">
                            <td className="px-6 py-4 text-theme-sm text-gray-900 dark:text-white">
                              {result.event}
                            </td>
                            <td className="px-6 py-4 text-theme-sm font-medium text-gray-900 dark:text-white">
                              {formatTime(result.time)}
                            </td>
                            <td className="px-6 py-4 text-theme-sm text-gray-600 dark:text-gray-400">
                              {result.event_course}
                            </td>
                            <td className="px-6 py-4 text-theme-sm text-gray-600 dark:text-gray-400">
                              {new Date(result.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-theme-sm text-gray-600 dark:text-gray-400">
                              {result.meet.name}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && timeHistory && (
            <div className="space-y-6">
              {/* Chart Section */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
                <h2 className="text-theme-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Time Progression Chart
                </h2>
                <p className="text-theme-sm text-gray-600 dark:text-gray-400 mb-6">
                  Visualize how swim times have changed over time for different events
                </p>
                <TimeHistoryChart data={timeHistory} />
              </div>

              {/* Table Section */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-theme-xl font-semibold text-gray-900 dark:text-white">
                    Time History ({timeHistory.meet_results.length} results)
                  </h2>
                </div>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Meet
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {timeHistory.meet_results.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                          No results found
                        </td>
                      </tr>
                    ) : (
                      timeHistory.meet_results.map((result, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="px-6 py-4 text-theme-sm text-gray-900 dark:text-white">
                            {result.event}
                          </td>
                          <td className="px-6 py-4 text-theme-sm font-medium text-gray-900 dark:text-white">
                            {formatTime(result.time)}
                          </td>
                          <td className="px-6 py-4 text-theme-sm text-gray-600 dark:text-gray-400">
                            {result.rank || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-theme-sm text-gray-600 dark:text-gray-400">
                            {new Date(result.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-theme-sm text-gray-600 dark:text-gray-400">
                            {result.meet.name}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!bestTimes && !timeHistory && !loading && !error && (
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="mt-4 text-theme-sm font-medium text-gray-900 dark:text-white">
            Search for a swimmer
          </h3>
          <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
            Enter a USA Swimming ID to view performance data
          </p>
        </div>
      )}
    </div>
  );
}

