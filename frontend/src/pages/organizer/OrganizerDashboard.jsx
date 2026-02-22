import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    api.get("/events/organizer/mine/list").then(async (res) => {
      setEvents(res.data.events);
      const completed = res.data.events.filter((e) => e.status === "COMPLETED");
      const s = await Promise.all(
        completed.map((e) => api.get(`/events/organizer/${e._id}/analytics`).then((x) => ({ event: e.name, ...x.data })))
      );
      setStats(s);
    });
  }, []);

  return (
    <main style={{ padding: 16 }}>
      <h2>Organizer Dashboard</h2>
      <p>
        <Link to="/organizer/merch-orders">Merch Payment Approvals</Link> |{" "}
        <Link to="/organizer/reset-requests">Password Reset Workflow</Link>
      </p>
      <h3>Events Carousel (Card List)</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {events.map((e) => (
          <div key={e._id} style={{ border: "1px solid #ddd", padding: 8 }}>
            <b>{e.name}</b> | {e.eventType} | {e.status} | <Link to={`/organizer/events/${e._id}`}>Manage</Link>
          </div>
        ))}
      </div>

      <h3>Completed Event Analytics</h3>
      <ul>
        {stats.map((s) => (
          <li key={s.event}>{s.event} - regs:{s.registrations}, attendance:{s.attendance}, revenue:{s.revenue}</li>
        ))}
      </ul>
    </main>
  );
}
