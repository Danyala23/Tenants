import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useNotifications } from "../context/NotificationContext";
import type { Property, Floor, Occupancy, Bill } from "../types";

export function PropertyDetail() {
  const { toast, confirm } = useNotifications();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const propertyId = parseInt(id ?? "0", 10);
  const [property, setProperty] = useState<Property | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [occupanciesByFloor, setOccupanciesByFloor] = useState<
    Record<number, Occupancy[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"floors" | "tenants" | "bills">(
    "floors"
  );
  const [floorModal, setFloorModal] = useState(false);
  const [tenantModal, setTenantModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [editingOccupancy, setEditingOccupancy] = useState<Occupancy | null>(null);
  const [floorForm, setFloorForm] = useState({ floorNumber: 0, label: "" });
  const [occupancyForm, setOccupancyForm] = useState({
    name: "",
    phoneNumber: "",
    rent: 0,
    securityDeposit: 0,
    startDate: new Date().toISOString().slice(0, 10),
    floorIds: [] as number[],
    existingTenantId: null as number | null,
  });
  const [bills, setBills] = useState<Bill[]>([]);
  const [billYear, setBillYear] = useState(new Date().getFullYear());
  const [billMonth, setBillMonth] = useState<number | "">("");

  useEffect(() => {
    if (propertyId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function loadData() {
    setLoading(true);
    try {
      const propertyPromise = api.properties.get(propertyId);
      const floorsPromise = api.floors
        .listByProperty(propertyId)
        .catch((error) => {
          console.error("Failed to load floors", error);
          return [] as Floor[];
        });

      const [p, fList] = await Promise.all([propertyPromise, floorsPromise]);
      setProperty(p);
      setFloors(fList);

      const occupancies: Record<number, Occupancy[]> = {};
      await Promise.all(
        fList.map(async (f) => {
          try {
            occupancies[f.id] = await api.occupancies.listByFloor(f.id);
          } catch (error) {
            console.error("Failed to load occupancies for floor", f.id, error);
            occupancies[f.id] = [];
          }
        })
      );
      setOccupanciesByFloor(occupancies);
    } catch (error) {
      console.error("Failed to load property", error);
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
    const ok = await confirm({
      message: "Delete this floor and its tenants?",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await api.floors.delete(floorId);
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  function openTenantCreate( preselectedFloorId?: number) {
    setTenantModal(true);
    setEditingOccupancy(null);
    setOccupancyForm({
      name: "",
      phoneNumber: "",
      rent: 0,
      securityDeposit: 0,
      startDate: new Date().toISOString().slice(0, 10),
      floorIds: preselectedFloorId ? [preselectedFloorId] : [],
      existingTenantId: null,
    });
  }

  function openOccupancyEdit(occ: Occupancy) {
    setTenantModal(true);
    setEditingOccupancy(occ);
    setOccupancyForm({
      name: occ.tenantName,
      phoneNumber: occ.tenantPhone,
      rent: occ.rent,
      securityDeposit: occ.securityDeposit,
      startDate: occ.startDate.slice(0, 10),
      floorIds:
        occ.floorId != null ? [occ.floorId] : floors.length > 0 ? [floors[0].id] : [],
      existingTenantId: null,
    });
  }

  function toggleFloorInForm(floorId: number) {
    setOccupancyForm((f) => ({
      ...f,
      floorIds: f.floorIds.includes(floorId)
        ? f.floorIds.filter((id) => id !== floorId)
        : [...f.floorIds, floorId],
    }));
  }

  async function handleOccupancySubmit(e: React.FormEvent) {
    e.preventDefault();
    const floorIds = occupancyForm.floorIds;
    if (floorIds.length === 0) {
      toast({ message: "Select at least one floor.", type: "warning" });
      return;
    }
    try {
      if (editingOccupancy) {
        await api.occupancies.update(editingOccupancy.id, {
          floorId: floorIds[0],
          rent: occupancyForm.rent,
          securityDeposit: occupancyForm.securityDeposit,
          startDate: occupancyForm.startDate,
        });
        await api.tenants.update(editingOccupancy.tenantId, {
          name: occupancyForm.name,
          phoneNumber: occupancyForm.phoneNumber,
        });
      } else {
        const rentPerFloor = occupancyForm.rent / floorIds.length;
        const securityDepositPerFloor = occupancyForm.securityDeposit / floorIds.length;

        if (occupancyForm.existingTenantId) {
          for (const floorId of floorIds) {
            await api.occupancies.create(propertyId, {
              tenantId: occupancyForm.existingTenantId,
              floorId,
              rent: rentPerFloor,
              securityDeposit: securityDepositPerFloor,
              startDate: occupancyForm.startDate,
            });
          }
        } else {
          const tenant = await api.tenants.create({
            name: occupancyForm.name,
            phoneNumber: occupancyForm.phoneNumber,
          });
          for (const floorId of floorIds) {
            await api.occupancies.create(propertyId, {
              tenantId: tenant.id,
              floorId,
              rent: rentPerFloor,
              securityDeposit: securityDepositPerFloor,
              startDate: occupancyForm.startDate,
            });
          }
        }
      }
      setTenantModal(false);
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

  async function handleOccupancyDelete(occ: Occupancy) {
    const ok = await confirm({
      message: `Remove ${occ.tenantName} from this floor?`,
      confirmLabel: "Remove",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await api.occupancies.delete(occ.id);
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
            <i className="bi bi-arrow-left me-1" aria-hidden />
            Back
          </button>
          <h2>
            <i className="bi bi-building me-2" aria-hidden />
            {property.houseNumber} — {property.address}
          </h2>
          <p className="text-muted">
            <i className="bi bi-arrows-angle-expand me-1" aria-hidden />
            Size: {property.size} sq ft
          </p>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3 app-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "floors" ? "active" : ""}`}
            onClick={() => setActiveTab("floors")}
          >
            <i className="bi bi-layers me-1" aria-hidden />
            Floors
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "tenants" ? "active" : ""}`}
            onClick={() => setActiveTab("tenants")}
          >
            <i className="bi bi-people me-1" aria-hidden />
            Tenants
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "bills" ? "active" : ""}`}
            onClick={() => setActiveTab("bills")}
          >
            <i className="bi bi-receipt me-1" aria-hidden />
            Bills
          </button>
        </li>
      </ul>

      {activeTab === "floors" && (
        <div>
          <div className="d-flex justify-content-between mb-3">
            <h5>
              <i className="bi bi-layers me-1" aria-hidden />
              Floors
            </h5>
            <button
              className="btn btn-sm btn-primary"
              onClick={openFloorCreate}
            >
              <i className="bi bi-plus-lg me-1" aria-hidden />
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
                  <td>{(occupanciesByFloor[f.id] ?? []).length}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-secondary me-1"
                      onClick={() => openFloorEdit(f)}
                    >
                      <i className="bi bi-pencil me-1" aria-hidden />
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleFloorDelete(f.id)}
                    >
                      <i className="bi bi-trash me-1" aria-hidden />
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
                  <i className="bi bi-person-plus me-1" aria-hidden />
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
                  {(occupanciesByFloor[f.id] ?? []).map((occ) => (
                    <tr key={occ.id}>
                      <td>{occ.tenantName}</td>
                      <td>{occ.tenantPhone}</td>
                      <td>{occ.rent}</td>
                      <td>{occ.startDate.slice(0, 10)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => navigate(`/tenants/${occ.tenantId}`)}
                        >
                          <i className="bi bi-eye me-1" aria-hidden />
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary me-1"
                          onClick={() => openOccupancyEdit(occ)}
                        >
                          <i className="bi bi-pencil me-1" aria-hidden />
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleOccupancyDelete(occ)}
                        >
                          <i className="bi bi-person-x me-1" aria-hidden />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(occupanciesByFloor[f.id] ?? []).length === 0 && (
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
              <i className="bi bi-arrow-clockwise me-1" aria-hidden />
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
                      <i className={`bi ${b.isPaid ? "bi-check-circle" : "bi-clock"} me-1`} aria-hidden />
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
                  <i className={`bi ${editingFloor ? "bi-pencil" : "bi-plus-lg"} me-2`} aria-hidden />
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

      {tenantModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi ${editingOccupancy ? "bi-pencil" : "bi-person-plus"} me-2`} aria-hidden />
                  {editingOccupancy ? "Edit Occupancy" : "Add Tenant"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setTenantModal(false)}
                />
              </div>
              <form onSubmit={handleOccupancySubmit}>
                <div className="modal-body">
                  <div className="mb-2">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={occupancyForm.name}
                      onChange={(e) =>
                        setOccupancyForm((f) => ({ ...f, name: e.target.value }))
                      }
                      disabled={!!occupancyForm.existingTenantId}
                      required={!occupancyForm.existingTenantId}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={occupancyForm.phoneNumber}
                      onChange={(e) =>
                        setOccupancyForm((f) => ({
                          ...f,
                          phoneNumber: e.target.value,
                        }))
                      }
                      disabled={!!occupancyForm.existingTenantId}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">
                      {editingOccupancy ? "Floor" : "Floors"}
                    </label>
                    {editingOccupancy ? (
                      <select
                        className="form-select"
                        value={
                          occupancyForm.floorIds[0] ?? ""
                        }
                        onChange={(e) =>
                          setOccupancyForm((f) => ({
                            ...f,
                            floorIds: e.target.value
                              ? [parseInt(e.target.value)]
                              : [],
                          }))
                        }
                      >
                        {floors.map((f) => (
                          <option key={f.id} value={f.id}>
                            Floor {f.floorNumber} {f.label ? `(${f.label})` : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <div className="d-flex flex-wrap gap-2">
                          {floors.map((f) => (
                            <label
                              key={f.id}
                              className="form-check form-check-inline"
                            >
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={occupancyForm.floorIds.includes(f.id)}
                                onChange={() => toggleFloorInForm(f.id)}
                              />
                              <span className="form-check-label">
                                {f.floorNumber}{" "}
                                {f.label ? `(${f.label})` : ""}
                              </span>
                            </label>
                          ))}
                        </div>
                        <small className="text-muted">
                          Select one or more floors for this tenant.
                        </small>
                      </>
                    )}
                  </div>
                  <div className="mb-2">
                    <label className="form-label">
                      Rent {!editingOccupancy && occupancyForm.floorIds.length > 1 ? "(total)" : ""}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={occupancyForm.rent || ""}
                      onChange={(e) =>
                        setOccupancyForm((f) => ({
                          ...f,
                          rent: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">
                      Security Deposit {!editingOccupancy && occupancyForm.floorIds.length > 1 ? "(total)" : ""}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={occupancyForm.securityDeposit || ""}
                      onChange={(e) =>
                        setOccupancyForm((f) => ({
                          ...f,
                          securityDeposit: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                    {!editingOccupancy &&
                      occupancyForm.floorIds.length > 1 && (
                        <small className="text-muted d-block mt-1">
                          Split across {occupancyForm.floorIds.length} floors: {(occupancyForm.rent / occupancyForm.floorIds.length).toFixed(2)} rent and {(occupancyForm.securityDeposit / occupancyForm.floorIds.length).toFixed(2)} deposit per floor
                        </small>
                      )}
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={occupancyForm.startDate}
                      onChange={(e) =>
                        setOccupancyForm((f) => ({
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
                    onClick={() => setTenantModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingOccupancy ? "Save" : "Add"}
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
