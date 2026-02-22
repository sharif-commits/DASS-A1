import { useEffect, useState } from "react";
import api from "../../api";

export default function MerchOrdersPage() {
  const [orders, setOrders] = useState([]);

  const load = () => api.get("/events/organizer/merch-orders/list").then((res) => setOrders(res.data.orders));

  useEffect(() => {
    load();
  }, []);

  const decide = async (id, decision) => {
    await api.patch(`/events/organizer/merch-orders/${id}/decision`, { decision });
    load();
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>Merchandise Payment Approval</h2>
      <ul>
        {orders.map((o) => (
          <li key={o._id}>
            {o.eventId?.name} | {o.participantId?.email} | {o.status} | proof: {o.merchSelection?.proofImageUrl}
            {o.status === "PENDING_APPROVAL" && (
              <>
                <button onClick={() => decide(o._id, "APPROVE")}>Approve</button>
                <button onClick={() => decide(o._id, "REJECT")}>Reject</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
