import { useEffect, useState } from "react";
import api from "../../api";

export default function AdminOrganizersPage() {
  const [form, setForm] = useState({ organizerName: "", category: "", description: "", contactEmail: "", contactPhone: "" });
  const [organizers, setOrganizers] = useState([]);
  const [credentials, setCredentials] = useState(null);

  const load = () => api.get("/admin/organizers").then((res) => setOrganizers(res.data.organizers));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const res = await api.post("/admin/organizers", form);
    setCredentials(res.data.credentials);
    setForm({ organizerName: "", category: "", description: "", contactEmail: "", contactPhone: "" });
    load();
  };

  const disable = async (id, action = "disable") => {
    await api.patch(`/admin/organizers/${id}/disable`, { action });
    load();
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>Manage Clubs / Organizers</h2>
      <div style={{ display: "grid", gap: 8, maxWidth: 500 }}>
        <input placeholder="Organizer Name" value={form.organizerName} onChange={(e) => setForm({ ...form, organizerName: e.target.value })} />
        <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input placeholder="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        <input placeholder="Contact Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
        <button onClick={create}>Add Organizer</button>
      </div>

      {credentials && (
        <p>
          Generated credentials → Email: {credentials.email} | Password: {credentials.password}
        </p>
      )}

      <ul>
        {organizers.map((o) => (
          <li key={o._id}>
            {o.organizerName} | {o.category} | disabled: {String(o.disabled)} | archived: {String(o.archived)}
            <button onClick={() => disable(o._id, "disable")}>Disable</button>
            <button onClick={() => disable(o._id, "archive")}>Archive</button>
            <button onClick={() => disable(o._id, "delete")}>Delete</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
