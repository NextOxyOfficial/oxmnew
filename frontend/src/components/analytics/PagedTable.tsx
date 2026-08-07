"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Pagination from "@/components/ui/Pagination";

interface Props<T> {
  rows: T[];
  head: ReactNode;
  renderRow: (row: T, index: number) => ReactNode;
  /** Below this many rows the pager is noise, so it stays hidden. */
  pageSize?: number;
  empty?: ReactNode;
}

/**
 * A table that pages itself once it outgrows the screen.
 *
 * The analytics sections all render lists that can be three rows or three
 * hundred depending on the shop, so each one gets the same pager instead of a
 * hard-coded "top 6" that quietly hides the rest.
 */
export default function PagedTable<T>({
  rows,
  head,
  renderRow,
  pageSize = 8,
  empty,
}: Props<T>) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(pageSize);

  // A shorter list can strand the viewer on a page that no longer exists.
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visible = useMemo(
    () => rows.slice((page - 1) * perPage, page * perPage),
    [rows, page, perPage]
  );

  if (rows.length === 0) {
    return <div className="empty">{empty ?? "দেখানোর মতো কিছু নেই।"}</div>;
  }

  return (
    <>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>{head}</thead>
          <tbody>{visible.map((row, index) => renderRow(row, index))}</tbody>
        </table>
      </div>

      {rows.length > perPage && (
        <div className="mt-3">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={rows.length}
            itemsPerPage={perPage}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPerPage(size);
              setPage(1);
            }}
          />
        </div>
      )}
    </>
  );
}
