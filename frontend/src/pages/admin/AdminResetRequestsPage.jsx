import { useEffect, useState } from "react";
import api from "../../api";

export default function AdminResetRequestsPage() {
  const [requests, setRequests] = useState([]);

  const load = () => api.get("/admin/reset-requests").then((res) => setRequests(res.data.requests));

  useEffect(() => {
    load();
  }, []);

  const decide = async (id, status) => {
    const adminComment = prompt("Comment for organizer") || "";
    await api.patch(`/admin/reset-requests/${id}`, { status, adminComment });
    load();
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>Password Reset Requests</h2>
      <ul>
        {requests.map((r) => (
          <li key={r._id}>
            {r.organizerName} | {new Date(r.createdAt).toLocaleString()} | {r.reason} | {r.status}
            {r.status === "PENDING" && (
              <>
                <button onClick={() => decide(r._id, "APPROVED")}>Approve</button>
                <button onClick={() => decide(r._id, "REJECTED")}>Reject</button>
              </>
            )}
            {r.generatedPassword && <strong> New password: {r.generatedPassword}</strong>}
          </li>
        ))}
      </ul>
    </main>
  );
}
