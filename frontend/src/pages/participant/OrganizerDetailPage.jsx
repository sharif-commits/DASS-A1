import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api";

export default function OrganizerDetailPage() {
  const { organizerId } = useParams();
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get(`/users/organizers/${organizerId}`).then((res) => setOrganizer(res.data.organizer));
    api.get("/events/browse").then((res) => {
      const list = res.data.events.filter((e) => e.organizerId?._id === organizerId);
      setEvents(list);
    });
  }, [organizerId]);

  if (!organizer) return <p>Loading...</p>;

  const now = Number(new Date());
  const upcoming = events.filter((e) => new Date(e.eventStartDate).getTime() >= now);
  const past = events.filter((e) => new Date(e.eventStartDate).getTime() < now);

  return (
    <main style={{ padding: 16 }}>
      <h2>{organizer.organizerName}</h2>
      <p>{organizer.category}</p>
      <p>{organizer.description}</p>
      <p>{organizer.contactEmail}</p>

      <h3>Upcoming Events</h3>
      <ul>{upcoming.map((e) => <li key={e._id}><Link to={`/events/${e._id}`}>{e.name}</Link></li>)}</ul>
      <h3>Past Events</h3>
      <ul>{past.map((e) => <li key={e._id}>{e.name}</li>)}</ul>
    </main>
  );
}
