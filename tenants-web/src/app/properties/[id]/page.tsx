"use client";

import { Navbar } from "@/components/Navbar";
import { PropertyDetail } from "@/views/PropertyDetail";

export default function PropertyPage() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-content">
        <PropertyDetail />
      </main>
    </div>
  );
}
