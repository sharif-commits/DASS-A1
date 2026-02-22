import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    if (user.role === "participant") navigate("/participant/dashboard");
    if (user.role === "organizer") navigate("/organizer/dashboard");
    if (user.role === "admin") navigate("/admin/dashboard");
  }

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      const role = JSON.parse(atob(localStorage.getItem("token").split(".")[1])).role;
      navigate(role === "participant" ? "/participant/dashboard" : role === "organizer" ? "/organizer/dashboard" : "/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <main style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Felicity EMS Login</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
        {error && <p>{error}</p>}
      </form>
      <p>
        Participant? <Link to="/signup">Sign up</Link>
      </p>
    </main>
  );
}
