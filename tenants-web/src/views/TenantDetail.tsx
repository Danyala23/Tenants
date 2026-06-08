"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type {
  Tenant,
  Occupancy,
  RentPayment,
  RentIncreaseRule,
} from "@/lib/types";

export function TenantDetail() {
  const params = useParams();
  const router = useRouter();
  const tenantId = parseInt((params?.id as string) ?? "0", 10);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [occupancies, setOccupancies] = useState<Occupancy[]>([]);
  const [occupancyData, setOccupancyData] = useState<
    Record<
      number,
      { payments: RentPayment[]; rentIncrease: RentIncreaseRule | null }
    >
  >({});
  const [loading, setLoading] = useState(true);
  const [editingIncreaseOccupancyId, setEditingIncreaseOccupancyId] = useState<
    number | null
  >(null);
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
      const [t, occList] = await Promise.all([
        api.tenants.get(tenantId),
        api.occupancies.listByTenant(tenantId),
      ]);
      setTenant(t);
      setOccupancies(occList);

      const data: Record<
        number,
        { payments: RentPayment[]; rentIncrease: RentIncreaseRule | null }
      > = {};
      await Promise.all(
        occList.map(async (occ) => {
          const [payments, rentIncrease] = await Promise.all([
            api.payments.listByOccupancy(occ.id),
            api.rentIncrease.get(occ.id).catch(() => null),
          ]);
          data[occ.id] = { payments, rentIncrease };
        })
      );
      setOccupancyData(data);
    } catch {
      setTenant(null);
      setOccupancies([]);
      setOccupancyData({});
    } finally {
      setLoading(false);
    }
  }

  function openIncreaseModal(occ: Occupancy) {
    const data = occupancyData[occ.id];
    const rule = data?.rentIncrease;
    if (rule) {
      setIncreaseForm({
        increasePercent: rule.increasePercent,
        nextIncreaseDate: rule.nextIncreaseDate.slice(0, 10),
      });
    } else {
      setIncreaseForm({
        increasePercent: 10,
        nextIncreaseDate: new Date().toISOString().slice(0, 10),
      });
    }
    setEditingIncreaseOccupancyId(occ.id);
  }

  async function handleIncreaseSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingIncreaseOccupancyId) return;
    try {
      await api.rentIncrease.update(editingIncreaseOccupancyId, {
        increasePercent: increaseForm.increasePercent,
        nextIncreaseDate: increaseForm.nextIncreaseDate,
      });
      setEditingIncreaseOccupancyId(null);
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  if (loading || !tenant) {
    return (
      <div className="container py-4 page page-tenant-detail">
        {loading ? (
          <div className="loading-page">
            <span className="spinner-ring" aria-hidden />
            <span>Loading tenant…</span>
          </div>
        ) : (
          <p className="text-muted">Tenant not found</p>
        )}
      </div>
    );
  }

  return (
    <div className="container py-4 page page-tenant-detail">
      <button className="btn btn-back mb-3" onClick={() => router.back()}>
        <i className="bi bi-arrow-left" aria-hidden /> Back
      </button>
      <div className="property-header mb-4">
        <span className="avatar-gradient avatar-lg" aria-hidden>
          {tenant.name.charAt(0).toUpperCase()}
        </span>
        <div className="flex-grow-1">
          <h2 className="mb-0">{tenant.name}</h2>
          {tenant.phoneNumber ? (
            <a
              href={`tel:${tenant.phoneNumber}`}
              className="card-text mb-0 d-inline-flex align-items-center gap-1 text-decoration-none"
            >
              <i className="bi bi-telephone" aria-hidden />
              {tenant.phoneNumber}
            </a>
          ) : null}
        </div>
      </div>

      <h5 className="mt-4 mb-3 section-heading">
        <i className="bi bi-layers" aria-hidden />
        Occupancies (Floors)
      </h5>
      {occupancies.map((occ) => {
        const data = occupancyData[occ.id];
        const rentIncrease = data?.rentIncrease ?? null;
        const payments = data?.payments ?? [];
        const now = new Date();
        const isPendingIncrease =
          rentIncrease &&
          (() => {
            const next = new Date(rentIncrease.nextIncreaseDate);
            const monthBefore = new Date(
              next.getFullYear(),
              next.getMonth() - 1,
              1
            );
            return now >= monthBefore && now < next;
          })();

        return (
          <div key={occ.id} className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <strong className="d-inline-flex align-items-center gap-1">
                <i className="bi bi-door-open" aria-hidden />
                {occ.isWholeProperty
                  ? "Whole property"
                  : `Floor ${occ.floorLabel ?? occ.floorId ?? "-"}`}
              </strong>
            </div>
            <div className="card-body">
              <dl className="row mb-0">
                <dt className="col-sm-3">Rent</dt>
                <dd className="col-sm-9">{occ.rent}</dd>
                <dt className="col-sm-3">Security Deposit</dt>
                <dd className="col-sm-9">{occ.securityDeposit}</dd>
                <dt className="col-sm-3">Start Date</dt>
                <dd className="col-sm-9">{occ.startDate.slice(0, 10)}</dd>
              </dl>

              {isPendingIncrease && rentIncrease && (
                <div className="alert alert-warning d-flex justify-content-between align-items-center mt-3 mb-0">
                  <span>
                    Rent increase pending! Next:{" "}
                    {rentIncrease.nextIncreaseDate.slice(0, 10)} (
                    {rentIncrease.increasePercent}%)
                  </span>
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={() => openIncreaseModal(occ)}
                  >
                    <i className="bi bi-arrow-up" aria-hidden /> Adjust
                  </button>
                </div>
              )}

              {rentIncrease && !isPendingIncrease && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <p className="text-muted mb-0">
                    Next increase:{" "}
                    {rentIncrease.nextIncreaseDate.slice(0, 10)} ·{" "}
                    {rentIncrease.increasePercent}%
                  </p>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => openIncreaseModal(occ)}
                  >
                    <i className="bi bi-pencil" aria-hidden /> Edit
                  </button>
                </div>
              )}

              <h6 className="mt-3 d-inline-flex align-items-center gap-1">
                <i className="bi bi-cash-stack" aria-hidden />
                Rent Payments
              </h6>
              <table className="table table-sm table-striped app-table">
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
                          <i
                            className={`bi ${p.isPaid ? "bi-check-circle-fill" : "bi-clock"}`}
                            aria-hidden
                          />
                          {p.isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payments.length === 0 && (
                <p className="text-muted small">No payment records yet.</p>
              )}
            </div>
          </div>
        );
      })}
      {occupancies.length === 0 && (
        <p className="text-muted">No occupancies (floors) assigned.</p>
      )}

      {editingIncreaseOccupancyId !== null && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-inline-flex align-items-center gap-2">
                  <i className="bi bi-percent" aria-hidden />
                  Edit Rent Increase Rule
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditingIncreaseOccupancyId(null)}
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
                    onClick={() => setEditingIncreaseOccupancyId(null)}
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
