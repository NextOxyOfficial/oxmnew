import React from "react";
import Pagination from "@/components/ui/Pagination";

interface SmsHistoryItem {
  id: number;
  sent_at: string;
  recipient: string;
  message: string;
  status: string;
  sms_count: number;
  user?: number;
}

interface SmsHistoryResponse {
  results: SmsHistoryItem[];
  count: number;
  current_page: number;
  total_pages: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

interface SmsHistoryProps {
  historyData: SmsHistoryResponse;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

const statusLabel = (status: string) => {
  if (status === "sent") return "গেছে";
  if (status === "failed") return "যায়নি";
  if (status === "pending") return "পেন্ডিং";
  return status || "জানা নেই";
};

const statusBadge = (status: string) => {
  if (status === "sent") return "badge badge-success";
  if (status === "failed") return "badge badge-danger";
  return "badge badge-warn";
};

const SmsHistory: React.FC<SmsHistoryProps> = ({ historyData, currentPage, onPageChange, isLoading }) => {
  const history = historyData?.results || [];

  return (
    <>
      <div className="plane-section">
        <div className="section-title">পাঠানো এসএমএসের হিস্ট্রি</div>
      </div>

      {isLoading ? (
        <div className="empty">এসএমএসের হিস্ট্রি লোড হচ্ছে…</div>
      ) : history.length === 0 ? (
        <div className="empty">এখনো কোনো এসএমএস পাঠানো হয়নি।</div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>সময়</th>
                <th>যাকে পাঠানো হয়েছে</th>
                <th className="cell-num">অক্ষর / এসএমএস</th>
                <th>মেসেজ</th>
                <th>অবস্থা</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td className="whitespace-nowrap">
                    {h.sent_at ? (
                      <div>
                        <div className="num">{new Date(h.sent_at).toLocaleDateString()}</div>
                        <div className="num text-xs text-slate-500">{new Date(h.sent_at).toLocaleTimeString()}</div>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="cell-strong num">{h.recipient || '—'}</td>
                  <td className="cell-num">
                    {(h.message || '').length} / {h.sms_count || 1}
                  </td>
                  <td className="max-w-xs break-words">{h.message || ''}</td>
                  <td>
                    <span className={statusBadge(h.status)}>
                      {statusLabel(h.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls — pages are served by the API, so only the page number changes */}
      {!isLoading && historyData && (
        <div className="plane-section">
          <Pagination
            currentPage={currentPage}
            totalPages={historyData.total_pages || 1}
            totalItems={historyData.count || 0}
            itemsPerPage={historyData.page_size || history.length || 1}
            onPageChange={onPageChange}
            onPageSizeChange={() => {
              // Page size is decided by the API for this list
            }}
          />
        </div>
      )}
    </>
  );
};

export default SmsHistory;
