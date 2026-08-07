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
    { value: "today", label: "আজ" },
    { value: "yesterday", label: "গতকাল" },
    { value: "this_week", label: "এই সপ্তাহ" },
    { value: "last_week", label: "গত সপ্তাহ" },
    { value: "this_month", label: "এই মাস" },
    { value: "last_month", label: "গত মাস" },
    { value: "all_time", label: "সব সময়" },
    { value: "custom", label: "তারিখ বেছে নিন" },
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
    <div className="relative" ref={dropdownRef}>
      <button
        className={`btn btn-ghost ${isMobile ? "btn-sm" : ""}`}
        onClick={toggleDropdown}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="whitespace-nowrap">{currentFilterLabel}</span>
        <svg
          className="w-4 h-4 text-slate-400"
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
          role="menu"
          className={`absolute right-0 mt-2 ${
            isMobile ? "w-56 min-w-max" : "w-48"
          } bg-white rounded-lg border border-slate-200 shadow-lg z-20 py-1`}
        >
          {filterOptions.map((option) => (
            <button
              key={option.value}
              role="menuitem"
              className={`flex h-9 w-full items-center gap-2 px-3 text-left text-[13px] transition-colors whitespace-nowrap ${
                currentFilter === option.value
                  ? "bg-cyan-50 text-cyan-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              onClick={() => handleFilterSelect(option.value, option.label)}
            >
              {option.value === "custom" && (
                <svg
                  className="w-3.5 h-3.5 text-slate-400"
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
