import { useEffect, useState } from "react";
import api from "../../api";

export default function ResetRequestPage() {
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState([]);

  const load = () => api.get("/events/organizer/reset-request/mine").then((res) => setRequests(res.data.requests));
  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    await api.post("/events/organizer/reset-request", { reason });
    setReason("");
    load();
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>Organizer Password Reset Request</h2>
      <textarea placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      <button onClick={submit}>Submit Request</button>
      <ul>
        {requests.map((r) => (
          <li key={r._id}>{r.createdAt} | {r.reason} | {r.status} | {r.adminComment || "-"}</li>
        ))}
      </ul>
    </main>
  );
}
