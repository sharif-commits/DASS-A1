import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function SignupPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    participantType: "IIIT",
    collegeOrOrgName: "",
    contactNumber: "",
  });
  const [error, setError] = useState("");
  const { signupParticipant } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      await signupParticipant(form);
      navigate("/participant/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <main style={{ maxWidth: 520, margin: "40px auto" }}>
      <h1>Participant Signup</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
        <input name="firstName" placeholder="First Name" value={form.firstName} onChange={onChange} required />
        <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={onChange} required />
        <input name="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input name="password" placeholder="Password" type="password" value={form.password} onChange={onChange} required />
        <select name="participantType" value={form.participantType} onChange={onChange}>
          <option value="IIIT">IIIT Student</option>
          <option value="NON_IIIT">Non-IIIT Participant</option>
        </select>
        <input name="collegeOrOrgName" placeholder="College / Organization" value={form.collegeOrOrgName} onChange={onChange} />
        <input name="contactNumber" placeholder="Contact Number" value={form.contactNumber} onChange={onChange} />
        <button type="submit">Create account</button>
      </form>
      {error && <p>{error}</p>}
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </main>
  );
}
