import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

export default function ParticipantDashboard() {
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    api.get("/events/participant/my-registrations").then((res) => setRegistrations(res.data.registrations));
  }, []);

  const now = Number(new Date());
  const upcoming = registrations.filter((r) => new Date(r.eventId?.eventStartDate).getTime() > now);

  const tabs = useMemo(
    () => ({
      Normal: registrations.filter((r) => r.eventType === "NORMAL"),
      Merchandise: registrations.filter((r) => r.eventType === "MERCHANDISE"),
      Completed: registrations.filter((r) => r.status === "SUCCESSFUL" || r.status === "REGISTERED"),
      "Cancelled/Rejected": registrations.filter((r) => ["CANCELLED", "REJECTED"].includes(r.status)),
    }),
    [registrations]
  );

  return (
    <main style={{ padding: 16 }}>
      <h2>My Events Dashboard</h2>
      <h3>Upcoming Events</h3>
      <ul>
        {upcoming.map((r) => (
          <li key={r._id}>
            {r.eventId?.name} | {r.eventType} | {r.organizerId?.organizerName} | {new Date(r.eventId?.eventStartDate).toLocaleString()} | Ticket: {r.ticketId || "Pending"}
          </li>
        ))}
      </ul>

      <h3>Participation History</h3>
      {Object.entries(tabs).map(([name, items]) => (
        <section key={name} style={{ marginBottom: 16 }}>
          <h4>{name}</h4>
          <ul>
            {items.map((r) => (
              <li key={r._id}>
                <Link to={`/events/${r.eventId?._id}`}>{r.eventId?.name}</Link> | {r.status} | Ticket: {r.ticketId || "N/A"}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
