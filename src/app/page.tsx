"use client";

import { useEffect, useState } from "react";
import { statsApi } from "@/lib/api-client";
import type { DatabaseStatsResponse } from "@/types/api";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState<DatabaseStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await statsApi.getStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Clubs",
      value: stats?.num_clubs ?? 0,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      link: "/events",
    },
    {
      title: "Swimmers",
      value: stats?.num_swimmers ?? 0,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      link: "/swimmers",
    },
    {
      title: "Meets",
      value: stats?.num_meets ?? 0,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      link: "/events",
    },
    {
      title: "Results",
      value: stats?.num_meet_results ?? 0,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      link: "/events",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-lg font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-theme-sm text-gray-600 dark:text-gray-400">
          Overview of swimming database statistics
        </p>
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading statistics...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-500/10">
          <p className="text-error-600 dark:text-error-400">{error}</p>
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <Link
                key={card.title}
                href={card.link}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm transition-shadow hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-theme-sm font-medium text-gray-600 dark:text-gray-400">
                      {card.title}
                    </p>
                    <p className="mt-2 text-title-md font-semibold text-gray-900 dark:text-white">
                      {card.value.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-brand-50 p-3 text-brand-500 dark:bg-brand-500/10">
                    {card.icon}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="text-theme-xl font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h2>
              <div className="mt-4 space-y-3">
                <Link
                  href="/swimmers"
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    Analyze Swimmer Performance
                  </span>
                </Link>
                <Link
                  href="/events"
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    View Event Results
                  </span>
                </Link>
                <Link
                  href="/relays"
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    Optimize Relay Teams
                  </span>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="text-theme-xl font-semibold text-gray-900 dark:text-white">
                About Tunas
              </h2>
              <p className="mt-4 text-theme-sm text-gray-600 dark:text-gray-400">
                Tunas is a comprehensive swimming analytics platform for analyzing
                USA Swimming meet results, tracking swimmer performance, and
                optimizing relay team compositions.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
