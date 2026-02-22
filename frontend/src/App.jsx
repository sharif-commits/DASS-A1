import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ProfilePage from "./pages/ProfilePage";
import EventDetailPage from "./pages/EventDetailPage";

import ParticipantDashboard from "./pages/participant/ParticipantDashboard";
import BrowseEventsPage from "./pages/participant/BrowseEventsPage";
import OrganizersPage from "./pages/participant/OrganizersPage";
import OrganizerDetailPage from "./pages/participant/OrganizerDetailPage";

import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import CreateEventPage from "./pages/organizer/CreateEventPage";
import OngoingEventsPage from "./pages/organizer/OngoingEventsPage";
import OrganizerEventManagePage from "./pages/organizer/OrganizerEventManagePage";
import MerchOrdersPage from "./pages/organizer/MerchOrdersPage";
import ResetRequestPage from "./pages/organizer/ResetRequestPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrganizersPage from "./pages/admin/AdminOrganizersPage";
import AdminResetRequestsPage from "./pages/admin/AdminResetRequestsPage";

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "participant") return <Navigate to="/participant/dashboard" replace />;
  if (user.role === "organizer") return <Navigate to="/organizer/dashboard" replace />;
  return <Navigate to="/admin/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          <Route path="/events/:eventId" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
          <Route path="/organizers/:organizerId" element={<ProtectedRoute roles={["participant"]}><OrganizerDetailPage /></ProtectedRoute>} />

          <Route path="/participant/dashboard" element={<ProtectedRoute roles={["participant"]}><ParticipantDashboard /></ProtectedRoute>} />
          <Route path="/participant/browse" element={<ProtectedRoute roles={["participant"]}><BrowseEventsPage /></ProtectedRoute>} />
          <Route path="/participant/organizers" element={<ProtectedRoute roles={["participant"]}><OrganizersPage /></ProtectedRoute>} />

          <Route path="/organizer/dashboard" element={<ProtectedRoute roles={["organizer"]}><OrganizerDashboard /></ProtectedRoute>} />
          <Route path="/organizer/create-event" element={<ProtectedRoute roles={["organizer"]}><CreateEventPage /></ProtectedRoute>} />
          <Route path="/organizer/ongoing" element={<ProtectedRoute roles={["organizer"]}><OngoingEventsPage /></ProtectedRoute>} />
          <Route path="/organizer/events/:eventId" element={<ProtectedRoute roles={["organizer"]}><OrganizerEventManagePage /></ProtectedRoute>} />
          <Route path="/organizer/merch-orders" element={<ProtectedRoute roles={["organizer"]}><MerchOrdersPage /></ProtectedRoute>} />
          <Route path="/organizer/reset-requests" element={<ProtectedRoute roles={["organizer"]}><ResetRequestPage /></ProtectedRoute>} />

          <Route path="/admin/dashboard" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/organizers" element={<ProtectedRoute roles={["admin"]}><AdminOrganizersPage /></ProtectedRoute>} />
          <Route path="/admin/reset-requests" element={<ProtectedRoute roles={["admin"]}><AdminResetRequestsPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
