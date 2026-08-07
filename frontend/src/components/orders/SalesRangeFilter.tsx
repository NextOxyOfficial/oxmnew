"use client";

import React from "react";

/**
 * The sales window and the report that follows it.
 *
 * Kept separate from OrdersControls because it sits on the tab row — the range
 * applies to whichever tab is open, so it belongs above them, not inside the
 * orders list toolbar.
 */
interface SalesRangeFilterProps {
  /** Empty strings mean "everything". */
  dateFrom: string;
  dateTo: string;
  onDateChange: (from: string, to: string) => void;
  onDownloadReport: () => void;
}

const SalesRangeFilter: React.FC<SalesRangeFilterProps> = ({
  dateFrom,
  dateTo,
  onDateChange,
  onDownloadReport,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <label className="label mb-0 shrink-0" htmlFor="orders-from">
      শুরু
    </label>
    <input
      id="orders-from"
      type="date"
      value={dateFrom}
      max={dateTo || undefined}
      onChange={(e) => onDateChange(e.target.value, dateTo)}
      className="input input-sm w-auto"
    />
    <label className="label mb-0 shrink-0" htmlFor="orders-to">
      শেষ
    </label>
    <input
      id="orders-to"
      type="date"
      value={dateTo}
      min={dateFrom || undefined}
      onChange={(e) => onDateChange(dateFrom, e.target.value)}
      className="input input-sm w-auto"
    />
    {(dateFrom || dateTo) && (
      <button
        type="button"
        onClick={() => onDateChange("", "")}
        className="btn btn-ghost btn-sm"
      >
        সব সময়
      </button>
    )}
    <button
      type="button"
      onClick={onDownloadReport}
      className="btn btn-ghost btn-sm"
    >
      রিপোর্ট নামান
    </button>
  </div>
);

export default SalesRangeFilter;
