import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../auth";

export default function BrowseEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [followedOnly, setFollowedOnly] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get("/events/browse", {
      params: {
        participantId: user._id,
        search,
        eventType,
        eligibility,
        followedOnly,
      },
    });
    setEvents(res.data.events);
    setTrending(res.data.trending);
  }, [eligibility, eventType, followedOnly, search, user._id]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await api.get("/events/browse", {
        params: {
          participantId: user._id,
          search,
          eventType,
          eligibility,
          followedOnly,
        },
      });
      if (!active) return;
      setEvents(res.data.events);
      setTrending(res.data.trending);
    })();

    return () => {
      active = false;
    };
  }, [eligibility, eventType, followedOnly, search, user._id]);

  return (
    <main style={{ padding: 16 }}>
      <h2>Browse Events</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input placeholder="Search event/organizer" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
          <option value="">All Types</option>
          <option value="NORMAL">Normal</option>
          <option value="MERCHANDISE">Merchandise</option>
        </select>
        <input placeholder="Eligibility" value={eligibility} onChange={(e) => setEligibility(e.target.value)} />
        <label>
          <input type="checkbox" checked={followedOnly} onChange={(e) => setFollowedOnly(e.target.checked)} /> Followed clubs
        </label>
        <button onClick={load}>Apply</button>
      </div>

      <h3>Trending (Top 5/24h)</h3>
      <ul>
        {trending.map((e) => (
          <li key={e._id}>{e.name}</li>
        ))}
      </ul>

      <h3>Results</h3>
      <ul>
        {events.map((e) => (
          <li key={e._id}>
            <Link to={`/events/${e._id}`}>{e.name}</Link> | {e.eventType} | {e.organizerId?.organizerName}
          </li>
        ))}
      </ul>
    </main>
  );
}
