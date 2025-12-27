"use client";

import { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { SwimmerTimeHistoryResponse } from "@/types/api";

interface TimeHistoryChartProps {
  data: SwimmerTimeHistoryResponse;
}

// Convert time string (e.g., "1:23.45" or "23.45") to seconds for charting
function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(":");
  if (parts.length === 2) {
    // Format: "M:SS.mm"
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  } else {
    // Format: "SS.mm"
    return parseFloat(timeStr);
  }
}

// Format seconds back to time string for display
function secondsToTime(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toFixed(2).padStart(5, "0")}`;
  }
  return seconds.toFixed(2);
}

export default function TimeHistoryChart({ data }: TimeHistoryChartProps) {
  // State for selected events
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  
  // Group results by event and prepare chart data
  const chartData = useMemo(() => {
    const eventGroups = new Map<
      string,
      Array<{ date: string; time: number; dateObj: Date; timeStr: string }>
    >();

    // Group results by event
    data.meet_results.forEach((result) => {
      const eventKey = result.event;
      if (!eventGroups.has(eventKey)) {
        eventGroups.set(eventKey, []);
      }

      const timeInSeconds = timeToSeconds(result.time);
      eventGroups.get(eventKey)!.push({
        date: result.date,
        time: timeInSeconds,
        dateObj: new Date(result.date),
        timeStr: result.time,
      });
    });

    // Sort each event group by date
    eventGroups.forEach((results) => {
      results.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    });

    // Create chart data structure - need to merge all dates and add times for each event
    const allDates = new Set<string>();
    eventGroups.forEach((results) => {
      results.forEach((r) => allDates.add(r.date));
    });

    const sortedDates = Array.from(allDates).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    // Create data points for each date
    const chartDataPoints = sortedDates.map((date) => {
      const point: Record<string, any> = {
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        dateValue: date,
      };

      // Add time for each event on this date
      eventGroups.forEach((results, eventKey) => {
        const result = results.find((r) => r.date === date);
        if (result) {
          point[eventKey] = result.time;
        }
      });

      return point;
    });

    return {
      data: chartDataPoints,
      events: Array.from(eventGroups.keys()),
    };
  }, [data]);

  // Initialize selected events to all events on first load (or top 8 if more than 8)
  useEffect(() => {
    if (selectedEvents.size === 0 && chartData.events.length > 0) {
      const initialEvents = chartData.events.slice(0, Math.min(8, chartData.events.length));
      setSelectedEvents(new Set(initialEvents));
    }
  }, [chartData.events, selectedEvents.size]);

  // Generate colors for different events
  const colors = [
    "#3b82f6", // brand-500
    "#ef4444", // red
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
    "#14b8a6", // teal
    "#84cc16", // lime
    "#a855f7", // violet
    "#f43f5e", // rose
  ];

  const handleEventToggle = (event: string) => {
    setSelectedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(event)) {
        newSet.delete(event);
      } else {
        newSet.add(event);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedEvents(new Set(chartData.events));
  };

  const handleDeselectAll = () => {
    setSelectedEvents(new Set());
  };

  if (chartData.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No data available for chart
      </div>
    );
  }

  // Use selected events, or all events if none selected
  const eventsToShow = selectedEvents.size > 0
    ? chartData.events.filter(event => selectedEvents.has(event))
    : chartData.events;

  return (
    <div className="w-full space-y-4">
      {/* Event Selection */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-theme-sm font-semibold text-gray-900 dark:text-white">
            Select Events to Display ({selectedEvents.size} of {chartData.events.length} selected)
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="text-theme-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Select All
            </button>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <button
              onClick={handleDeselectAll}
              className="text-theme-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Deselect All
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto">
          {chartData.events.map((event) => {
            const isSelected = selectedEvents.has(event);
            return (
              <label
                key={event}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleEventToggle(event)}
                  className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <span
                  className={`text-theme-xs ${
                    isSelected
                      ? "text-gray-900 dark:text-white font-medium"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {event}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      {eventsToShow.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400 border border-gray-200 rounded-lg dark:border-gray-800">
          Please select at least one event to display
        </div>
      ) : (
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData.data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
          <XAxis
            dataKey="date"
            className="text-gray-600 dark:text-gray-400"
            tick={{ fill: "currentColor" }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            className="text-gray-600 dark:text-gray-400"
            tick={{ fill: "currentColor" }}
            tickFormatter={(value) => secondsToTime(value)}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              
              const isDark = document.documentElement.classList.contains('dark');
              
              return (
                <div
                  className="rounded-lg border p-3 shadow-lg"
                  style={{
                    backgroundColor: isDark ? "rgb(31, 41, 55)" : "rgb(255, 255, 255)",
                    borderColor: isDark ? "rgb(55, 65, 81)" : "rgb(229, 231, 235)",
                  }}
                >
                  <p
                    className="mb-2 font-medium"
                    style={{ color: isDark ? "rgb(243, 244, 246)" : "#111827" }}
                  >
                    {label}
                  </p>
                  {payload.map((entry: any, index: number) => (
                    <p
                      key={index}
                      className="text-sm"
                      style={{ color: entry.color || (isDark ? "rgb(209, 213, 219)" : "#374151") }}
                    >
                      {entry.name}: {secondsToTime(entry.value as number)}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            className="text-gray-600 dark:text-gray-400"
          />
          {eventsToShow.map((event, index) => (
            <Line
              key={event}
              type="monotone"
              dataKey={event}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name={event}
            />
          ))}
        </LineChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

