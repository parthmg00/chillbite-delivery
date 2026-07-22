import { Outlet } from "react-router-dom";

import Navbar from "../components/layout/Navbar.jsx";
import Footer from "../components/layout/Footer.jsx";

function MainLayout() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default MainLayout;