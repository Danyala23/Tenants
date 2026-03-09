import { monthLabel } from "../../utils/dateUtils";

interface CollectRentModalProps {
  rent: number;
  dues: number;
  amount: number;
  currentMonth: number;
  currentYear: number;
  onAmountChange: (amount: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function CollectRentModal({
  rent,
  dues,
  amount,
  currentMonth,
  currentYear,
  onAmountChange,
  onSubmit,
  onClose,
}: CollectRentModalProps) {
  const totalDue = rent + dues;

  return (
    <div className="modal show d-block" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-inline-flex align-items-center gap-2">
              <i className="bi bi-wallet2" aria-hidden />
              Collect Rent — {monthLabel(currentMonth, currentYear)}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <dl className="row mb-3">
                <dt className="col-sm-5">Monthly Rent</dt>
                <dd className="col-sm-7">Rs. {rent.toLocaleString()}</dd>
                {dues > 0 && (
                  <>
                    <dt className="col-sm-5 text-danger">Previous Dues</dt>
                    <dd className="col-sm-7 text-danger">
                      Rs. {dues.toLocaleString()}
                    </dd>
                    <dt className="col-sm-5 fw-bold">Total Due</dt>
                    <dd className="col-sm-7 fw-bold">
                      Rs. {totalDue.toLocaleString()}
                    </dd>
                  </>
                )}
              </dl>
              <div className="mb-2">
                <label className="form-label">Amount Collected</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  value={amount || ""}
                  onChange={(e) =>
                    onAmountChange(parseFloat(e.target.value) || 0)
                  }
                  required
                />
                {amount > 0 && amount < totalDue && (
                  <small className="text-warning d-block mt-1">
                    Partial payment — Rs.{" "}
                    {(totalDue - amount).toLocaleString()} will carry over to
                    next month as dues.
                  </small>
                )}
                {amount >= totalDue && amount > 0 && (
                  <small className="text-success d-block mt-1">
                    Full payment — no outstanding dues.
                  </small>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success">
                <i className="bi bi-check-lg" aria-hidden /> Collect
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
