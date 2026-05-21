"use client";

import { Navbar } from "@/components/Navbar";
import { TenantDetail } from "@/views/TenantDetail";

export default function TenantPage() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-content">
        <TenantDetail />
      </main>
    </div>
  );
}
