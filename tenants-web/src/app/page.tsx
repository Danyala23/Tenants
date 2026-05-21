"use client";

import { Navbar } from "@/components/Navbar";
import { Dashboard } from "@/views/Dashboard";

export default function HomePage() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-content">
        <Dashboard />
      </main>
    </div>
  );
}
