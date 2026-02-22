import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const common = [
    { to: "/profile", label: "Profile" },
    { to: "#", label: "Logout", action: () => { logout(); navigate("/login"); } },
  ];

  const byRole = {
    participant: [
      { to: "/participant/dashboard", label: "Dashboard" },
      { to: "/participant/browse", label: "Browse Events" },
      { to: "/participant/organizers", label: "Clubs/Organizers" },
      ...common,
    ],
    organizer: [
      { to: "/organizer/dashboard", label: "Dashboard" },
      { to: "/organizer/create-event", label: "Create Event" },
      { to: "/organizer/ongoing", label: "Ongoing Events" },
      ...common,
    ],
    admin: [
      { to: "/admin/dashboard", label: "Dashboard" },
      { to: "/admin/organizers", label: "Manage Clubs/Organizers" },
      { to: "/admin/reset-requests", label: "Password Reset Requests" },
      ...common,
    ],
  };

  const links = byRole[user.role] || [];

  return (
    <nav style={{ display: "flex", gap: 12, padding: 12, borderBottom: "1px solid #ddd", flexWrap: "wrap" }}>
      {links.map((item) =>
        item.action ? (
          <button key={item.label} onClick={item.action}>{item.label}</button>
        ) : (
          <Link key={item.to} to={item.to}>{item.label}</Link>
        )
      )}
    </nav>
  );
}
