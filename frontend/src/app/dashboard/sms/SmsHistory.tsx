import React from "react";

interface SmsHistoryItem {
  id: number;
  time: string;
  contacts: number;
  smsCount: number;
  text: string;
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
          <th className="py-2 px-2">Contact Count</th>
          <th className="py-2 px-2">SMS Count</th>
          <th className="py-2 px-2">Text</th>
        </tr>
      </thead>
      <tbody>
        {history.map(h => (
          <tr key={h.id} className="border-b border-slate-800 hover:bg-slate-800/40">
            <td className="py-2 px-2 whitespace-nowrap">{h.time}</td>
            <td className="py-2 px-2">{h.contacts}</td>
            <td className="py-2 px-2">{h.smsCount}</td>
            <td className="py-2 px-2 break-all max-w-xs">{h.text}</td>
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
