import { useState } from "react";
import api from "../../api";

export default function CreateEventPage() {
  const [event, setEvent] = useState({
    name: "",
    description: "",
    eventType: "NORMAL",
    eligibility: "ALL",
    registrationDeadline: "",
    eventStartDate: "",
    eventEndDate: "",
    registrationLimit: 0,
    registrationFee: 0,
    tags: "",
    customForm: [],
    merchItemName: "",
    purchaseLimitPerParticipant: 1,
    merchStock: 0,
  });
  const [formField, setFormField] = useState({ label: "", key: "", type: "text", required: false, options: "" });

  const create = async () => {
    const payload = {
      ...event,
      tags: event.tags.split(",").map((x) => x.trim()).filter(Boolean),
      customForm: event.customForm,
    };
    const res = await api.post("/events/organizer", payload);
    alert(`Created draft event: ${res.data.event.name}`);
  };

  const addField = () => {
    setEvent((prev) => ({
      ...prev,
      customForm: [
        ...prev.customForm,
        {
          ...formField,
          options: formField.options.split(",").map((x) => x.trim()).filter(Boolean),
          order: prev.customForm.length,
        },
      ],
    }));
    setFormField({ label: "", key: "", type: "text", required: false, options: "" });
  };

  return (
    <main style={{ padding: 16, display: "grid", gap: 8, maxWidth: 700 }}>
      <h2>Create Event (Draft)</h2>
      <input placeholder="Event Name" onChange={(e) => setEvent({ ...event, name: e.target.value })} />
      <textarea placeholder="Description" onChange={(e) => setEvent({ ...event, description: e.target.value })} />
      <select value={event.eventType} onChange={(e) => setEvent({ ...event, eventType: e.target.value })}>
        <option value="NORMAL">Normal</option>
        <option value="MERCHANDISE">Merchandise</option>
      </select>
      <input placeholder="Eligibility" onChange={(e) => setEvent({ ...event, eligibility: e.target.value })} />
      <label>Registration Deadline <input type="datetime-local" onChange={(e) => setEvent({ ...event, registrationDeadline: e.target.value })} /></label>
      <label>Start Date <input type="datetime-local" onChange={(e) => setEvent({ ...event, eventStartDate: e.target.value })} /></label>
      <label>End Date <input type="datetime-local" onChange={(e) => setEvent({ ...event, eventEndDate: e.target.value })} /></label>
      <input type="number" placeholder="Registration Limit" onChange={(e) => setEvent({ ...event, registrationLimit: Number(e.target.value) })} />
      <input type="number" placeholder="Registration Fee" onChange={(e) => setEvent({ ...event, registrationFee: Number(e.target.value) })} />
      <input placeholder="Tags comma-separated" onChange={(e) => setEvent({ ...event, tags: e.target.value })} />

      {event.eventType === "NORMAL" && (
        <section style={{ border: "1px solid #ddd", padding: 8 }}>
          <h3>Dynamic Form Builder</h3>
          <input placeholder="Field Label" value={formField.label} onChange={(e) => setFormField({ ...formField, label: e.target.value })} />
          <input placeholder="Field Key" value={formField.key} onChange={(e) => setFormField({ ...formField, key: e.target.value })} />
          <select value={formField.type} onChange={(e) => setFormField({ ...formField, type: e.target.value })}>
            <option value="text">Text</option>
            <option value="dropdown">Dropdown</option>
            <option value="checkbox">Checkbox</option>
            <option value="file">File</option>
            <option value="number">Number</option>
          </select>
          <input placeholder="Options (for dropdown/checkbox)" value={formField.options} onChange={(e) => setFormField({ ...formField, options: e.target.value })} />
          <label>
            <input type="checkbox" checked={formField.required} onChange={(e) => setFormField({ ...formField, required: e.target.checked })} /> Required
          </label>
          <button onClick={addField}>Add field</button>
          <ul>{event.customForm.map((f, i) => <li key={f.key + i}>{f.label} ({f.type})</li>)}</ul>
        </section>
      )}

      {event.eventType === "MERCHANDISE" && (
        <section style={{ border: "1px solid #ddd", padding: 8 }}>
          <h3>Merchandise Settings</h3>
          <input placeholder="Item Name" onChange={(e) => setEvent({ ...event, merchItemName: e.target.value })} />
          <input type="number" placeholder="Total Stock" onChange={(e) => setEvent({ ...event, merchStock: Number(e.target.value) })} />
          <input type="number" placeholder="Purchase limit per participant" onChange={(e) => setEvent({ ...event, purchaseLimitPerParticipant: Number(e.target.value) })} />
        </section>
      )}

      <button onClick={create}>Save Draft</button>
    </main>
  );
}
