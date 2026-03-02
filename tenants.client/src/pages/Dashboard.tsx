import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Property } from "../types";

export function Dashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState({ houseNumber: "", address: "", size: 0 });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    try {
      const list = await api.properties.list();
      setProperties(list);
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
    if (!confirm("Delete this property and all its floors and tenants?"))
      return;
    try {
      await api.properties.delete(id);
      loadProperties();
    } catch {
      setError("Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="container py-5">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container py-4 page page-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4 page-header">
        <h2>Properties</h2>
        <button className="btn btn-primary btn-glow" onClick={openCreate}>
          Add Property
        </button>
      </div>

      {error && !showModal && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3">
        {properties.map((p) => (
          <div key={p.id} className="col-md-6 col-lg-4">
            <div className="card h-100 app-card">
              <div className="card-body">
                <h5 className="card-title">
                  {p.houseNumber} — {p.address}
                </h5>
                <p className="card-text text-muted small">
                  Size: {p.size} sq ft
                </p>
                <div className="d-flex gap-2 mt-3">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => navigate(`/properties/${p.id}`)}
                  >
                    View
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => openEdit(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {properties.length === 0 && (
        <p className="text-muted">No properties yet. Add one to get started.</p>
      )}

      {showModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
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
                    <label className="form-label">Size (sq ft)</label>
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
