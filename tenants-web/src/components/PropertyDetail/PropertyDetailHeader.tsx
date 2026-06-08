"use client";

import { useRouter } from "next/navigation";
import type { Property } from "@/lib/types";

interface PropertyDetailHeaderProps {
  property: Property;
}

export function PropertyDetailHeader({ property }: PropertyDetailHeaderProps) {
  const router = useRouter();

  return (
    <>
      <button className="btn btn-back mb-3" onClick={() => router.push("/")}>
        <i className="bi bi-arrow-left" aria-hidden /> Back
      </button>
      <div className="property-header mb-4">
        <span className="brand-mark" aria-hidden>
          <i className="bi bi-house-door" />
        </span>
        <div className="flex-grow-1">
          <h2 className="mb-0">{property.houseNumber}</h2>
          <p className="card-text mb-0 d-inline-flex align-items-center gap-1">
            <i className="bi bi-geo-alt" aria-hidden />
            {property.address}
          </p>
        </div>
        <span className="property-size d-inline-flex align-items-center gap-1">
          <i className="bi bi-rulers" aria-hidden />
          {property.size} Marla{property.size !== 1 ? "s" : ""}
        </span>
      </div>
    </>
  );
}
