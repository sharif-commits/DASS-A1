import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import api from "../api";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [message, setMessage] = useState("");
  const [organizers, setOrganizers] = useState([]);
  const [passwordPayload, setPasswordPayload] = useState({ currentPassword: "", newPassword: "" });
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    contactNumber: user?.contactNumber || "",
    collegeOrOrgName: user?.collegeOrOrgName || "",
    interests: (user?.interests || []).join(", "),
    followedOrganizers: user?.followedOrganizers || [],
    organizerName: user?.organizerName || "",
    category: user?.category || "",
    description: user?.description || "",
    contactEmail: user?.contactEmail || "",
    contactPhone: user?.contactPhone || "",
    discordWebhookUrl: user?.discordWebhookUrl || "",
  });

  useEffect(() => {
    if (user?.role !== "participant") {
      return;
    }

    api
      .get("/users/organizers")
      .then((res) => setOrganizers(res.data.organizers || []))
      .catch(() => setOrganizers([]));
  }, [user?.role]);

  const followedSet = new Set((user?.followedOrganizers || []).map(String));
  const followedOrganizerDetails = organizers.filter((organizer) => followedSet.has(String(organizer._id)));

  const save = async () => {
    if (user.role === "participant") {
      const payload = {
        ...form,
        interests: form.interests
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      };
      const res = await api.patch("/users/participant/profile", payload);
      setUser(res.data.user);
    } else if (user.role === "organizer") {
      const res = await api.patch("/users/organizer/profile", form);
      setUser(res.data.user);
    }
    setMessage("Profile updated");
  };

  const changePassword = async () => {
    await api.post("/auth/change-password", passwordPayload);
    setMessage("Password updated");
    setPasswordPayload({ currentPassword: "", newPassword: "" });
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>Profile</h2>
      <p>Email (non-editable): {user.email}</p>
      {user.role === "participant" && <p>Participant Type (non-editable): {user.participantType}</p>}

      <div style={{ display: "grid", gap: 8, maxWidth: 600 }}>
        {user.role === "participant" ? (
          <>
            <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First Name" />
            <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last Name" />
            <input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} placeholder="Contact Number" />
            <input value={form.collegeOrOrgName} onChange={(e) => setForm({ ...form, collegeOrOrgName: e.target.value })} placeholder="College/Organization" />
            <input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="Interests (comma separated)" />
          </>
        ) : user.role === "organizer" ? (
          <>
            <input value={form.organizerName} onChange={(e) => setForm({ ...form, organizerName: e.target.value })} placeholder="Organizer Name" />
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
            <input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="Contact Email" />
            <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="Contact Phone" />
            <input value={form.discordWebhookUrl} onChange={(e) => setForm({ ...form, discordWebhookUrl: e.target.value })} placeholder="Discord Webhook URL" />
          </>
        ) : null}
        {user.role !== "admin" && <button onClick={save}>Save Profile</button>}
      </div>

      {user.role === "participant" && (
        <section style={{ marginTop: 20 }}>
          <h3>Following Organizers</h3>
          {followedOrganizerDetails.length === 0 ? (
            <p>You are not following any organizer yet.</p>
          ) : (
            <ul>
              {followedOrganizerDetails.map((organizer) => (
                <li key={organizer._id}>
                  {organizer.organizerName} {organizer.category ? `(${organizer.category})` : ""}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <h3 style={{ marginTop: 20 }}>Security Settings</h3>
      <div style={{ display: "grid", gap: 8, maxWidth: 400 }}>
        {user.role === "participant" && (
          <input
            type="password"
            placeholder="Current password"
            value={passwordPayload.currentPassword}
            onChange={(e) => setPasswordPayload({ ...passwordPayload, currentPassword: e.target.value })}
          />
        )}
        <input
          type="password"
          placeholder="New password"
          value={passwordPayload.newPassword}
          onChange={(e) => setPasswordPayload({ ...passwordPayload, newPassword: e.target.value })}
        />
        <button onClick={changePassword}>Change Password</button>
      </div>

      {message && <p>{message}</p>}
    </main>
  );
}
