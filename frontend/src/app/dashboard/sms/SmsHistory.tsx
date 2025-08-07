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

interface SmsHistoryProps {
  history: SmsHistoryItem[];
}

const SmsHistory: React.FC<SmsHistoryProps> = ({ history }) => (
  <div className="bg-slate-900/70 border border-slate-700/50 rounded-xl p-6 mt-8">
    <h2 className="text-lg font-bold text-slate-200 mb-4">Sent SMS History</h2>
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
    {history.length === 0 && (
      <div className="text-center text-slate-400 py-8">No SMS history found.</div>
    )}
  </div>
);

export default SmsHistory;
