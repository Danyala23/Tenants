import { monthLabel, computeDues } from "../../utils/dateUtils";
import type { RentPayment } from "../../types";

interface CollectRentModalProps {
  rent: number;
  dues: number;
  amount: number;
  selectedYear: number;
  selectedMonth: number;
  unpaidMonths: { year: number; month: number }[];
  payments: RentPayment[];
  startDate: string;
  collectedToday: boolean;
  collectedAt: string;
  onAmountChange: (amount: number) => void;
  onPeriodChange: (year: number, month: number) => void;
  onCollectedTodayChange: (value: boolean) => void;
  onCollectedAtChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function CollectRentModal({
  rent,
  dues,
  amount,
  selectedYear,
  selectedMonth,
  unpaidMonths,
  payments,
  startDate,
  onPeriodChange,
  collectedToday,
  collectedAt,
  onAmountChange,
  onCollectedTodayChange,
  onCollectedAtChange,
  onSubmit,
  onClose,
}: CollectRentModalProps) {
  const showPeriodPicker = dues > 0 && unpaidMonths.length > 0;
  const totalDue = showPeriodPicker
    ? rent + computeDues(rent, payments, startDate, selectedYear, selectedMonth)
    : rent + dues;
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="modal show d-block" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-inline-flex align-items-center gap-2">
              <i className="bi bi-wallet2" aria-hidden />
              Collect Rent — {monthLabel(selectedMonth, selectedYear)}
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
              {showPeriodPicker && (
                <div className="mb-3">
                  <label className="form-label">Period</label>
                  <select
                    className="form-select"
                    value={`${selectedYear}-${selectedMonth}`}
                    onChange={(e) => {
                      const [y, m] = e.target.value.split("-").map(Number);
                      onPeriodChange(y, m);
                    }}
                  >
                    {unpaidMonths.map(({ year, month }) => (
                      <option key={`${year}-${month}`} value={`${year}-${month}`}>
                        {monthLabel(month, year)}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted d-block mt-1">
                    Only unpaid months are shown
                  </small>
                </div>
              )}
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
              <div className="mb-2">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="collectRentCollectedToday"
                    checked={collectedToday}
                    onChange={(e) => onCollectedTodayChange(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="collectRentCollectedToday">
                    Rent was collected today
                  </label>
                </div>
              </div>
              {!collectedToday && (
                <div className="mb-2">
                  <label className="form-label">Collection Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={collectedAt || todayStr}
                    onChange={(e) => onCollectedAtChange(e.target.value)}
                    required={!collectedToday}
                  />
                </div>
              )}
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
