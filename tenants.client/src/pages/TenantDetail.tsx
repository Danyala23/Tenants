import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Tenant, RentPayment, RentIncreaseRule } from "../types";

export function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tenantId = parseInt(id ?? "0", 10);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [rentIncrease, setRentIncrease] = useState<RentIncreaseRule | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showIncreaseModal, setShowIncreaseModal] = useState(false);
  const [increaseForm, setIncreaseForm] = useState({
    increasePercent: 10,
    nextIncreaseDate: "",
  });

  useEffect(() => {
    if (tenantId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  async function loadData() {
    try {
      const [t, pList, inc] = await Promise.all([
        api.tenants.get(tenantId),
        api.payments.listByTenant(tenantId),
        api.rentIncrease.get(tenantId).catch(() => null),
      ]);
      setTenant(t);
      setPayments(pList);
      setRentIncrease(inc);
      if (inc) {
        setIncreaseForm({
          increasePercent: inc.increasePercent,
          nextIncreaseDate: inc.nextIncreaseDate.slice(0, 10),
        });
      }
    } catch {
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const isPendingIncrease =
    rentIncrease &&
    (() => {
      const next = new Date(rentIncrease.nextIncreaseDate);
      const monthBefore = new Date(next.getFullYear(), next.getMonth() - 1, 1);
      return now >= monthBefore && now < next;
    })();

  async function handleIncreaseSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.rentIncrease.update(tenantId, {
        increasePercent: increaseForm.increasePercent,
        nextIncreaseDate: increaseForm.nextIncreaseDate,
      });
      setShowIncreaseModal(false);
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  if (loading || !tenant) {
    return (
      <div className="container py-5">
        <p className="text-muted">
          {loading ? "Loading..." : "Tenant not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="container py-4 page page-tenant-detail">
      <button
        className="btn btn-link text-decoration-none p-0 mb-3"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
      <h2>{tenant.name}</h2>
      <p className="text-muted">
        Floor ID: {tenant.floorId} · Phone: {tenant.phoneNumber}
      </p>
      <dl className="row">
        <dt className="col-sm-2">Rent</dt>
        <dd className="col-sm-10">{tenant.rent}</dd>
        <dt className="col-sm-2">Security Deposit</dt>
        <dd className="col-sm-10">{tenant.securityDeposit}</dd>
        <dt className="col-sm-2">Start Date</dt>
        <dd className="col-sm-10">{tenant.startDate.slice(0, 10)}</dd>
      </dl>

      {isPendingIncrease && (
        <div className="alert alert-warning d-flex justify-content-between align-items-center">
          <span>
            Rent increase pending! Next increase:{" "}
            {rentIncrease!.nextIncreaseDate.slice(0, 10)} (
            {rentIncrease!.increasePercent}%)
          </span>
          <button
            className="btn btn-sm btn-warning"
            onClick={() => setShowIncreaseModal(true)}
          >
            Adjust
          </button>
        </div>
      )}

      {rentIncrease && !isPendingIncrease && (
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5>Rent Increase Rule</h5>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setShowIncreaseModal(true)}
            >
              Edit
            </button>
          </div>
          <p className="text-muted mb-0">
            Next increase: {rentIncrease.nextIncreaseDate.slice(0, 10)} ·{" "}
            {rentIncrease.increasePercent}%
          </p>
        </div>
      )}

      <h5 className="mt-4">Rent Payments</h5>
      <table className="table table-striped app-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Month</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>{p.year}</td>
              <td>{p.month}</td>
              <td>
                <span
                  className={`badge ${
                    p.isPaid ? "bg-success" : "bg-secondary"
                  }`}
                >
                  {p.isPaid ? "Paid" : "Unpaid"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {payments.length === 0 && (
        <p className="text-muted">No payment records yet.</p>
      )}

      {showIncreaseModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Rent Increase Rule</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowIncreaseModal(false)}
                />
              </div>
              <form onSubmit={handleIncreaseSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Increase %</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={increaseForm.increasePercent}
                      onChange={(e) =>
                        setIncreaseForm((f) => ({
                          ...f,
                          increasePercent: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Next Increase Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={increaseForm.nextIncreaseDate}
                      onChange={(e) =>
                        setIncreaseForm((f) => ({
                          ...f,
                          nextIncreaseDate: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowIncreaseModal(false)}
                  >
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
      )}
    </div>
  );
}
