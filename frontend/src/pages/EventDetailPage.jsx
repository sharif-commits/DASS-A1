import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", { autoConnect: false });

export default function EventDetailPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [formAnswers, setFormAnswers] = useState({});
  const [purchase, setPurchase] = useState({ size: "", color: "", quantity: 1, paymentProof: null });

  const load = useCallback(async () => {
    const [eventRes, forumRes] = await Promise.all([
      api.get(`/events/${eventId}`),
      api.get(`/events/${eventId}/forum`),
    ]);
    setEvent(eventRes.data.event);
    setMessages(forumRes.data.messages);
  }, [eventId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [eventRes, forumRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/forum`),
      ]);
      if (!active) return;
      setEvent(eventRes.data.event);
      setMessages(forumRes.data.messages);
    })();

    return () => {
      active = false;
    };
  }, [eventId]);

  useEffect(() => {
    socket.connect();
    socket.emit("forum:join", { eventId });
    socket.on("forum:new", (m) => setMessages((prev) => [...prev, m]));
    socket.on("forum:update", (m) => setMessages((prev) => prev.map((x) => (x._id === m._id ? m : x))));
    return () => {
      socket.off("forum:new");
      socket.off("forum:update");
      socket.disconnect();
    };
  }, [eventId]);

  const blockReason = useMemo(() => {
    if (!event) return "";
    if (new Date(event.registrationDeadline).getTime() < Number(new Date())) return "Registration deadline passed";
    if (event.eventType === "MERCHANDISE" && event.merchStock <= 0) return "Out of stock";
    return "";
  }, [event]);

  const registerNormal = async () => {
    await api.post(`/events/${eventId}/register`, { answers: formAnswers });
    alert("Registered successfully");
  };

  const buyMerch = async () => {
    const fd = new FormData();
    fd.append("size", purchase.size);
    fd.append("color", purchase.color);
    fd.append("quantity", purchase.quantity);
    fd.append("paymentProof", purchase.paymentProof);
    await api.post(`/events/${eventId}/purchase`, fd);
    alert("Order submitted for payment approval");
  };

  const postMessage = async () => {
    const res = await api.post(`/events/${eventId}/forum`, { content: msg });
    setMessages((prev) => [...prev, res.data.message]);
    setMsg("");
  };

  const react = async (messageId, reaction) => {
    await api.patch(`/events/${eventId}/forum/${messageId}/moderate`, { action: "react", reaction });
  };

  const mod = async (messageId, action) => {
    await api.patch(`/events/${eventId}/forum/${messageId}/moderate`, { action });
    load();
  };

  if (!event) return <p style={{ padding: 16 }}>Loading...</p>;

  return (
    <main style={{ padding: 16 }}>
      <h2>{event.name}</h2>
      <p>Type: {event.eventType}</p>
      <p>{event.description}</p>
      <p>Eligibility: {event.eligibility}</p>
      <p>Deadline: {new Date(event.registrationDeadline).toLocaleString()}</p>
      <p>Organizer: {event.organizerId?.organizerName}</p>

      <a href={`${(import.meta.env.VITE_API_URL || "http://localhost:5000/api")}/events/${eventId}/calendar.ics`} target="_blank">Add to calendar (.ics)</a>

      {user.role === "participant" && (
        <section style={{ marginTop: 20 }}>
          <h3>Registration / Purchase</h3>
          {blockReason && <p>{blockReason}</p>}
          {event.eventType === "NORMAL" ? (
            <>
              {(event.customForm || []).map((field) => (
                <input
                  key={field.key}
                  placeholder={field.label}
                  onChange={(e) => setFormAnswers((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              ))}
              <button disabled={!!blockReason} onClick={registerNormal}>Register</button>
            </>
          ) : (
            <div style={{ display: "grid", gap: 8, maxWidth: 300 }}>
              <input placeholder="Size" onChange={(e) => setPurchase({ ...purchase, size: e.target.value })} />
              <input placeholder="Color" onChange={(e) => setPurchase({ ...purchase, color: e.target.value })} />
              <input type="number" min={1} max={event.purchaseLimitPerParticipant || 1} value={purchase.quantity} onChange={(e) => setPurchase({ ...purchase, quantity: Number(e.target.value) })} />
              <input type="file" accept="image/*" onChange={(e) => setPurchase({ ...purchase, paymentProof: e.target.files?.[0] })} />
              <button disabled={!!blockReason} onClick={buyMerch}>Buy</button>
            </div>
          )}
        </section>
      )}

      <section style={{ marginTop: 24 }}>
        <h3>Discussion Forum</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Post a message" style={{ flex: 1 }} />
          <button onClick={postMessage}>Send</button>
        </div>
        <ul>
          {messages.map((m) => (
            <li key={m._id} style={{ marginTop: 10 }}>
              <strong>{m.role}</strong> {m.pinned ? "📌" : ""}: {m.deleted ? "[deleted]" : m.content}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => react(m._id, "like")}>👍 {m.reactions?.like || 0}</button>
                <button onClick={() => react(m._id, "question")}>❓ {m.reactions?.question || 0}</button>
                {user.role === "organizer" && (
                  <>
                    <button onClick={() => mod(m._id, "pin")}>Pin</button>
                    <button onClick={() => mod(m._id, "delete")}>Delete</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
