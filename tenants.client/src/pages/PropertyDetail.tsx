import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useNotifications } from "../context/NotificationContext";
import type {
  Property,
  Floor,
  Occupancy,
  Bill,
  RentPayment,
  RentIncreaseRule,
  UtilityConnection,
} from "../types";

function monthLabel(month: number, year?: number) {
  const s = new Date(year ?? 2000, month - 1).toLocaleString("default", {
    month: "short",
  });
  return year != null ? `${s} ${year}` : s;
}

function getPreviousMonth(year: number, month: number) {
  return month === 1
    ? { year: year - 1, month: 12 }
    : { year, month: month - 1 };
}

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
  const [paymentsByOccupancy, setPaymentsByOccupancy] = useState<
    Record<number, RentPayment[]>
  >({});
  const [rentIncreaseByOccupancy, setRentIncreaseByOccupancy] = useState<
    Record<number, RentIncreaseRule | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [expandedHistory, setExpandedHistory] = useState<Set<number>>(
    new Set()
  );

  const [floorModal, setFloorModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [floorForm, setFloorForm] = useState({ floorNumber: 0, label: "" });

  const [tenantModal, setTenantModal] = useState(false);
  const [editingOccupancy, setEditingOccupancy] = useState<Occupancy | null>(
    null
  );
  const [occupancyForm, setOccupancyForm] = useState({
    name: "",
    phoneNumber: "",
    rent: 0,
    securityDeposit: 0,
    startDate: new Date().toISOString().slice(0, 10),
    floorIds: [] as number[],
    existingTenantId: null as number | null,
  });

  const [editingIncreaseOccupancyId, setEditingIncreaseOccupancyId] = useState<
    number | null
  >(null);
  const [increaseForm, setIncreaseForm] = useState({
    increasePercent: 10,
    nextIncreaseDate: "",
  });

  const [collectModal, setCollectModal] = useState<{
    occId: number;
    rent: number;
    dues: number;
  } | null>(null);
  const [collectAmount, setCollectAmount] = useState(0);

  const [bills, setBills] = useState<Bill[]>([]);
  const [billYear, setBillYear] = useState(new Date().getFullYear());
  const [billMonth, setBillMonth] = useState<number | "">("");
  const [utilityConnections, setUtilityConnections] = useState<
    UtilityConnection[]
  >([]);
  const [utilityModal, setUtilityModal] = useState(false);
  const [editingUtility, setEditingUtility] = useState<UtilityConnection | null>(
    null
  );
  const [utilityForm, setUtilityForm] = useState({
    floorId: null as number | null,
    type: "Electricity" as string,
    referenceNumber: "",
    consumerNumber: "",
    providerName: "",
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  useEffect(() => {
    if (propertyId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function loadData() {
    setLoading(true);
    try {
      const [p, fList] = await Promise.all([
        api.properties.get(propertyId),
        api.floors.listByProperty(propertyId).catch(() => [] as Floor[]),
      ]);
      setProperty(p);
      setFloors(fList);

      const occupancies: Record<number, Occupancy[]> = {};
      const allOccupancies: Occupancy[] = [];

      await Promise.all(
        fList.map(async (f) => {
          try {
            const occs = await api.occupancies.listByFloor(f.id);
            occupancies[f.id] = occs;
            allOccupancies.push(...occs);
          } catch {
            occupancies[f.id] = [];
          }
        })
      );
      setOccupanciesByFloor(occupancies);

      const payments: Record<number, RentPayment[]> = {};
      const increases: Record<number, RentIncreaseRule | null> = {};

      await Promise.all(
        allOccupancies.map(async (occ) => {
          const [pmts, ri] = await Promise.all([
            api.payments.listByOccupancy(occ.id).catch(() => []),
            api.rentIncrease.get(occ.id).catch(() => null),
          ]);
          payments[occ.id] = pmts;
          increases[occ.id] = ri;
        })
      );
      setPaymentsByOccupancy(payments);
      setRentIncreaseByOccupancy(increases);

      try {
        const [billList, connList] = await Promise.all([
          api.bills.list(
            propertyId,
            billYear,
            billMonth === "" ? undefined : (billMonth as number)
          ),
          api.utilityConnections.listByProperty(propertyId).catch(() => []),
        ]);
        setBills(billList);
        setUtilityConnections(connList);
      } catch {
        /* ignore */
      }
    } catch {
      setProperty(null);
    } finally {
      setLoading(false);
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
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (propertyId && !loading) loadBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billYear, billMonth]);

  function getPayment(
    occId: number,
    year: number,
    month: number
  ): RentPayment | undefined {
    return (paymentsByOccupancy[occId] ?? []).find(
      (p) => p.year === year && p.month === month
    );
  }

  function getDues(occId: number, rent: number): number {
    const prev = getPreviousMonth(currentYear, currentMonth);
    const prevPayment = getPayment(occId, prev.year, prev.month);
    if (!prevPayment) return 0;
    const shortfall = rent - prevPayment.amountPaid;
    return shortfall > 0 ? shortfall : 0;
  }

  function toggleHistory(occId: number) {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      if (next.has(occId)) next.delete(occId);
      else next.add(occId);
      return next;
    });
  }

  /* ── Collect rent ── */

  function openCollectModal(occId: number, rent: number) {
    const dues = getDues(occId, rent);
    setCollectModal({ occId, rent, dues });
    setCollectAmount(rent + dues);
  }

  async function handleCollect(e: React.FormEvent) {
    e.preventDefault();
    if (!collectModal) return;
    try {
      await api.payments.collect(collectModal.occId, {
        year: currentYear,
        month: currentMonth,
        amountPaid: collectAmount,
      });
      setCollectModal(null);
      toast({ message: "Rent collected successfully.", type: "success" });
      loadData();
    } catch (error) {
      console.error(error);
      toast({ message: "Failed to collect rent.", type: "error" });
    }
  }

  /* ── Floor handlers ── */

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

  /* ── Tenant / Occupancy handlers ── */

  function openTenantCreate(preselectedFloorId?: number) {
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
        occ.floorId != null
          ? [occ.floorId]
          : floors.length > 0
            ? [floors[0].id]
            : [],
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
        const depositPerFloor =
          occupancyForm.securityDeposit / floorIds.length;

        if (occupancyForm.existingTenantId) {
          for (const floorId of floorIds) {
            await api.occupancies.create(propertyId, {
              tenantId: occupancyForm.existingTenantId,
              floorId,
              rent: rentPerFloor,
              securityDeposit: depositPerFloor,
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
              securityDeposit: depositPerFloor,
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

  /* ── Rent increase handlers ── */

  function openIncreaseModal(occId: number) {
    const rule = rentIncreaseByOccupancy[occId];
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
    setEditingIncreaseOccupancyId(occId);
  }

  async function handleIncreaseSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingIncreaseOccupancyId) return;
    try {
      await api.rentIncrease.update(editingIncreaseOccupancyId, increaseForm);
      setEditingIncreaseOccupancyId(null);
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  /* ── Render ── */

  if (loading || !property) {
    return (
      <div className="container-fluid py-5 page-property-detail">
        <p className="text-muted">
          {loading ? "Loading..." : "Property not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 page page-property-detail">
      {/* Header */}
      <button
        className="btn btn-back mb-3"
        onClick={() => navigate("/")}
      >
        <i className="bi bi-arrow-left" aria-hidden /> Back
      </button>
      <div className="property-header mb-4">
        <h2 className="d-inline-flex align-items-center gap-2">
          <i className="bi bi-building" aria-hidden />
          {property.houseNumber} — {property.address}
        </h2>
        <span className="property-size d-inline-flex align-items-center gap-1">
          <i className="bi bi-arrows-angle-expand" aria-hidden />
          Size: {property.size} sq ft
        </span>
      </div>

      {/* ── Floors + Utility Connections (side by side) ── */}
      <div className="detail-grid mb-4">
        <section>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 section-heading">
              <i className="bi bi-layers" aria-hidden /> Floors
            </h5>
            <button className="btn btn-sm btn-primary" onClick={openFloorCreate}>
              <i className="bi bi-plus-lg" aria-hidden /> Add Floor
            </button>
          </div>
          {floors.length > 0 ? (
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
                    <td>{f.label || "—"}</td>
                    <td>{(occupanciesByFloor[f.id] ?? []).length}</td>
                    <td>
                      <div className="d-flex gap-1 justify-content-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openFloorEdit(f)}
                        >
                          <i className="bi bi-pencil" aria-hidden /> Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleFloorDelete(f.id)}
                        >
                          <i className="bi bi-trash" aria-hidden /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">No floors yet. Add one to get started.</p>
          )}
        </section>

        {/* ── Utility Connections (right column) ── */}
        <section>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 section-heading">
              <i className="bi bi-plug" aria-hidden /> Utility Connections
            </h5>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                setEditingUtility(null);
                setUtilityForm({
                  floorId: null,
                  type: "Electricity",
                  referenceNumber: "",
                  consumerNumber: "",
                  providerName: "",
                });
                setUtilityModal(true);
              }}
            >
              <i className="bi bi-plus-lg" aria-hidden /> Add Connection
            </button>
          </div>
          {utilityConnections.length > 0 ? (
            <table className="table table-striped app-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Provider</th>
                  <th>Reference / Consumer #</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {utilityConnections.map((uc) => (
                  <tr key={uc.id}>
                    <td>{uc.type}</td>
                    <td>{uc.providerName || "—"}</td>
                    <td>
                      {uc.referenceNumber || uc.consumerNumber || "—"}
                    </td>
                    <td>
                      <div className="d-flex gap-1 justify-content-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setEditingUtility(uc);
                            setUtilityForm({
                              floorId: uc.floorId,
                              type: uc.type,
                              referenceNumber: uc.referenceNumber || "",
                              consumerNumber: uc.consumerNumber || "",
                              providerName: uc.providerName || "",
                            });
                            setUtilityModal(true);
                          }}
                        >
                          <i className="bi bi-pencil" aria-hidden /> Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={async () => {
                            const ok = await confirm({
                              message: "Delete this utility connection?",
                              confirmLabel: "Delete",
                              variant: "danger",
                            });
                            if (!ok) return;
                            try {
                              await api.utilityConnections.delete(uc.id);
                              loadData();
                            } catch (e) {
                              console.error(e);
                              toast({ message: "Failed to delete", type: "error" });
                            }
                          }}
                        >
                          <i className="bi bi-trash" aria-hidden /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">
              No utility connections. Add electricity (LESCO) or gas (SNGPL)
              connections to enable bill scraping.
            </p>
          )}
        </section>
      </div>

      {/* ── Tenants by Floor ── */}
      <section className="mb-4">
        <h5 className="mb-3 section-heading">
          <i className="bi bi-people" aria-hidden /> Tenants & Rent
        </h5>

        {floors.length === 0 && (
          <p className="text-muted">Add floors first to manage tenants.</p>
        )}

        {floors.map((f) => {
          const occs = occupanciesByFloor[f.id] ?? [];
          return (
            <div key={f.id} className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0 d-inline-flex align-items-center gap-1">
                  <i className="bi bi-door-open" aria-hidden />
                  Floor {f.floorNumber}
                  {f.label ? ` — ${f.label}` : ""}
                </h6>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => openTenantCreate(f.id)}
                >
                  <i className="bi bi-person-plus" aria-hidden /> Add Tenant
                </button>
              </div>

              {occs.length > 0 ? (
                occs.map((occ) => {
                  const currentPayment = getPayment(
                    occ.id,
                    currentYear,
                    currentMonth
                  );
                  const rentIncrease = rentIncreaseByOccupancy[occ.id];
                  const payments = paymentsByOccupancy[occ.id] ?? [];
                  const isExpanded = expandedHistory.has(occ.id);
                  const dues = getDues(occ.id, occ.rent);
                  const totalDue = occ.rent + dues;

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
                    <div key={occ.id} className="card mb-3 tenant-card">
                      <div className="card-body p-0">
                        {/* ─── TENANT INFO STRIP ─── */}
                        <div className="tenant-info-strip">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-0 d-inline-flex align-items-center gap-1">
                                <i
                                  className="bi bi-person-fill"
                                  aria-hidden
                                />
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
                                onClick={() => openOccupancyEdit(occ)}
                                title="Edit tenant & occupancy"
                              >
                                <i className="bi bi-pencil" aria-hidden /> Edit
                                Tenant
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleOccupancyDelete(occ)}
                                title="Remove tenant from this floor"
                              >
                                <i className="bi bi-person-x" aria-hidden />{" "}
                                Remove
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
                              Deposit: Rs.{" "}
                              {occ.securityDeposit.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* ─── RENT STATUS PANEL ─── */}
                        <div className="rent-status-panel">
                          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                            {/* Current month status */}
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
                                    <i
                                      className="bi bi-exclamation-circle"
                                      aria-hidden
                                    />
                                    Prev. dues: Rs. {dues.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              {dues > 0 && (
                                <div className="small text-muted mt-1">
                                  Total due: Rs. {totalDue.toLocaleString()}{" "}
                                  (Rent + Dues)
                                </div>
                              )}
                            </div>

                            {/* Collect button */}
                            <button
                              className={`btn btn-sm ${currentPayment?.isPaid ? "btn-outline-secondary" : "btn-success"}`}
                              onClick={() =>
                                openCollectModal(occ.id, occ.rent)
                              }
                            >
                              <i
                                className={`bi ${currentPayment?.isPaid ? "bi-pencil" : "bi-wallet2"}`}
                                aria-hidden
                              />
                              {currentPayment?.isPaid
                                ? "Update"
                                : "Collect Rent"}
                            </button>
                          </div>

                          {/* Rent increase info */}
                          {isPendingIncrease && rentIncrease && (
                            <div className="alert alert-warning d-flex justify-content-between align-items-center py-2 mt-2 mb-0">
                              <small className="d-inline-flex align-items-center gap-1">
                                <i
                                  className="bi bi-exclamation-triangle-fill"
                                  aria-hidden
                                />
                                Rent increase pending:{" "}
                                {rentIncrease.nextIncreaseDate.slice(0, 10)} (
                                {rentIncrease.increasePercent}%)
                              </small>
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => openIncreaseModal(occ.id)}
                              >
                                <i className="bi bi-pencil" aria-hidden />{" "}
                                Adjust
                              </button>
                            </div>
                          )}

                          {rentIncrease && !isPendingIncrease && (
                            <div className="d-flex align-items-center gap-2 mt-2">
                              <small className="text-muted d-inline-flex align-items-center gap-1">
                                <i
                                  className="bi bi-graph-up-arrow"
                                  aria-hidden
                                />
                                Next increase:{" "}
                                {rentIncrease.nextIncreaseDate.slice(0, 10)} ·{" "}
                                {rentIncrease.increasePercent}%
                              </small>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => openIncreaseModal(occ.id)}
                              >
                                <i className="bi bi-pencil" aria-hidden /> Edit
                              </button>
                            </div>
                          )}

                          {/* History toggle */}
                          <div className="mt-2">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => toggleHistory(occ.id)}
                            >
                              <i
                                className={`bi bi-chevron-${isExpanded ? "up" : "down"}`}
                                aria-hidden
                              />
                              {isExpanded ? "Hide" : "Show"} Rent History
                            </button>
                          </div>

                          {/* Expanded rent history */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-top">
                              <h6 className="small text-muted text-uppercase fw-bold mb-2 d-inline-flex align-items-center gap-1">
                                <i
                                  className="bi bi-cash-stack"
                                  aria-hidden
                                />
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
                                      const shortfall =
                                        occ.rent - p.amountPaid;
                                      return (
                                        <tr key={p.id}>
                                          <td>
                                            {monthLabel(p.month, p.year)}
                                          </td>
                                          <td>
                                            Rs.{" "}
                                            {p.amountPaid.toLocaleString()}
                                          </td>
                                          <td>
                                            {shortfall > 0 ? (
                                              <span className="text-danger">
                                                Rs.{" "}
                                                {shortfall.toLocaleString()}
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
                                <p className="text-muted small mb-0">
                                  No payment records yet.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted small">No tenants on this floor.</p>
              )}
            </div>
          );
        })}
      </section>

      {/* ── Bills Section ── */}
      <section className="mb-4">
        <h5 className="mb-3 section-heading">
          <i className="bi bi-receipt" aria-hidden /> Bills
        </h5>
        <div className="d-flex gap-2 mb-3 align-items-center flex-wrap">
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
                {monthLabel(m)}
              </option>
            ))}
          </select>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={loadBills}
          >
            <i className="bi bi-arrow-clockwise" aria-hidden /> Refresh
          </button>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={async () => {
              try {
                await api.bills.scrapeNow();
                toast({ message: "Scrape started", type: "success" });
                loadData();
              } catch (e) {
                console.error(e);
                toast({ message: "Scrape failed", type: "error" });
              }
            }}
          >
            <i className="bi bi-cloud-download" aria-hidden /> Scrape Now
          </button>
        </div>
        {bills.length > 0 ? (
          <table className="table table-striped app-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Units</th>
                <th>Status</th>
                <th>Scope</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id}>
                  <td>{b.type}</td>
                  <td>{monthLabel(b.month, b.year)}</td>
                  <td>Rs. {b.amount.toLocaleString()}</td>
                  <td>
                    {b.dueDate
                      ? new Date(b.dueDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>{b.unitsConsumed != null ? b.unitsConsumed : "—"}</td>
                  <td>
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
                  <td>{b.tenantOccupancyId != null ? "Tenant" : "House"}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={async () => {
                          try {
                            await api.bills.markPaid(b.id);
                            loadBills();
                            toast({
                              message: b.isPaid ? "Marked as unpaid" : "Marked as paid",
                              type: "success",
                            });
                          } catch (e) {
                            console.error(e);
                            toast({ message: "Failed to update", type: "error" });
                          }
                        }}
                      >
                        <i
                          className={`bi ${b.isPaid ? "bi-x-circle" : "bi-check-circle"}`}
                          aria-hidden
                        />{" "}
                        {b.isPaid ? "Unpaid" : "Paid"}
                      </button>
                      {b.hasSnapshot && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={async () => {
                            try {
                              await api.bills.openSnapshot(b.id);
                            } catch (e) {
                              toast({ message: "Failed to load bill", type: "error" });
                            }
                          }}
                        >
                          <i className="bi bi-file-earmark-text" aria-hidden />{" "}
                          View
                        </button>
                      )}
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

      {/* ── Collect Rent Modal ── */}
      {collectModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-inline-flex align-items-center gap-2">
                  <i className="bi bi-wallet2" aria-hidden />
                  Collect Rent — {monthLabel(currentMonth, currentYear)}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setCollectModal(null)}
                />
              </div>
              <form onSubmit={handleCollect}>
                <div className="modal-body">
                  <dl className="row mb-3">
                    <dt className="col-sm-5">Monthly Rent</dt>
                    <dd className="col-sm-7">
                      Rs. {collectModal.rent.toLocaleString()}
                    </dd>
                    {collectModal.dues > 0 && (
                      <>
                        <dt className="col-sm-5 text-danger">
                          Previous Dues
                        </dt>
                        <dd className="col-sm-7 text-danger">
                          Rs. {collectModal.dues.toLocaleString()}
                        </dd>
                        <dt className="col-sm-5 fw-bold">Total Due</dt>
                        <dd className="col-sm-7 fw-bold">
                          Rs.{" "}
                          {(
                            collectModal.rent + collectModal.dues
                          ).toLocaleString()}
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
                      value={collectAmount || ""}
                      onChange={(e) =>
                        setCollectAmount(parseFloat(e.target.value) || 0)
                      }
                      required
                    />
                    {collectAmount > 0 &&
                      collectAmount <
                        collectModal.rent + collectModal.dues && (
                        <small className="text-warning d-block mt-1">
                          Partial payment — Rs.{" "}
                          {(
                            collectModal.rent +
                            collectModal.dues -
                            collectAmount
                          ).toLocaleString()}{" "}
                          will carry over to next month as dues.
                        </small>
                      )}
                    {collectAmount >= collectModal.rent + collectModal.dues &&
                      collectAmount > 0 && (
                        <small className="text-success d-block mt-1">
                          Full payment — no outstanding dues.
                        </small>
                      )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCollectModal(null)}
                  >
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
      )}

      {/* ── Floor Modal ── */}
      {floorModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-inline-flex align-items-center gap-2">
                  <i
                    className={`bi ${editingFloor ? "bi-pencil" : "bi-plus-lg"}`}
                    aria-hidden
                  />
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

      {/* ── Tenant / Occupancy Modal ── */}
      {tenantModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-inline-flex align-items-center gap-2">
                  <i
                    className={`bi ${editingOccupancy ? "bi-pencil" : "bi-person-plus"}`}
                    aria-hidden
                  />
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
                        setOccupancyForm((f) => ({
                          ...f,
                          name: e.target.value,
                        }))
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
                        value={occupancyForm.floorIds[0] ?? ""}
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
                            Floor {f.floorNumber}{" "}
                            {f.label ? `(${f.label})` : ""}
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
                      Rent{" "}
                      {!editingOccupancy && occupancyForm.floorIds.length > 1
                        ? "(total)"
                        : ""}
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
                      Security Deposit{" "}
                      {!editingOccupancy && occupancyForm.floorIds.length > 1
                        ? "(total)"
                        : ""}
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
                          Split across {occupancyForm.floorIds.length} floors:{" "}
                          {(
                            occupancyForm.rent / occupancyForm.floorIds.length
                          ).toFixed(2)}{" "}
                          rent and{" "}
                          {(
                            occupancyForm.securityDeposit /
                            occupancyForm.floorIds.length
                          ).toFixed(2)}{" "}
                          deposit per floor
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

      {/* ── Rent Increase Modal ── */}
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

      {/* ── Utility Connection Modal ── */}
      {utilityModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-inline-flex align-items-center gap-2">
                  <i className="bi bi-plug" aria-hidden />
                  {editingUtility ? "Edit" : "Add"} Utility Connection
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setUtilityModal(false)}
                />
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    if (editingUtility) {
                      await api.utilityConnections.update(editingUtility.id, {
                        floorId: utilityForm.floorId,
                        referenceNumber: utilityForm.referenceNumber || null,
                        consumerNumber: utilityForm.consumerNumber || null,
                        providerName: utilityForm.providerName || null,
                      });
                    } else {
                      await api.utilityConnections.create(propertyId, {
                        floorId: utilityForm.floorId,
                        type: utilityForm.type,
                        referenceNumber: utilityForm.referenceNumber || null,
                        consumerNumber: utilityForm.consumerNumber || null,
                        providerName: utilityForm.providerName || null,
                      });
                    }
                    setUtilityModal(false);
                    loadData();
                    toast({ message: "Saved", type: "success" });
                  } catch (err) {
                    console.error(err);
                    toast({ message: "Failed to save", type: "error" });
                  }
                }}
              >
                <div className="modal-body">
                  <div className="mb-2">
                    <label className="form-label">Type</label>
                    <select
                      className="form-select"
                      value={utilityForm.type}
                      onChange={(e) =>
                        setUtilityForm((f) => ({ ...f, type: e.target.value }))
                      }
                      disabled={!!editingUtility}
                    >
                      <option value="Electricity">Electricity (LESCO)</option>
                      <option value="Gas">Gas (SNGPL)</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Floor</label>
                    <select
                      className="form-select"
                      value={utilityForm.floorId ?? ""}
                      onChange={(e) =>
                        setUtilityForm((f) => ({
                          ...f,
                          floorId: e.target.value ? parseInt(e.target.value) : null,
                        }))
                      }
                    >
                      <option value="">Whole property</option>
                      {floors.map((f) => (
                        <option key={f.id} value={f.id}>
                          Floor {f.floorNumber} {f.label ? `(${f.label})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  {utilityForm.type === "Electricity" && (
                    <div className="mb-2">
                      <label className="form-label">
                        Reference Number (14-digit, LESCO)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 12112181887022"
                        value={utilityForm.referenceNumber}
                        onChange={(e) =>
                          setUtilityForm((f) => ({
                            ...f,
                            referenceNumber: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}
                  {utilityForm.type === "Gas" && (
                    <div className="mb-2">
                      <label className="form-label">
                        Consumer Number (11-digit, SNGPL)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 53467826375"
                        value={utilityForm.consumerNumber}
                        onChange={(e) =>
                          setUtilityForm((f) => ({
                            ...f,
                            consumerNumber: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}
                  <div className="mb-2">
                    <label className="form-label">Provider Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. LESCO, SNGPL"
                      value={utilityForm.providerName}
                      onChange={(e) =>
                        setUtilityForm((f) => ({
                          ...f,
                          providerName: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setUtilityModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingUtility ? "Save" : "Add"}
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
