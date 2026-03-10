import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { useNotifications } from "../context/NotificationContext";
import { computeDues, getUnpaidMonths } from "../utils/dateUtils";
import type {
  Property,
  Floor,
  Occupancy,
  Bill,
  RentPayment,
  RentIncreaseRule,
  UtilityConnection,
} from "../types";
import {
  PropertyDetailHeader,
  FloorsSection,
  UtilityConnectionsSection,
  TenantsByFloorSection,
  BillsSection,
  CollectRentModal,
  FloorModal,
  TenantModal,
  RentIncreaseModal,
  UtilityModal,
} from "../components/PropertyDetail";

export function PropertyDetail() {
  const { toast, confirm } = useNotifications();
  const { id } = useParams<{ id: string }>();
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
    unpaidMonths: { year: number; month: number }[];
    startDate: string;
    payments: RentPayment[];
  } | null>(null);
  const [collectAmount, setCollectAmount] = useState(0);
  const [collectYear, setCollectYear] = useState(() => new Date().getFullYear());
  const [collectMonth, setCollectMonth] = useState(() => new Date().getMonth() + 1);
  const [collectCollectedToday, setCollectCollectedToday] = useState(true);
  const [collectCollectedAt, setCollectCollectedAt] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

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

  function getDues(_occId: number, rent: number, startDate: string, payments: RentPayment[]): number {
    return computeDues(rent, payments, startDate, currentYear, currentMonth);
  }

  function toggleHistory(occId: number) {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      if (next.has(occId)) next.delete(occId);
      else next.add(occId);
      return next;
    });
  }

  function openCollectModal(occ: Occupancy) {
    const payments = paymentsByOccupancy[occ.id] ?? [];
    const dues = getDues(occ.id, occ.rent, occ.startDate, payments);
    const unpaidMonths = getUnpaidMonths(occ.rent, payments, occ.startDate, currentYear, currentMonth);
    const hasDues = dues > 0;
    const periodYear = hasDues && unpaidMonths.length > 0 ? unpaidMonths[0].year : currentYear;
    const periodMonth = hasDues && unpaidMonths.length > 0 ? unpaidMonths[0].month : currentMonth;
    const totalForPeriod = hasDues
      ? occ.rent + computeDues(occ.rent, payments, occ.startDate, periodYear, periodMonth)
      : occ.rent + dues;
    setCollectModal({ occId: occ.id, rent: occ.rent, dues, unpaidMonths, startDate: occ.startDate, payments });
    setCollectYear(periodYear);
    setCollectMonth(periodMonth);
    setCollectAmount(totalForPeriod);
    setCollectCollectedToday(true);
    setCollectCollectedAt(new Date().toISOString().slice(0, 10));
  }

  async function handleCollect(e: React.FormEvent) {
    e.preventDefault();
    if (!collectModal) return;
    const collectedAt = collectCollectedToday
      ? undefined
      : `${collectCollectedAt}T00:00:00.000Z`;
    try {
      await api.payments.collect(collectModal.occId, {
        year: collectYear,
        month: collectMonth,
        amountPaid: collectAmount,
        collectedAt,
      });
      setCollectModal(null);
      toast({ message: "Rent collected successfully.", type: "success" });
      loadData();
    } catch (error) {
      console.error(error);
      toast({ message: "Failed to collect rent.", type: "error" });
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

  async function handleVacateOccupancy(occ: Occupancy) {
    const ok = await confirm({
      message: `Vacate ${occ.tenantName} from this floor? The tenant and payment history will be preserved.`,
      confirmLabel: "Vacate",
      variant: "primary",
    });
    if (!ok) return;
    try {
      await api.occupancies.vacate(occ.id);
      loadData();
      toast({ message: "Tenant vacated. Floor is now available.", type: "success" });
    } catch (error) {
      console.error(error);
      toast({ message: "Failed to vacate tenant.", type: "error" });
    }
  }

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

  function openUtilityAdd() {
    setEditingUtility(null);
    setUtilityForm({
      floorId: null,
      type: "Electricity",
      referenceNumber: "",
      consumerNumber: "",
      providerName: "",
    });
    setUtilityModal(true);
  }

  function openUtilityEdit(uc: UtilityConnection) {
    setEditingUtility(uc);
    setUtilityForm({
      floorId: uc.floorId,
      type: uc.type,
      referenceNumber: uc.referenceNumber || "",
      consumerNumber: uc.consumerNumber || "",
      providerName: uc.providerName || "",
    });
    setUtilityModal(true);
  }

  async function handleUtilitySubmit(e: React.FormEvent) {
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
  }

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
      <PropertyDetailHeader property={property} />

      <div className="detail-grid mb-4">
        <FloorsSection
          floors={floors}
          occupanciesByFloor={occupanciesByFloor}
          onAddFloor={openFloorCreate}
          onEditFloor={openFloorEdit}
          onDeleteFloor={handleFloorDelete}
        />
        <UtilityConnectionsSection
          utilityConnections={utilityConnections}
          onEdit={openUtilityEdit}
          onAdd={openUtilityAdd}
          onDataChange={loadData}
        />
      </div>

      <TenantsByFloorSection
        floors={floors}
        occupanciesByFloor={occupanciesByFloor}
        paymentsByOccupancy={paymentsByOccupancy}
        rentIncreaseByOccupancy={rentIncreaseByOccupancy}
        expandedHistory={expandedHistory}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onAddTenant={openTenantCreate}
        onEditOccupancy={openOccupancyEdit}
        onVacateOccupancy={handleVacateOccupancy}
        onCollect={openCollectModal}
        onToggleHistory={toggleHistory}
        onAdjustIncrease={openIncreaseModal}
      />

      <BillsSection
        bills={bills}
        billYear={billYear}
        billMonth={billMonth}
        onBillYearChange={setBillYear}
        onBillMonthChange={setBillMonth}
        onRefresh={loadBills}
        onDataChange={loadData}
      />

      {collectModal && (
        <CollectRentModal
          rent={collectModal.rent}
          dues={collectModal.dues}
          amount={collectAmount}
          selectedYear={collectYear}
          selectedMonth={collectMonth}
          unpaidMonths={collectModal.unpaidMonths}
          payments={collectModal.payments}
          startDate={collectModal.startDate}
          collectedToday={collectCollectedToday}
          collectedAt={collectCollectedAt}
          onAmountChange={setCollectAmount}
          onPeriodChange={(y, m) => {
            setCollectYear(y);
            setCollectMonth(m);
            const total = collectModal.rent + computeDues(collectModal.rent, collectModal.payments, collectModal.startDate, y, m);
            setCollectAmount(total);
          }}
          onCollectedTodayChange={setCollectCollectedToday}
          onCollectedAtChange={setCollectCollectedAt}
          onSubmit={handleCollect}
          onClose={() => setCollectModal(null)}
        />
      )}

      {floorModal && (
        <FloorModal
          editingFloor={editingFloor}
          floorNumber={floorForm.floorNumber}
          label={floorForm.label}
          onFloorNumberChange={(v) =>
            setFloorForm((f) => ({ ...f, floorNumber: v }))
          }
          onLabelChange={(v) => setFloorForm((f) => ({ ...f, label: v }))}
          onSubmit={handleFloorSubmit}
          onClose={() => setFloorModal(false)}
        />
      )}

      {tenantModal && (
        <TenantModal
          editingOccupancy={editingOccupancy}
          floors={
            editingOccupancy
              ? floors
              : floors.filter((f) => (occupanciesByFloor[f.id] ?? []).length === 0)
          }
          form={occupancyForm}
          onFormChange={setOccupancyForm}
          onToggleFloor={toggleFloorInForm}
          onSubmit={handleOccupancySubmit}
          onClose={() => setTenantModal(false)}
        />
      )}

      {editingIncreaseOccupancyId !== null && (
        <RentIncreaseModal
          increasePercent={increaseForm.increasePercent}
          nextIncreaseDate={increaseForm.nextIncreaseDate}
          onIncreasePercentChange={(v) =>
            setIncreaseForm((f) => ({ ...f, increasePercent: v }))
          }
          onNextIncreaseDateChange={(v) =>
            setIncreaseForm((f) => ({ ...f, nextIncreaseDate: v }))
          }
          onSubmit={handleIncreaseSave}
          onClose={() => setEditingIncreaseOccupancyId(null)}
        />
      )}

      {utilityModal && (
        <UtilityModal
          editingUtility={editingUtility}
          floors={floors}
          form={utilityForm}
          onFormChange={setUtilityForm}
          onSubmit={handleUtilitySubmit}
          onClose={() => setUtilityModal(false)}
        />
      )}
    </div>
  );
}
