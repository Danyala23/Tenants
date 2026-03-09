import { api } from "../../api";
import { useNotifications } from "../../context/NotificationContext";
import { monthLabel } from "../../utils/dateUtils";
import type { Bill } from "../../types";

interface BillsSectionProps {
  bills: Bill[];
  billYear: number;
  billMonth: number | "";
  onBillYearChange: (year: number) => void;
  onBillMonthChange: (month: number | "") => void;
  onRefresh: () => void;
  onDataChange: () => void;
}

export function BillsSection({
  bills,
  billYear,
  billMonth,
  onBillYearChange,
  onBillMonthChange,
  onRefresh,
  onDataChange,
}: BillsSectionProps) {
  const { toast } = useNotifications();

  async function handleMarkPaid(b: Bill) {
    try {
      await api.bills.markPaid(b.id);
      onRefresh();
      toast({
        message: b.isPaid ? "Marked as unpaid" : "Marked as paid",
        type: "success",
      });
    } catch (e) {
      console.error(e);
      toast({ message: "Failed to update", type: "error" });
    }
  }

  async function handleViewBill(b: Bill) {
    try {
      await api.bills.openSnapshot(b.id);
    } catch (e) {
      console.error(e);
      toast({ message: "Failed to load bill", type: "error" });
    }
  }

  async function handleScrapeNow() {
    try {
      await api.bills.scrapeNow();
      toast({ message: "Scrape started", type: "success" });
      onDataChange();
    } catch (e) {
      console.error(e);
      toast({ message: "Scrape failed", type: "error" });
    }
  }

  return (
    <section className="mb-4">
      <h5 className="mb-3 section-heading">
        <i className="bi bi-receipt" aria-hidden /> Bills
      </h5>
      <div className="d-flex gap-2 mb-3 align-items-center flex-wrap">
        <select
          className="form-select form-select-sm"
          style={{ width: "auto" }}
          value={billYear}
          onChange={(e) => onBillYearChange(parseInt(e.target.value))}
        >
          {[new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          className="form-select form-select-sm"
          style={{ width: "auto" }}
          value={billMonth}
          onChange={(e) =>
            onBillMonthChange(e.target.value === "" ? "" : parseInt(e.target.value))
          }
        >
          <option value="">All months</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
        <button className="btn btn-sm btn-outline-secondary" onClick={onRefresh}>
          <i className="bi bi-arrow-clockwise" aria-hidden /> Refresh
        </button>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={handleScrapeNow}
        >
          <i className="bi bi-cloud-download" aria-hidden /> Scrape Now
        </button>
      </div>
      {bills.length > 0 ? (
        <table className="table table-striped app-table table-align-middle">
          <thead>
            <tr>
              <th>Type</th>
              <th>Month</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Units</th>
              <th>Status</th>
              <th>Scope</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b.id}>
                <td className="align-middle">{b.type}</td>
                <td className="align-middle">{monthLabel(b.month, b.year)}</td>
                <td className="align-middle">Rs. {b.amount.toLocaleString()}</td>
                <td className="align-middle">
                  {b.dueDate ? new Date(b.dueDate).toLocaleDateString() : "—"}
                </td>
                <td className="align-middle">{b.unitsConsumed != null ? b.unitsConsumed : "—"}</td>
                <td className="align-middle">
                  <span
                    className={`badge ${b.isPaid ? "bg-success" : "bg-secondary"}`}
                  >
                    <i
                      className={`bi ${b.isPaid ? "bi-check-circle-fill" : "bi-clock"}`}
                      aria-hidden
                    />
                    {b.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </td>
                <td className="align-middle">{b.tenantOccupancyId != null ? "Tenant" : "House"}</td>
                <td className="align-middle">
                  <div className="d-flex gap-1 justify-content-end flex-nowrap">
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleMarkPaid(b)}
                    >
                      <i
                        className={`bi ${b.isPaid ? "bi-x-circle" : "bi-check-circle"}`}
                        aria-hidden
                      />{" "}
                      {b.isPaid ? "Unpaid" : "Paid"}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleViewBill(b)}
                      title={b.hasSnapshot ? "View bill in new tab" : "View bill (may not have HTML)"}
                    >
                      <i className="bi bi-box-arrow-up-right" aria-hidden /> View
                      Bill
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted">No bills for this period.</p>
      )}
    </section>
  );
}
