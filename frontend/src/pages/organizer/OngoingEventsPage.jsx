import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

export default function OngoingEventsPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get("/events/organizer/mine/list").then((res) => {
      setEvents(res.data.events.filter((e) => ["ONGOING", "PUBLISHED"].includes(e.status)));
    });
  }, []);

  return (
    <main style={{ padding: 16 }}>
      <h2>Ongoing Events</h2>
      <ul>
        {events.map((e) => (
          <li key={e._id}>
            <Link to={`/organizer/events/${e._id}`}>{e.name}</Link> | {e.status}
          </li>
        ))}
      </ul>
    </main>
  );
}
