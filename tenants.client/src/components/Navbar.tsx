import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useThemeMode } from "../theme/ThemeProvider";

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeMode();

  function handleLogout() {
    api.auth.logout();
    sessionStorage.removeItem("loggedIn");
    sessionStorage.removeItem("username");
    window.location.href = "/login";
  }

  return (
    <nav className="app-navbar">
      <div className="container d-flex align-items-center justify-content-between">
        <span
          className="app-brand d-inline-flex align-items-center gap-2"
          onClick={() => navigate("/")}
        >
          <i className="bi bi-building" aria-hidden />
          Property Manager
        </span>
        <div className="d-flex align-items-center gap-2">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <span className="app-username">
            {sessionStorage.getItem("username")}
          </span>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right" aria-hidden /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
