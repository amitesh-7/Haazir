import React, { useEffect, useState } from 'react';
import { api, getProfile } from '../services/api';

const StudentProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', contact_number: '', parent_name: '', parent_contact: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        setProfile(data.user);
        const s = data.user?.student || data.user?.profile || null;
        if (s) {
          setForm({
            name: s.name || '',
            contact_number: s.contact_number || '',
            parent_name: s.parent_name || '',
            parent_contact: s.parent_contact || '',
            address: s.address || '',
          });
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setError(null);
    setMessage(null);
    try {
      setSaving(true);
      await api.put('/students/me/profile', form);
      setMessage('Profile updated');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Student Profile</h1>
      <div className="bg-white rounded shadow p-4 space-y-2 max-w-xl">
        {message && <div className="text-green-600">{message}</div>}
        <input className="border rounded px-2 py-1 w-full" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="border rounded px-2 py-1 w-full" placeholder="Contact Number" value={form.contact_number} onChange={e => setForm({ ...form, contact_number: e.target.value })} />
        <input className="border rounded px-2 py-1 w-full" placeholder="Parent Name" value={form.parent_name} onChange={e => setForm({ ...form, parent_name: e.target.value })} />
        <input className="border rounded px-2 py-1 w-full" placeholder="Parent Contact" value={form.parent_contact} onChange={e => setForm({ ...form, parent_contact: e.target.value })} />
        <input className="border rounded px-2 py-1 w-full" placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default StudentProfile;
