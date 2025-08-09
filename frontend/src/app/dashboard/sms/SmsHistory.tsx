import React from "react";

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

const SmsHistory: React.FC<SmsHistoryProps> = ({ historyData, currentPage, onPageChange, isLoading }) => {
  const history = historyData?.results || [];
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const totalPages = historyData?.total_pages || 1;
    const pages = [];
    
    // Show up to 5 page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="bg-slate-900/70 border border-slate-700/50 rounded-xl p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-200">Sent SMS History</h2>
        {historyData && (
          <div className="text-sm text-slate-400">
            Showing {history.length} of {historyData.count} total entries
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-slate-400">Loading SMS history...</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-200 text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="py-2 px-2">Time</th>
                  <th className="py-2 px-2">Recipient</th>
                  <th className="py-2 px-2">SMS Count (chars/messages)</th>
                  <th className="py-2 px-2">Message</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                    <td className="py-2 px-2 whitespace-nowrap">
                      {h.sent_at ? (
                        <div>
                          <div>{new Date(h.sent_at).toLocaleDateString()}</div>
                          <div className="text-xs text-slate-400">{new Date(h.sent_at).toLocaleTimeString()}</div>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="py-2 px-2">{h.recipient || 'N/A'}</td>
                    <td className="py-2 px-2">
                      {(h.message || '').length} chars / {h.sms_count || 1} SMS
                    </td>
                    <td className="py-2 px-2 break-all max-w-xs">{h.message || ''}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        h.status === 'sent' ? 'bg-green-500/20 text-green-400' : 
                        h.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {h.status || 'unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {history.length === 0 && (
            <div className="text-center text-slate-400 py-8">No SMS history found.</div>
          )}
          
          {/* Pagination Controls */}
          {historyData && historyData.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
              <div className="text-sm text-slate-400">
                Page {historyData.current_page} of {historyData.total_pages}
              </div>
              
              <div className="flex items-center space-x-1">
                {/* Previous Button */}
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={!historyData.has_previous}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    historyData.has_previous
                      ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                {getPageNumbers().map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-1 rounded text-sm transition-colors cursor-pointer ${
                      pageNum === currentPage
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                
                {/* Next Button */}
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={!historyData.has_next}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    historyData.has_next
                      ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SmsHistory;
