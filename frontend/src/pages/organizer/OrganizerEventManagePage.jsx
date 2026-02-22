import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

export default function OrganizerEventManagePage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [status, setStatus] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [attendance, setAttendance] = useState(null);

  const load = useCallback(async () => {
    const [ev, part, an, ad] = await Promise.all([
      api.get(`/events/${eventId}`),
      api.get(`/events/organizer/${eventId}/participants`),
      api.get(`/events/organizer/${eventId}/analytics`),
      api.get(`/events/organizer/${eventId}/attendance/dashboard`),
    ]);
    setEvent(ev.data.event);
    setParticipants(part.data.registrations);
    setAnalytics(an.data);
    setAttendance(ad.data);
  }, [eventId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [ev, part, an, ad] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/organizer/${eventId}/participants`),
        api.get(`/events/organizer/${eventId}/analytics`),
        api.get(`/events/organizer/${eventId}/attendance/dashboard`),
      ]);
      if (!active) return;
      setEvent(ev.data.event);
      setParticipants(part.data.registrations);
      setAnalytics(an.data);
      setAttendance(ad.data);
    })();

    return () => {
      active = false;
    };
  }, [eventId]);

  const updateStatus = async () => {
    await api.patch(`/events/organizer/${eventId}`, { status });
    load();
  };

  const scan = async () => {
    await api.post(`/events/organizer/${eventId}/attendance/scan`, { ticketId });
    setTicketId("");
    load();
  };

  if (!event) return <p>Loading...</p>;

  return (
    <main style={{ padding: 16 }}>
      <h2>{event.name} (Organizer View)</h2>
      <p>Type: {event.eventType}</p>
      <p>Status: {event.status}</p>
      <p>Dates: {new Date(event.eventStartDate).toLocaleString()} - {new Date(event.eventEndDate).toLocaleString()}</p>
      <p>Eligibility: {event.eligibility}</p>
      <p>Pricing: ₹{event.registrationFee}</p>

      <section>
        <h3>Edit / Status Actions</h3>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Choose status</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="ONGOING">ONGOING</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <button onClick={updateStatus}>Update</button>
      </section>

      <section>
        <h3>Analytics</h3>
        {analytics && <p>Registrations: {analytics.registrations} | Attendance: {analytics.attendance} | Revenue: {analytics.revenue}</p>}
      </section>

      <section>
        <h3>Participants</h3>
        <a href={`${(import.meta.env.VITE_API_URL || "http://localhost:5000/api")}/events/organizer/${eventId}/participants.csv`} target="_blank">Export CSV</a>
        <ul>
          {participants.map((p) => (
            <li key={p._id}>{p.participantId?.firstName} {p.participantId?.lastName} | {p.participantId?.email} | {p.status} | {p.ticketId || "N/A"}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>QR Scan & Attendance</h3>
        <input placeholder="Ticket ID" value={ticketId} onChange={(e) => setTicketId(e.target.value)} />
        <button onClick={scan}>Mark Attendance</button>
        {attendance && <p>Scanned: {attendance.scannedCount} | Pending: {attendance.pendingCount}</p>}
        <a href={`${(import.meta.env.VITE_API_URL || "http://localhost:5000/api")}/events/organizer/${eventId}/attendance.csv`} target="_blank">Export Attendance CSV</a>
      </section>
    </main>
  );
}
