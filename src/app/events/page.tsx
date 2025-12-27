"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clubApi } from "@/lib/api-client";
import type { ClubSwimmersResponse } from "@/types/api";
import { ApiClientError } from "@/lib/api-client";

type SortField = "name" | "id" | "sex" | "age" | "birthday";
type SortDirection = "asc" | "desc";

const STORAGE_KEY = "tunas-selected-club-code";

export default function EventResultsPage() {
  const router = useRouter();
  const [clubCode, setClubCode] = useState("");
  const [clubData, setClubData] = useState<ClubSwimmersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSex, setFilterSex] = useState<"F" | "M" | "X" | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [hasLoadedSavedClub, setHasLoadedSavedClub] = useState(false);
  const pageSize = 50;

  const handleSwimmerClick = (swimmerId: string | null) => {
    if (swimmerId) {
      router.push(`/swimmers?id=${encodeURIComponent(swimmerId)}`);
    }
  };

  const handleSearch = async (code?: string) => {
    const codeToSearch = (code || clubCode || "").trim();
    if (!codeToSearch) {
      setError("Please enter a club code");
      return;
    }

    setLoading(true);
    setError(null);
    setClubData(null);

    try {
      const data = await clubApi.getClubSwimmers(codeToSearch);
      setClubData(data);
      setCurrentPage(1);
      setSortField("name");
      setSortDirection("asc");
      
      // Save club code to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, codeToSearch.toUpperCase());
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to fetch club data");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load saved club code on mount
  useEffect(() => {
    if (hasLoadedSavedClub) return;
    
    const loadSavedClub = async () => {
      if (typeof window !== "undefined") {
        const savedClubCode = localStorage.getItem(STORAGE_KEY);
        if (savedClubCode && savedClubCode.trim()) {
          const code = savedClubCode.trim().toUpperCase();
          setClubCode(code);
          setHasLoadedSavedClub(true);
          
          // Automatically search for the saved club
          setLoading(true);
          setError(null);
          setClubData(null);

          try {
            const data = await clubApi.getClubSwimmers(code);
            setClubData(data);
            setCurrentPage(1);
            setSortField("name");
            setSortDirection("asc");
          } catch (err) {
            if (err instanceof ApiClientError) {
              setError(err.message);
            } else {
              setError("Failed to fetch club data");
            }
          } finally {
            setLoading(false);
          }
        } else {
          setHasLoadedSavedClub(true);
        }
      }
    };

    loadSavedClub();
  }, [hasLoadedSavedClub]);

  // Filter swimmers
  const filteredSwimmers = useMemo(() => {
    if (!clubData) return [];
    
    return clubData.swimmers.filter((swimmer) => {
      const matchesSearch =
        !searchTerm ||
        swimmer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        swimmer.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        swimmer.id_short?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSex = !filterSex || swimmer.sex === filterSex;
      return matchesSearch && matchesSex;
    });
  }, [clubData, searchTerm, filterSex]);

  // Sort swimmers
  const sortedSwimmers = useMemo(() => {
    if (!filteredSwimmers.length) return [];
    
    const sorted = [...filteredSwimmers].sort((a, b) => {
      let aValue: string | number | null = null;
      let bValue: string | number | null = null;

      switch (sortField) {
        case "name":
          aValue = a.full_name.toLowerCase();
          bValue = b.full_name.toLowerCase();
          break;
        case "id":
          aValue = (a.id_short || a.id || "").toLowerCase();
          bValue = (b.id_short || b.id || "").toLowerCase();
          break;
        case "sex":
          aValue = a.sex;
          bValue = b.sex;
          break;
        case "age":
          aValue = a.age_range.min;
          bValue = b.age_range.min;
          break;
        case "birthday":
          aValue = a.birthday ? new Date(a.birthday).getTime() : 0;
          bValue = b.birthday ? new Date(b.birthday).getTime() : 0;
          break;
      }

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredSwimmers, sortField, sortDirection]);

  // Paginate swimmers
  const paginatedSwimmers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedSwimmers.slice(startIndex, endIndex);
  }, [sortedSwimmers, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedSwimmers.length / pageSize);

  // Reset to page 1 when filters change
  const handleFilterChange = (newSearchTerm: string, newFilterSex: "F" | "M" | "X" | "") => {
    setSearchTerm(newSearchTerm);
    setFilterSex(newFilterSex);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === "asc" ? (
      <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-lg font-semibold text-gray-900 dark:text-white">
          Event Results
        </h1>
        <p className="mt-2 text-theme-sm text-gray-600 dark:text-gray-400">
          Search for a club to view its swimmers and their event results
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Club Code
            </label>
            <input
              type="text"
              value={clubCode}
              onChange={(e) => setClubCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter club code (e.g., SCSC)"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-theme-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => handleSearch()}
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

      {clubData && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="text-theme-xl font-semibold text-gray-900 dark:text-white mb-4">
              Club Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">Club Name</p>
                <p className="text-theme-sm font-medium text-gray-900 dark:text-white">
                  {clubData.club.full_name}
                </p>
              </div>
              <div>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">Location</p>
                <p className="text-theme-sm font-medium text-gray-900 dark:text-white">
                  {clubData.club.city && clubData.club.state
                    ? `${clubData.club.city}, ${clubData.club.state}`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">Total Swimmers</p>
                <p className="text-theme-sm font-medium text-gray-900 dark:text-white">
                  {clubData.swimmers.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-theme-xl font-semibold text-gray-900 dark:text-white">
                Swimmers ({filteredSwimmers.length})
              </h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleFilterChange(e.target.value, filterSex)}
                  placeholder="Search swimmers..."
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-theme-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-500"
                />
                <select
                  value={filterSex}
                  onChange={(e) => handleFilterChange(searchTerm, e.target.value as "F" | "M" | "X" | "")}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-theme-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                >
                  <option value="">All Sex</option>
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                  <option value="X">Mixed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-2 text-theme-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        Name
                        <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("id")}
                        className="flex items-center gap-2 text-theme-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        ID
                        <SortIcon field="id" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("sex")}
                        className="flex items-center gap-2 text-theme-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        Sex
                        <SortIcon field="sex" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("age")}
                        className="flex items-center gap-2 text-theme-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        Age Range
                        <SortIcon field="age" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("birthday")}
                        className="flex items-center gap-2 text-theme-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        Birthday
                        <SortIcon field="birthday" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {paginatedSwimmers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                        No swimmers found
                      </td>
                    </tr>
                  ) : (
                    paginatedSwimmers.map((swimmer, index) => {
                      const swimmerId = swimmer.id || swimmer.id_short;
                      return (
                        <tr
                          key={swimmer.id || swimmer.id_short || `swimmer-${index}`}
                          onClick={() => handleSwimmerClick(swimmerId)}
                          className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                            swimmerId ? "hover:bg-brand-50 dark:hover:bg-brand-500/10" : "cursor-not-allowed opacity-60"
                          }`}
                          title={swimmerId ? "Click to view swimmer analysis" : "Swimmer ID not available"}
                        >
                          <td className="px-6 py-4 text-theme-sm font-medium text-gray-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {swimmer.full_name}
                              {swimmerId && (
                                <svg
                                  className="w-4 h-4 text-brand-500 opacity-60"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-theme-sm text-gray-600 dark:text-gray-400 font-mono">
                            {swimmer.id_short || swimmer.id || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-theme-sm text-gray-600 dark:text-gray-400">
                            {swimmer.sex}
                          </td>
                          <td className="px-6 py-4 text-theme-sm text-gray-600 dark:text-gray-400">
                            {swimmer.age_range.min} - {swimmer.age_range.max} years
                          </td>
                          <td className="px-6 py-4 text-theme-sm text-gray-600 dark:text-gray-400">
                            {swimmer.birthday
                              ? new Date(swimmer.birthday).toLocaleDateString()
                              : "N/A"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {sortedSwimmers.length > 0 && (
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-theme-xs text-gray-500 dark:text-gray-400">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, sortedSwimmers.length)} to{" "}
                  {Math.min(currentPage * pageSize, sortedSwimmers.length)} of {sortedSwimmers.length} swimmers
                  {clubData && sortedSwimmers.length !== clubData.swimmers.length && (
                    <span> (filtered from {clubData.swimmers.length} total)</span>
                  )}
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-theme-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 7) {
                          pageNum = i + 1;
                        } else if (currentPage <= 4) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 3) {
                          pageNum = totalPages - 6 + i;
                        } else {
                          pageNum = currentPage - 3 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`min-w-[32px] rounded-lg px-3 py-2 text-theme-xs font-medium transition-colors ${
                              currentPage === pageNum
                                ? "bg-brand-500 text-white"
                                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/5"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-theme-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!clubData && !loading && !error && (
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-4 text-theme-sm font-medium text-gray-900 dark:text-white">
            Search for a club
          </h3>
          <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
            Enter a club code to view its swimmers and event results
          </p>
        </div>
      )}
    </div>
  );
}

