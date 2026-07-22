import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AdminDashboard() {
  const {
    user,
    isAdmin,
  } = useAuth();

  if (!isAdmin) {
    return (
      <main className="page-container">
        <h1>Access Denied</h1>

        <p>
          Sirf admin user ye page access
          kar sakta hai.
        </p>

        <Link
          to="/"
          className="view-button"
        >
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="page-container">
      <p className="admin-label">
        ADMIN PANEL
      </p>

      <h1>
        Welcome, {user?.name}
      </h1>

      <p>
        Product management next step me
        add karenge.
      </p>
    </main>
  );
}

export default AdminDashboard;