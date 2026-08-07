'use client';

import { useState, useEffect } from 'react';
import { ApiService } from '@/lib/api';
import { useToast, useConfirm } from '@/components/ui/Feedback';

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
  record_type: string;
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

export default function CustomDomainSettings({ loading, onSave }: CustomDomainSettingsProps) {
  const toast = useToast();
  const confirm = useConfirm();

  const [settings, setSettings] = useState<CustomDomainSettings>({
    customDomain: '',
    isConfigured: false
  });

  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);

  const [newRecord, setNewRecord] = useState<Omit<DNSRecord, 'id'>>({
    record_type: 'A',
    name: '',
    value: '',
    ttl: 3600
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Nameservers that users need to point their domain to
  const nameservers = [
    'ns1.oxymanager.com',
    'ns2.oxymanager.com'
  ];

  // Load existing domain settings
  useEffect(() => {
    loadDomainSettings();
  }, []);

  const loadDomainSettings = async () => {
    setIsLoading(true);
    try {
      const response = await ApiService.get('/custom-domain/');
      if (response.custom_domain) {
        setSettings({
          customDomain: response.custom_domain.domain,
          isConfigured: response.custom_domain.is_active
        });
        setDnsRecords(response.dns_records || []);
      }
    } catch (error) {
      console.error('Error loading domain settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings.customDomain.trim()) {
      toast.error('ডোমেইনের নামটা লিখুন');
      return;
    }

    setIsSaving(true);
    try {
      const domainData = {
        domain: settings.customDomain
      };

      await ApiService.post('/custom-domain/', domainData);
      await loadDomainSettings(); // Reload the settings
      setIsEditing(false);

      // Call the parent onSave if needed
      await onSave(settings);
    } catch (error) {
      console.error('Error saving custom domain settings:', error);
      toast.error('ডোমেইনের সেটিংস সেভ করা গেল না। আরেকবার চেষ্টা করুন।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadDomainSettings(); // Reload to reset any unsaved changes
  };

  const addDnsRecord = async () => {
    if (!newRecord.name || !newRecord.value) {
      toast.error('DNS রেকর্ডের সব ঘর পূরণ করুন');
      return;
    }

    try {
      await ApiService.post('/dns-records/', newRecord);
      await loadDomainSettings(); // Reload to get updated records
      setNewRecord({
        record_type: 'A',
        name: '',
        value: '',
        ttl: 3600
      });
    } catch (error) {
      console.error('Error adding DNS record:', error);
      toast.error('DNS রেকর্ড যোগ করা গেল না। আরেকবার চেষ্টা করুন।');
    }
  };

  const deleteDnsRecord = async (id: number) => {
    const ok = await confirm({
      title: 'DNS রেকর্ড ডিলিট করবেন?',
      message: 'এই DNS রেকর্ডটা ডিলিট করে দেবেন?',
      confirmLabel: 'ডিলিট করুন',
      danger: true
    });
    if (!ok) {
      return;
    }

    try {
      await ApiService.delete(`/dns-records/${id}/delete/`);
      await loadDomainSettings(); // Reload to get updated records
    } catch (error) {
      console.error('Error deleting DNS record:', error);
      toast.error('DNS রেকর্ড ডিলিট করা গেল না। আরেকবার চেষ্টা করুন।');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('কপি হয়ে গেছে!');
  };

  const deleteDomain = async () => {
    const ok = await confirm({
      title: 'ডোমেইন ডিলিট করবেন?',
      message: 'এই ডোমেইনটা ডিলিট করে দেবেন? একবার মুছলে আর ফেরত আসবে না।',
      confirmLabel: 'ডিলিট করুন',
      danger: true
    });
    if (ok) {
      try {
        await ApiService.delete('/custom-domain/delete/');
        setSettings({
          customDomain: '',
          isConfigured: false
        });
        setDnsRecords([]);
      } catch (error) {
        console.error('Error deleting domain:', error);
        toast.error('ডোমেইন ডিলিট করা গেল না। আরেকবার চেষ্টা করুন।');
      }
    }
  };

  return (
    <>
      <div className="plane-section">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="section-title">নিজের ডোমেইন</div>
            <p className="text-xs text-slate-500">
              নিজের ডোমেইন আর DNS সেটিংস এখানে ঠিক করুন
              {isLoading ? ' — লোড হচ্ছে…' : ''}
            </p>
          </div>
          {!isEditing && !settings.isConfigured && (
            <button onClick={() => setIsEditing(true)} className="btn btn-primary btn-sm">
              ডোমেইন যোগ করুন
            </button>
          )}
          {settings.isConfigured && (
            <span className="badge badge-success">সেট করা আছে</span>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="plane-section">
          <label className="label" htmlFor="custom-domain">ডোমেইনের নাম *</label>
          <input
            id="custom-domain"
            type="text"
            value={settings.customDomain}
            onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
            className="input max-w-md"
            placeholder="যেমন: yourdomain.com"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            www বা https:// ছাড়া শুধু ডোমেইনের নামটা লিখুন
          </p>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button onClick={handleCancel} className="btn btn-ghost">
              বাতিল
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || loading}
              className="btn btn-primary"
            >
              {isSaving ? 'সেভ হচ্ছে…' : 'ডোমেইন সেভ করুন'}
            </button>
          </div>
        </div>
      ) : settings.isConfigured ? (
        <>
          <div className="plane-section">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-slate-500">এখনকার ডোমেইন</div>
                <p className="truncate text-base font-medium text-cyan-600" title={settings.customDomain}>
                  {settings.customDomain}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsEditing(true)} className="btn btn-ghost btn-sm">
                  এডিট করুন
                </button>
                <button
                  onClick={deleteDomain}
                  className="btn btn-danger btn-sm"
                  title="ডোমেইন ডিলিট করুন"
                  aria-label="ডোমেইন ডিলিট করুন"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  ডিলিট
                </button>
              </div>
            </div>
          </div>

          <div className="plane-section">
            <div className="section-title">যে নেমসার্ভার দিতে হবে</div>
            <p className="mb-3 text-xs text-slate-500">
              যেখান থেকে ডোমেইন কিনেছেন সেখানে গিয়ে এই নেমসার্ভারগুলো বসিয়ে দিন:
            </p>
            <div className="space-y-2">
              {nameservers.map((ns, index) => (
                <div key={index} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="truncate font-mono text-sm text-slate-600">{ns}</span>
                  <button onClick={() => copyToClipboard(ns)} className="btn btn-ghost btn-sm">
                    কপি
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="plane-section">
            <div className="section-title">DNS রেকর্ড</div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <select
                value={newRecord.record_type}
                onChange={(e) => setNewRecord({ ...newRecord, record_type: e.target.value })}
                className="select"
                aria-label="রেকর্ডের টাইপ"
              >
                <option value="A">A</option>
                <option value="AAAA">AAAA</option>
                <option value="CNAME">CNAME</option>
                <option value="MX">MX</option>
                <option value="TXT">TXT</option>
              </select>
              <input
                type="text"
                value={newRecord.name}
                onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                placeholder="নাম"
                aria-label="রেকর্ডের নাম"
                className="input"
              />
              <input
                type="text"
                value={newRecord.value}
                onChange={(e) => setNewRecord({ ...newRecord, value: e.target.value })}
                placeholder="মান"
                aria-label="রেকর্ডের মান"
                className="input"
              />
              <button onClick={addDnsRecord} className="btn btn-primary">
                যোগ করুন
              </button>
            </div>
          </div>

          {dnsRecords.length === 0 ? (
            <div className="empty">এখনো কোনো DNS রেকর্ড যোগ করা হয়নি।</div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>টাইপ</th>
                    <th>নাম</th>
                    <th>মান</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {dnsRecords.map((record) => (
                    <tr key={record.id}>
                      <td><span className="badge badge-info">{record.record_type}</span></td>
                      <td className="cell-strong font-mono">{record.name}</td>
                      <td className="break-all font-mono">{record.value}</td>
                      <td className="text-right">
                        <button onClick={() => deleteDnsRecord(record.id)} className="btn btn-danger btn-sm">
                          ডিলিট
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="empty">
          <div className="mb-1 font-medium text-slate-600">এখনো কোনো ডোমেইন সেট করা হয়নি</div>
          <div>&ldquo;ডোমেইন যোগ করুন&rdquo; চেপে নিজের ডোমেইনটা বসিয়ে নিন</div>
        </div>
      )}
    </>
  );
}
