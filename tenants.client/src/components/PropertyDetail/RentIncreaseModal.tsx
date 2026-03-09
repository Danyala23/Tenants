interface RentIncreaseModalProps {
  increasePercent: number;
  nextIncreaseDate: string;
  onIncreasePercentChange: (value: number) => void;
  onNextIncreaseDateChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function RentIncreaseModal({
  increasePercent,
  nextIncreaseDate,
  onIncreasePercentChange,
  onNextIncreaseDateChange,
  onSubmit,
  onClose,
}: RentIncreaseModalProps) {
  return (
    <div className="modal show d-block" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-inline-flex align-items-center gap-2">
              <i className="bi bi-percent" aria-hidden />
              Edit Rent Increase Rule
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Increase %</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={increasePercent}
                  onChange={(e) =>
                    onIncreasePercentChange(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Next Increase Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={nextIncreaseDate}
                  onChange={(e) => onNextIncreaseDateChange(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
