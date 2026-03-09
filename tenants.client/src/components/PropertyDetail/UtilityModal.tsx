import type { Floor, UtilityConnection } from "../../types";

interface UtilityForm {
  floorId: number | null;
  type: string;
  referenceNumber: string;
  consumerNumber: string;
  providerName: string;
}

interface UtilityModalProps {
  editingUtility: UtilityConnection | null;
  floors: Floor[];
  form: UtilityForm;
  onFormChange: (updater: (f: UtilityForm) => UtilityForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function UtilityModal({
  editingUtility,
  floors,
  form,
  onFormChange,
  onSubmit,
  onClose,
}: UtilityModalProps) {
  return (
    <div className="modal show d-block" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-inline-flex align-items-center gap-2">
              <i className="bi bi-plug" aria-hidden />
              {editingUtility ? "Edit" : "Add"} Utility Connection
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="mb-2">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={(e) =>
                    onFormChange((f) => ({ ...f, type: e.target.value }))
                  }
                  disabled={!!editingUtility}
                >
                  <option value="Electricity">Electricity (LESCO)</option>
                  <option value="Gas">Gas (SNGPL)</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="form-label">Floor</label>
                <select
                  className="form-select"
                  value={form.floorId ?? ""}
                  onChange={(e) =>
                    onFormChange((f) => ({
                      ...f,
                      floorId: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    }))
                  }
                >
                  <option value="">Whole property</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      Floor {f.floorNumber} {f.label ? `(${f.label})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {form.type === "Electricity" && (
                <div className="mb-2">
                  <label className="form-label">
                    Reference Number (14-digit, LESCO)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 12112181887022"
                    value={form.referenceNumber}
                    onChange={(e) =>
                      onFormChange((f) => ({
                        ...f,
                        referenceNumber: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
              {form.type === "Gas" && (
                <div className="mb-2">
                  <label className="form-label">
                    Consumer Number (11-digit, SNGPL)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 53467826375"
                    value={form.consumerNumber}
                    onChange={(e) =>
                      onFormChange((f) => ({
                        ...f,
                        consumerNumber: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
              <div className="mb-2">
                <label className="form-label">Provider Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. LESCO, SNGPL"
                  value={form.providerName}
                  onChange={(e) =>
                    onFormChange((f) => ({
                      ...f,
                      providerName: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingUtility ? "Save" : "Add"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
