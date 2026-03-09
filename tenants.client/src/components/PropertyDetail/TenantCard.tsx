import { monthLabel } from "../../utils/dateUtils";
import type { Occupancy, RentPayment, RentIncreaseRule } from "../../types";

interface TenantCardProps {
  occ: Occupancy;
  currentYear: number;
  currentMonth: number;
  currentPayment: RentPayment | undefined;
  rentIncrease: RentIncreaseRule | null;
  payments: RentPayment[];
  isExpanded: boolean;
  dues: number;
  totalDue: number;
  isPendingIncrease: boolean;
  onEdit: (occ: Occupancy) => void;
  onRemove: (occ: Occupancy) => void;
  onCollect: (occId: number, rent: number) => void;
  onToggleHistory: (occId: number) => void;
  onAdjustIncrease: (occId: number) => void;
}

export function TenantCard({
  occ,
  currentYear,
  currentMonth,
  currentPayment,
  rentIncrease,
  payments,
  isExpanded,
  dues,
  totalDue,
  isPendingIncrease,
  onEdit,
  onRemove,
  onCollect,
  onToggleHistory,
  onAdjustIncrease,
}: TenantCardProps) {
  return (
    <div className="card mb-3 tenant-card">
      <div className="card-body p-0">
        <div className="tenant-info-strip">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-0 d-inline-flex align-items-center gap-1">
                <i className="bi bi-person-fill" aria-hidden />
                {occ.tenantName}
              </h6>
              <span className="text-muted small ms-2 d-inline-flex align-items-center gap-1">
                <i className="bi bi-telephone" aria-hidden />
                {occ.tenantPhone}
              </span>
            </div>
            <div className="d-flex gap-1">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => onEdit(occ)}
                title="Edit tenant & occupancy"
              >
                <i className="bi bi-pencil" aria-hidden /> Edit Tenant
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => onRemove(occ)}
                title="Remove tenant from this floor"
              >
                <i className="bi bi-person-x" aria-hidden /> Remove
              </button>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-3 mt-1 small text-muted">
            <span className="d-inline-flex align-items-center gap-1">
              <i className="bi bi-calendar3" aria-hidden />
              Since {occ.startDate.slice(0, 10)}
            </span>
            <span className="d-inline-flex align-items-center gap-1">
              <i className="bi bi-cash" aria-hidden />
              Rent: Rs. {occ.rent.toLocaleString()}
            </span>
            <span className="d-inline-flex align-items-center gap-1">
              <i className="bi bi-shield-check" aria-hidden />
              Deposit: Rs. {occ.securityDeposit.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="rent-status-panel">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <div className="small text-muted text-uppercase fw-bold mb-1">
                {monthLabel(currentMonth, currentYear)}
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span
                  className={`badge ${currentPayment?.isPaid ? "bg-success" : currentPayment ? "badge-partial" : "bg-secondary"}`}
                >
                  <i
                    className={`bi ${currentPayment?.isPaid ? "bi-check-circle-fill" : "bi-clock"}`}
                    aria-hidden
                  />
                  {currentPayment
                    ? currentPayment.isPaid
                      ? "Paid"
                      : `Partial: Rs. ${currentPayment.amountPaid.toLocaleString()}`
                    : "Not Collected"}
                </span>
                {dues > 0 && (
                  <span className="badge badge-dues">
                    <i className="bi bi-exclamation-circle" aria-hidden />
                    Prev. dues: Rs. {dues.toLocaleString()}
                  </span>
                )}
              </div>
              {dues > 0 && (
                <div className="small text-muted mt-1">
                  Total due: Rs. {totalDue.toLocaleString()} (Rent + Dues)
                </div>
              )}
            </div>

            <button
              className={`btn btn-sm ${currentPayment?.isPaid ? "btn-outline-secondary" : "btn-success"}`}
              onClick={() => onCollect(occ.id, occ.rent)}
            >
              <i
                className={`bi ${currentPayment?.isPaid ? "bi-pencil" : "bi-wallet2"}`}
                aria-hidden
              />
              {currentPayment?.isPaid ? "Update" : "Collect Rent"}
            </button>
          </div>

          {isPendingIncrease && rentIncrease && (
            <div className="alert alert-warning d-flex justify-content-between align-items-center py-2 mt-2 mb-0">
              <small className="d-inline-flex align-items-center gap-1">
                <i className="bi bi-exclamation-triangle-fill" aria-hidden />
                Rent increase pending: {rentIncrease.nextIncreaseDate.slice(0, 10)} (
                {rentIncrease.increasePercent}%)
              </small>
              <button
                className="btn btn-sm btn-warning"
                onClick={() => onAdjustIncrease(occ.id)}
              >
                <i className="bi bi-pencil" aria-hidden /> Adjust
              </button>
            </div>
          )}

          {rentIncrease && !isPendingIncrease && (
            <div className="d-flex align-items-center gap-2 mt-2">
              <small className="text-muted d-inline-flex align-items-center gap-1">
                <i className="bi bi-graph-up-arrow" aria-hidden />
                Next increase: {rentIncrease.nextIncreaseDate.slice(0, 10)} ·{" "}
                {rentIncrease.increasePercent}%
              </small>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => onAdjustIncrease(occ.id)}
              >
                <i className="bi bi-pencil" aria-hidden /> Edit
              </button>
            </div>
          )}

          <div className="mt-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onToggleHistory(occ.id)}
            >
              <i
                className={`bi bi-chevron-${isExpanded ? "up" : "down"}`}
                aria-hidden
              />
              {isExpanded ? "Hide" : "Show"} Rent History
            </button>
          </div>

          {isExpanded && (
            <div className="mt-3 pt-3 border-top">
              <h6 className="small text-muted text-uppercase fw-bold mb-2 d-inline-flex align-items-center gap-1">
                <i className="bi bi-cash-stack" aria-hidden />
                Rent Payments
              </h6>
              {payments.length > 0 ? (
                <table className="table table-sm table-striped app-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Paid</th>
                      <th>Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const shortfall = occ.rent - p.amountPaid;
                      return (
                        <tr key={p.id}>
                          <td>{monthLabel(p.month, p.year)}</td>
                          <td>Rs. {p.amountPaid.toLocaleString()}</td>
                          <td>
                            {shortfall > 0 ? (
                              <span className="text-danger">
                                Rs. {shortfall.toLocaleString()}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${p.isPaid ? "bg-success" : "badge-partial"}`}
                            >
                              <i
                                className={`bi ${p.isPaid ? "bi-check-circle-fill" : "bi-clock"}`}
                                aria-hidden
                              />
                              {p.isPaid ? "Paid" : "Partial"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted small mb-0">No payment records yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
