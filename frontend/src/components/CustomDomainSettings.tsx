'use client';

import { useState } from 'react';

interface CustomDomainSettingsProps {
  loading: boolean;
  onSave: (settings: CustomDomainSettings) => Promise<void>;
}

interface CustomDomainSettings {
  customDomain: string;
  isConfigured: boolean;
}

interface DNSRecord {
  id: number;
  type: string;
  name: string;
  value: string;
  ttl: number;
}

export default function CustomDomainSettings({ loading, onSave }: CustomDomainSettingsProps) {
  const [settings, setSettings] = useState<CustomDomainSettings>({
    customDomain: '',
    isConfigured: false
  });

  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([
    { id: 1, type: 'A', name: '@', value: '192.168.1.1', ttl: 3600 },
    { id: 2, type: 'CNAME', name: 'www', value: 'yourdomain.com', ttl: 3600 }
  ]);

  const [newRecord, setNewRecord] = useState<Omit<DNSRecord, 'id'>>({
    type: 'A',
    name: '',
    value: '',
    ttl: 3600
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Nameservers that users need to point their domain to
  const nameservers = [
    'ns1.yourplatform.com',
    'ns2.yourplatform.com'
  ];

  const handleSave = async () => {
    if (!settings.customDomain.trim()) {
      alert('Please enter a domain name');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(settings);
      setIsEditing(false);
      setSettings({ ...settings, isConfigured: true });
    } catch (error) {
      console.error('Error saving custom domain settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const addDnsRecord = () => {
    if (!newRecord.name || !newRecord.value) {
      alert('Please fill in all DNS record fields');
      return;
    }

    const record: DNSRecord = {
      id: Date.now(),
      ...newRecord
    };

    setDnsRecords([...dnsRecords, record]);
    setNewRecord({
      type: 'A',
      name: '',
      value: '',
      ttl: 3600
    });
  };

  const deleteDnsRecord = (id: number) => {
    setDnsRecords(dnsRecords.filter(record => record.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const deleteDomain = () => {
    if (confirm('Are you sure you want to delete this custom domain? This action cannot be undone.')) {
      setSettings({
        customDomain: '',
        isConfigured: false
      });
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-medium text-white mb-2">Custom Domain Setup</h4>
          <p className="text-sm text-gray-400">
            Configure your custom domain and DNS settings
          </p>
        </div>
        {!isEditing && !settings.isConfigured && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg cursor-pointer"
          >
            Add Domain
          </button>
        )}
        {settings.isConfigured && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-400/30">
            Configured
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-6">
          {/* Domain Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Domain Name
            </label>
            <input
              type="text"
              value={settings.customDomain}
              onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm"
              placeholder="e.g., yourdomain.com"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter your domain name without www or protocol
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-white/10 text-gray-300 text-sm font-medium rounded-lg hover:bg-white/20 border border-white/20 transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Domain'}
            </button>
          </div>
        </div>
      ) : settings.isConfigured ? (
        <div className="space-y-6">
          {/* Configured Domain */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-white mb-1">Current Domain</h5>
                <p className="text-lg text-blue-400 font-medium">{settings.customDomain}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 bg-white/10 text-gray-300 text-sm font-medium rounded-lg hover:bg-white/20 border border-white/20 transition-all duration-200 cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={deleteDomain}
                  className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 border border-red-400/30 transition-all duration-200 cursor-pointer"
                  title="Delete domain"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Nameservers */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h5 className="text-sm font-medium text-white mb-3">Required Nameservers</h5>
            <p className="text-xs text-gray-400 mb-3">
              Point your domain to these nameservers at your domain registrar:
            </p>
            <div className="space-y-2">
              {nameservers.map((ns, index) => (
                <div key={index} className="flex items-center justify-between bg-white/5 rounded-md p-2">
                  <span className="text-sm text-gray-300 font-mono">{ns}</span>
                  <button
                    onClick={() => copyToClipboard(ns)}
                    className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded hover:bg-blue-500/30 transition-colors cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* DNS Records Management */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h5 className="text-sm font-medium text-white mb-3">DNS Records</h5>
            
            {/* Add New Record */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <select
                value={newRecord.type}
                onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
                className="px-2 py-2 bg-white/10 border border-white/20 rounded text-white text-xs backdrop-blur-sm"
              >
                <option value="A" className="bg-gray-800">A</option>
                <option value="AAAA" className="bg-gray-800">AAAA</option>
                <option value="CNAME" className="bg-gray-800">CNAME</option>
                <option value="MX" className="bg-gray-800">MX</option>
                <option value="TXT" className="bg-gray-800">TXT</option>
              </select>
              <input
                type="text"
                value={newRecord.name}
                onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                placeholder="Name"
                className="px-2 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 text-xs backdrop-blur-sm"
              />
              <input
                type="text"
                value={newRecord.value}
                onChange={(e) => setNewRecord({ ...newRecord, value: e.target.value })}
                placeholder="Value"
                className="px-2 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 text-xs backdrop-blur-sm"
              />
              <button
                onClick={addDnsRecord}
                className="px-2 py-2 bg-green-500/20 text-green-300 text-xs rounded hover:bg-green-500/30 border border-green-400/30 transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* DNS Records List */}
            <div className="space-y-2">
              {dnsRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between bg-white/5 rounded-md p-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-400/30">
                      {record.type}
                    </span>
                    <span className="text-sm text-gray-300 font-mono">{record.name}</span>
                    <span className="text-sm text-gray-400">→</span>
                    <span className="text-sm text-gray-300 font-mono">{record.value}</span>
                  </div>
                  <button
                    onClick={() => deleteDnsRecord(record.id)}
                    className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded hover:bg-red-500/30 border border-red-400/30 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <div className="mb-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
            </div>
            <p className="text-sm">No custom domain configured</p>
            <p className="text-xs text-gray-500 mt-1">Click "Add Domain" to configure your custom domain</p>
          </div>
        </div>
      )}
    </div>
  );
}