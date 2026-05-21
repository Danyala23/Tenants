"use client";

import type { Floor } from "@/lib/types";

interface FloorModalProps {
  editingFloor: Floor | null;
  floorNumber: number;
  label: string;
  onFloorNumberChange: (value: number) => void;
  onLabelChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function FloorModal({
  editingFloor,
  floorNumber,
  label,
  onFloorNumberChange,
  onLabelChange,
  onSubmit,
  onClose,
}: FloorModalProps) {
  return (
    <div className="modal show d-block" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-inline-flex align-items-center gap-2">
              <i
                className={`bi ${editingFloor ? "bi-pencil" : "bi-plus-lg"}`}
                aria-hidden
              />
              {editingFloor ? "Edit Floor" : "Add Floor"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Floor Number</label>
                <input
                  type="number"
                  className="form-control"
                  value={floorNumber}
                  onChange={(e) =>
                    onFloorNumberChange(parseInt(e.target.value) || 0)
                  }
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Label</label>
                <input
                  type="text"
                  className="form-control"
                  value={label}
                  onChange={(e) => onLabelChange(e.target.value)}
                  placeholder="e.g. Ground, 1st"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingFloor ? "Save" : "Add"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
