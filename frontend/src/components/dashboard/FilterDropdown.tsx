"use client";

import { useEffect, useRef, useState } from "react";

interface FilterDropdownProps {
  currentFilter: string;
  currentFilterLabel: string;
  onFilterChange: (filter: string, label: string) => void;
  onCustomDateRange: () => void;
  isMobile?: boolean;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  currentFilter,
  currentFilterLabel,
  onFilterChange,
  onCustomDateRange,
  isMobile = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filterOptions = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "this_week", label: "This Week" },
    { value: "last_week", label: "Last Week" },
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "custom", label: "Custom Date Range" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterSelect = (filter: string, label: string) => {
    console.log("FilterDropdown: Filter selected:", filter, label);
    setIsOpen(false);

    if (filter === "custom") {
      onCustomDateRange();
    } else {
      onFilterChange(filter, label);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${isMobile ? "flex-1" : ""}`} ref={dropdownRef}>
      <button
        className={`${
          isMobile ? "w-full px-3 py-2 text-sm" : "px-4 py-2 text-sm"
        } bg-white/3 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center ${
          isMobile ? "justify-center" : ""
        } cursor-pointer`}
        onClick={toggleDropdown}
        type="button"
      >
        <span>{currentFilterLabel}</span>
        <svg
          className="w-4 h-4 ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute ${isMobile ? "right-0" : "right-0"} mt-2 ${
            isMobile ? "w-full" : "w-48"
          } bg-gray-800 rounded-lg border border-gray-700 shadow-lg z-10 py-1`}
        >
          {filterOptions.map((option) => (
            <button
              key={option.value}
              className={`block w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                currentFilter === option.value
                  ? "text-blue-300 bg-blue-900/50"
                  : "text-white hover:bg-gray-700"
              } ${option.value === "custom" ? "flex items-center" : ""}`}
              onClick={() => handleFilterSelect(option.value, option.label)}
            >
              {option.value === "custom" && (
                <svg
                  className="w-3 h-3 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
