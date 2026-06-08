"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useNotifications } from "@/context/NotificationContext";
import type { Property, BillSummary } from "@/lib/types";

export function Dashboard() {
  const { confirm } = useNotifications();
  const [properties, setProperties] = useState<Property[]>([]);
  const [billSummaryByProperty, setBillSummaryByProperty] = useState<Record<number, BillSummary>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState({ houseNumber: "", address: "", size: 0 });
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    try {
      const [list, summary] = await Promise.all([
        api.properties.list(),
        api.bills.billSummary().catch(() => [] as BillSummary[]),
      ]);
      setProperties(list);
      setBillSummaryByProperty(
        Object.fromEntries((summary as BillSummary[]).map((s) => [s.propertyId, s]))
      );
    } catch {
      setError("Failed to load properties");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ houseNumber: "", address: "", size: 0 });
    setError("");
    setShowModal(true);
  }

  function openEdit(p: Property) {
    setEditing(p);
    setForm({ houseNumber: p.houseNumber, address: p.address, size: p.size });
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await api.properties.update(editing.id, form);
      } else {
        await api.properties.create(form);
      }
      closeModal();
      loadProperties();
    } catch {
      setError("Failed to save property");
    }
  }

  async function handleDelete(id: number) {
    const ok = await confirm({
      message: "Delete this property and all its floors and tenants?",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await api.properties.delete(id);
      loadProperties();
    } catch {
      setError("Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="container py-4 page page-dashboard">
        <div className="loading-page">
          <span className="spinner-ring" aria-hidden />
          <span>Loading your properties…</span>
        </div>
      </div>
    );
  }

  const summaries = Object.values(billSummaryByProperty);
  const totalUnpaid = summaries.reduce((s, x) => s + (x.unpaidCount ?? 0), 0);
  const attentionCount = summaries.filter((x) => (x.unpaidCount ?? 0) > 0).length;

  return (
    <div className="container py-4 page page-dashboard">
      <div className="d-flex justify-content-between align-items-start mb-4 page-header gap-3 flex-wrap">
        <div>
          <h2 className="page-title">
            <i className="bi bi-houses" aria-hidden />
            Properties
          </h2>
          <p className="page-subtitle">
            Manage your portfolio, tenants and utility bills in one place.
          </p>
        </div>
        <button className="btn btn-primary btn-glow" onClick={openCreate}>
          <i className="bi bi-plus-lg" aria-hidden /> Add Property
        </button>
      </div>

      {error && !showModal && <div className="alert alert-danger">{error}</div>}

      {properties.length > 0 && (
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-icon tone-primary">
              <i className="bi bi-buildings" aria-hidden />
            </span>
            <div className="stat-value">{properties.length}</div>
            <div className="stat-label">Properties</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon tone-danger">
              <i className="bi bi-receipt" aria-hidden />
            </span>
            <div className="stat-value">{totalUnpaid}</div>
            <div className="stat-label">Unpaid bills</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon tone-accent">
              <i className="bi bi-exclamation-triangle" aria-hidden />
            </span>
            <div className="stat-value">{attentionCount}</div>
            <div className="stat-label">Need attention</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon tone-success">
              <i className="bi bi-check2-circle" aria-hidden />
            </span>
            <div className="stat-value">{properties.length - attentionCount}</div>
            <div className="stat-label">All settled</div>
          </div>
        </div>
      )}

      <div className="row g-3">
        {properties.map((p) => {
          const summary = billSummaryByProperty[p.id];
          const hasUnpaid = summary && summary.unpaidCount > 0;
          return (
            <div key={p.id} className="col-md-6 col-lg-4">
              <div className="card h-100 app-card">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-start gap-3 mb-2">
                    <span className="stat-icon tone-primary mb-0 flex-shrink-0">
                      <i className="bi bi-house-door" aria-hidden />
                    </span>
                    <div className="flex-grow-1 min-w-0">
                      <h5 className="card-title mb-1">{p.houseNumber}</h5>
                      <p className="card-text text-muted small mb-0 d-inline-flex align-items-center gap-1">
                        <i className="bi bi-geo-alt" aria-hidden />
                        {p.address}
                      </p>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <span className="badge bg-secondary">
                      <i className="bi bi-rulers" aria-hidden />
                      {p.size} Marla{p.size !== 1 ? "s" : ""}
                    </span>
                    {summary && summary.totalCount > 0 ? (
                      hasUnpaid ? (
                        <span className="badge bg-danger">
                          <i className="bi bi-exclamation-circle" aria-hidden />
                          {summary.unpaidCount} unpaid
                        </span>
                      ) : (
                        <span className="badge bg-success">
                          <i className="bi bi-check-circle" aria-hidden /> All paid
                        </span>
                      )
                    ) : null}
                  </div>

                  <div className="d-flex gap-2 mt-auto">
                    <button
                      className="btn btn-sm btn-primary flex-grow-1"
                      onClick={() => router.push(`/properties/${p.id}`)}
                    >
                      <i className="bi bi-arrow-right-circle" aria-hidden /> Open
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => openEdit(p)}
                      title="Edit property"
                      aria-label="Edit property"
                    >
                      <i className="bi bi-pencil" aria-hidden />
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(p.id)}
                      title="Delete property"
                      aria-label="Delete property"
                    >
                      <i className="bi bi-trash" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {properties.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">
            <i className="bi bi-houses" aria-hidden />
          </span>
          <h5 className="mb-1">No properties yet</h5>
          <p className="mb-3">Add your first property to start tracking tenants and bills.</p>
          <button className="btn btn-primary btn-glow" onClick={openCreate}>
            <i className="bi bi-plus-lg" aria-hidden /> Add Property
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-inline-flex align-items-center gap-2">
                  <i
                    className={`bi ${editing ? "bi-pencil" : "bi-plus-lg"}`}
                    aria-hidden
                  />
                  {editing ? "Edit Property" : "Add Property"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger py-2">{error}</div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">House Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.houseNumber}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, houseNumber: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.address}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, address: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Size (Marlas)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      value={form.size || ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          size: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editing ? "Save" : "Add"}
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
