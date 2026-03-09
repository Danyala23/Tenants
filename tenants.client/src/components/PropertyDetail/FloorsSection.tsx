import type { Floor } from "../../types";

interface FloorsSectionProps {
  floors: Floor[];
  occupanciesByFloor: Record<number, unknown[]>;
  onAddFloor: () => void;
  onEditFloor: (floor: Floor) => void;
  onDeleteFloor: (floorId: number) => void;
}

export function FloorsSection({
  floors,
  occupanciesByFloor,
  onAddFloor,
  onEditFloor,
  onDeleteFloor,
}: FloorsSectionProps) {
  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0 section-heading">
          <i className="bi bi-layers" aria-hidden /> Floors
        </h5>
        <button className="btn btn-sm btn-primary" onClick={onAddFloor}>
          <i className="bi bi-plus-lg" aria-hidden /> Add Floor
        </button>
      </div>
      {floors.length > 0 ? (
        <table className="table table-striped app-table">
          <thead>
            <tr>
              <th>Floor #</th>
              <th>Label</th>
              <th>Tenants</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {floors.map((f) => (
              <tr key={f.id}>
                <td>{f.floorNumber}</td>
                <td>{f.label || "—"}</td>
                <td>{(occupanciesByFloor[f.id] ?? []).length}</td>
                <td>
                  <div className="d-flex gap-1 justify-content-end">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => onEditFloor(f)}
                    >
                      <i className="bi bi-pencil" aria-hidden /> Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDeleteFloor(f.id)}
                    >
                      <i className="bi bi-trash" aria-hidden /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted">No floors yet. Add one to get started.</p>
      )}
    </section>
  );
}
