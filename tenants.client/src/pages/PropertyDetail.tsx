import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Property, Floor, Tenant, Bill } from "../types";

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const propertyId = parseInt(id ?? "0", 10);
  const [property, setProperty] = useState<Property | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tenantsByFloor, setTenantsByFloor] = useState<
    Record<number, Tenant[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"floors" | "tenants" | "bills">(
    "floors"
  );
  const [floorModal, setFloorModal] = useState(false);
  const [tenantModal, setTenantModal] = useState<number | null>(null);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [floorForm, setFloorForm] = useState({ floorNumber: 0, label: "" });
  const [tenantForm, setTenantForm] = useState({
    name: "",
    phoneNumber: "",
    rent: 0,
    securityDeposit: 0,
    startDate: new Date().toISOString().slice(0, 10),
  });
  const [bills, setBills] = useState<Bill[]>([]);
  const [billYear, setBillYear] = useState(new Date().getFullYear());
  const [billMonth, setBillMonth] = useState<number | "">("");

  useEffect(() => {
    if (propertyId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function loadData() {
    try {
      const [p, fList] = await Promise.all([
        api.properties.get(propertyId),
        api.floors.listByProperty(propertyId),
      ]);
      setProperty(p);
      setFloors(fList);
      const tenants: Record<number, Tenant[]> = {};
      await Promise.all(
        fList.map(async (f) => {
          tenants[f.id] = await api.tenants.listByFloor(f.id);
        })
      );
      setTenantsByFloor(tenants);
    } catch {
      setProperty(null);
    } finally {
      setLoading(false);
    }
  }

  function openFloorCreate() {
    setEditingFloor(null);
    setFloorForm({ floorNumber: floors.length, label: "" });
    setFloorModal(true);
  }

  function openFloorEdit(f: Floor) {
    setEditingFloor(f);
    setFloorForm({ floorNumber: f.floorNumber, label: f.label });
    setFloorModal(true);
  }

  async function handleFloorSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingFloor) {
        await api.floors.update(editingFloor.id, floorForm);
      } else {
        await api.floors.create(propertyId, floorForm);
      }
      setFloorModal(false);
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleFloorDelete(floorId: number) {
    if (!confirm("Delete this floor and its tenants?")) return;
    try {
      await api.floors.delete(floorId);
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  function openTenantCreate(floorId: number) {
    setTenantModal(floorId);
    setEditingTenant(null);
    setTenantForm({
      name: "",
      phoneNumber: "",
      rent: 0,
      securityDeposit: 0,
      startDate: new Date().toISOString().slice(0, 10),
    });
  }

  function openTenantEdit(t: Tenant) {
    setTenantModal(t.floorId);
    setEditingTenant(t);
    setTenantForm({
      name: t.name,
      phoneNumber: t.phoneNumber,
      rent: t.rent,
      securityDeposit: t.securityDeposit,
      startDate: t.startDate.slice(0, 10),
    });
  }

  async function handleTenantSubmit(e: React.FormEvent) {
    e.preventDefault();
    const floorId = tenantModal!;
    try {
      if (editingTenant) {
        await api.tenants.update(editingTenant.id, tenantForm);
      } else {
        await api.tenants.create(floorId, tenantForm);
      }
      setTenantModal(null);
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  async function loadBills() {
    try {
      const list = await api.bills.list(
        propertyId,
        billYear,
        billMonth === "" ? undefined : (billMonth as number)
      );
      setBills(list);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (activeTab === "bills" && propertyId) {
      loadBills();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, propertyId, billYear, billMonth]);

  async function handleTenantDelete(t: Tenant) {
    if (!confirm("Delete this tenant?")) return;
    try {
      await api.tenants.delete(t.id);
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  if (loading || !property) {
    return (
      <div className="container py-5">
        <p className="text-muted">
          {loading ? "Loading..." : "Property not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="container py-4 page page-property-detail">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button
            className="btn btn-link text-decoration-none p-0 mb-2"
            onClick={() => navigate("/")}
          >
            ← Back
          </button>
          <h2>
            {property.houseNumber} — {property.address}
          </h2>
          <p className="text-muted">Size: {property.size} sq ft</p>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3 app-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "floors" ? "active" : ""}`}
            onClick={() => setActiveTab("floors")}
          >
            Floors
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "tenants" ? "active" : ""}`}
            onClick={() => setActiveTab("tenants")}
          >
            Tenants
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "bills" ? "active" : ""}`}
            onClick={() => setActiveTab("bills")}
          >
            Bills
          </button>
        </li>
      </ul>

      {activeTab === "floors" && (
        <div>
          <div className="d-flex justify-content-between mb-3">
            <h5>Floors</h5>
            <button
              className="btn btn-sm btn-primary"
              onClick={openFloorCreate}
            >
              Add Floor
            </button>
          </div>
          <table className="table table-striped app-table">
            <thead>
              <tr>
                <th>Floor #</th>
                <th>Label</th>
                <th>Tenants</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {floors.map((f) => (
                <tr key={f.id}>
                  <td>{f.floorNumber}</td>
                  <td>{f.label || "-"}</td>
                  <td>{(tenantsByFloor[f.id] ?? []).length}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-secondary me-1"
                      onClick={() => openFloorEdit(f)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleFloorDelete(f.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {floors.length === 0 && (
            <p className="text-muted">No floors. Add one to get started.</p>
          )}
        </div>
      )}

      {activeTab === "tenants" && (
        <div>
          {floors.map((f) => (
            <div key={f.id} className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5>
                  Floor {f.floorNumber} {f.label && `(${f.label})`}
                </h5>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => openTenantCreate(f.id)}
                >
                  Add Tenant
                </button>
              </div>
              <table className="table table-striped app-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Rent</th>
                    <th>Start Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(tenantsByFloor[f.id] ?? []).map((t) => (
                    <tr key={t.id}>
                      <td>{t.name}</td>
                      <td>{t.phoneNumber}</td>
                      <td>{t.rent}</td>
                      <td>{t.startDate.slice(0, 10)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => navigate(`/tenants/${t.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary me-1"
                          onClick={() => openTenantEdit(t)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleTenantDelete(t)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(tenantsByFloor[f.id] ?? []).length === 0 && (
                <p className="text-muted small">No tenants on this floor.</p>
              )}
            </div>
          ))}
          {floors.length === 0 && (
            <p className="text-muted">Add floors first to manage tenants.</p>
          )}
        </div>
      )}

      {activeTab === "bills" && (
        <div>
          <div className="d-flex gap-2 mb-3 align-items-center">
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={billYear}
              onChange={(e) => setBillYear(parseInt(e.target.value))}
            >
              {[new Date().getFullYear(), new Date().getFullYear() - 1].map(
                (y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                )
              )}
            </select>
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={billMonth}
              onChange={(e) =>
                setBillMonth(
                  e.target.value === "" ? "" : parseInt(e.target.value)
                )
              }
            >
              <option value="">All months</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString("default", {
                    month: "short",
                  })}
                </option>
              ))}
            </select>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={loadBills}
            >
              Refresh
            </button>
          </div>
          <table className="table table-striped app-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Year</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id}>
                  <td>{b.type}</td>
                  <td>{b.year}</td>
                  <td>{b.month}</td>
                  <td>{b.amount}</td>
                  <td>
                    <span
                      className={`badge ${
                        b.isPaid ? "bg-success" : "bg-secondary"
                      }`}
                    >
                      {b.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td>{b.tenantId != null ? "Tenant" : "House"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bills.length === 0 && (
            <p className="text-muted">
              No bills for this period. Bill creation will be implemented in a
              future update.
            </p>
          )}
        </div>
      )}

      {floorModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingFloor ? "Edit Floor" : "Add Floor"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setFloorModal(false)}
                />
              </div>
              <form onSubmit={handleFloorSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Floor Number</label>
                    <input
                      type="number"
                      className="form-control"
                      value={floorForm.floorNumber}
                      onChange={(e) =>
                        setFloorForm((f) => ({
                          ...f,
                          floorNumber: parseInt(e.target.value) || 0,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Label</label>
                    <input
                      type="text"
                      className="form-control"
                      value={floorForm.label}
                      onChange={(e) =>
                        setFloorForm((f) => ({ ...f, label: e.target.value }))
                      }
                      placeholder="e.g. Ground, 1st"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setFloorModal(false)}
                  >
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
      )}

      {tenantModal !== null && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingTenant ? "Edit Tenant" : "Add Tenant"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setTenantModal(null)}
                />
              </div>
              <form onSubmit={handleTenantSubmit}>
                <div className="modal-body">
                  <div className="mb-2">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={tenantForm.name}
                      onChange={(e) =>
                        setTenantForm((f) => ({ ...f, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={tenantForm.phoneNumber}
                      onChange={(e) =>
                        setTenantForm((f) => ({
                          ...f,
                          phoneNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Rent</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={tenantForm.rent || ""}
                      onChange={(e) =>
                        setTenantForm((f) => ({
                          ...f,
                          rent: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Security Deposit</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={tenantForm.securityDeposit || ""}
                      onChange={(e) =>
                        setTenantForm((f) => ({
                          ...f,
                          securityDeposit: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={tenantForm.startDate}
                      onChange={(e) =>
                        setTenantForm((f) => ({
                          ...f,
                          startDate: e.target.value,
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
                    onClick={() => setTenantModal(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingTenant ? "Save" : "Add"}
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
