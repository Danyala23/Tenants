import { useNavigate } from "react-router-dom";
import type { Property } from "../../types";

interface PropertyDetailHeaderProps {
  property: Property;
}

export function PropertyDetailHeader({ property }: PropertyDetailHeaderProps) {
  const navigate = useNavigate();

  return (
    <>
      <button className="btn btn-back mb-3" onClick={() => navigate("/")}>
        <i className="bi bi-arrow-left" aria-hidden /> Back
      </button>
      <div className="property-header mb-4">
        <h2 className="d-inline-flex align-items-center gap-2">
          <i className="bi bi-building" aria-hidden />
          {property.houseNumber} — {property.address}
        </h2>
        <span className="property-size d-inline-flex align-items-center gap-1">
          <i className="bi bi-arrows-angle-expand" aria-hidden />
          Size: {property.size} Marla{property.size !== 1 ? "s" : ""}
        </span>
      </div>
    </>
  );
}
