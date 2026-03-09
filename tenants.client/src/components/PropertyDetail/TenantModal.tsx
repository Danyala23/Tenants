import type { Floor, Occupancy } from "../../types";

interface OccupancyForm {
  name: string;
  phoneNumber: string;
  rent: number;
  securityDeposit: number;
  startDate: string;
  floorIds: number[];
  existingTenantId: number | null;
}

interface TenantModalProps {
  editingOccupancy: Occupancy | null;
  floors: Floor[];
  form: OccupancyForm;
  onFormChange: (updater: (f: OccupancyForm) => OccupancyForm) => void;
  onToggleFloor: (floorId: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function TenantModal({
  editingOccupancy,
  floors,
  form,
  onFormChange,
  onToggleFloor,
  onSubmit,
  onClose,
}: TenantModalProps) {
  return (
    <div className="modal show d-block" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-inline-flex align-items-center gap-2">
              <i
                className={`bi ${editingOccupancy ? "bi-pencil" : "bi-person-plus"}`}
                aria-hidden
              />
              {editingOccupancy ? "Edit Occupancy" : "Add Tenant"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="mb-2">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.name}
                  onChange={(e) =>
                    onFormChange((f) => ({ ...f, name: e.target.value }))
                  }
                  disabled={!!form.existingTenantId}
                  required={!form.existingTenantId}
                />
              </div>
              <div className="mb-2">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.phoneNumber}
                  onChange={(e) =>
                    onFormChange((f) => ({ ...f, phoneNumber: e.target.value }))
                  }
                  disabled={!!form.existingTenantId}
                />
              </div>
              <div className="mb-2">
                <label className="form-label">
                  {editingOccupancy ? "Floor" : "Floors"}
                </label>
                {editingOccupancy ? (
                  <select
                    className="form-select"
                    value={form.floorIds[0] ?? ""}
                    onChange={(e) =>
                      onFormChange((f) => ({
                        ...f,
                        floorIds: e.target.value
                          ? [parseInt(e.target.value)]
                          : [],
                      }))
                    }
                  >
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        Floor {f.floorNumber} {f.label ? `(${f.label})` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    <div className="d-flex flex-wrap gap-2">
                      {floors.map((f) => (
                        <label
                          key={f.id}
                          className="form-check form-check-inline"
                        >
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={form.floorIds.includes(f.id)}
                            onChange={() => onToggleFloor(f.id)}
                          />
                          <span className="form-check-label">
                            {f.floorNumber} {f.label ? `(${f.label})` : ""}
                          </span>
                        </label>
                      ))}
                    </div>
                    <small className="text-muted">
                      Select one or more floors for this tenant.
                    </small>
                  </>
                )}
              </div>
              <div className="mb-2">
                <label className="form-label">
                  Rent{" "}
                  {!editingOccupancy && form.floorIds.length > 1 ? "(total)" : ""}
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={form.rent || ""}
                  onChange={(e) =>
                    onFormChange((f) => ({
                      ...f,
                      rent: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="mb-2">
                <label className="form-label">
                  Security Deposit{" "}
                  {!editingOccupancy && form.floorIds.length > 1 ? "(total)" : ""}
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={form.securityDeposit || ""}
                  onChange={(e) =>
                    onFormChange((f) => ({
                      ...f,
                      securityDeposit: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
                {!editingOccupancy && form.floorIds.length > 1 && (
                  <small className="text-muted d-block mt-1">
                    Split across {form.floorIds.length} floors:{" "}
                    {(form.rent / form.floorIds.length).toFixed(2)} rent and{" "}
                    {(form.securityDeposit / form.floorIds.length).toFixed(2)}{" "}
                    deposit per floor
                  </small>
                )}
              </div>
              <div className="mb-2">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.startDate}
                  onChange={(e) =>
                    onFormChange((f) => ({ ...f, startDate: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingOccupancy ? "Save" : "Add"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
