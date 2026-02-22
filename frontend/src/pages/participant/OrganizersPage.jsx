import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../auth";

export default function OrganizersPage() {
  const [organizers, setOrganizers] = useState([]);
  const { user, setUser } = useAuth();

  useEffect(() => {
    api.get("/users/organizers").then((res) => setOrganizers(res.data.organizers));
  }, []);

  const followedSet = new Set((user.followedOrganizers || []).map(String));

  const toggleFollow = async (id) => {
    const next = followedSet.has(id)
      ? (user.followedOrganizers || []).filter((x) => String(x) !== String(id))
      : [...(user.followedOrganizers || []), id];

    const res = await api.patch("/users/participant/profile", { followedOrganizers: next });
    setUser(res.data.user);
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>Clubs / Organizers</h2>
      <ul>
        {organizers.map((o) => (
          <li key={o._id}>
            <Link to={`/organizers/${o._id}`}>{o.organizerName}</Link> | {o.category} | {o.description}
            <button style={{ marginLeft: 8 }} onClick={() => toggleFollow(o._id)}>
              {followedSet.has(o._id) ? "Unfollow" : "Follow"}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
