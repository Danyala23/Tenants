"use client";

import { computeDues } from "@/utils/dateUtils";
import type { Floor, Occupancy, RentPayment, RentIncreaseRule } from "@/lib/types";
import { TenantCard } from "./TenantCard";

interface TenantsByFloorSectionProps {
  floors: Floor[];
  occupanciesByFloor: Record<number, Occupancy[]>;
  paymentsByOccupancy: Record<number, RentPayment[]>;
  rentIncreaseByOccupancy: Record<number, RentIncreaseRule | null>;
  expandedHistory: Set<number>;
  currentYear: number;
  currentMonth: number;
  onAddTenant: (floorId: number) => void;
  onEditOccupancy: (occ: Occupancy) => void;
  onVacateOccupancy: (occ: Occupancy) => void;
  onCollect: (occ: Occupancy) => void;
  onToggleHistory: (occId: number) => void;
  onAdjustIncrease: (occId: number) => void;
}

export function TenantsByFloorSection({
  floors,
  occupanciesByFloor,
  paymentsByOccupancy,
  rentIncreaseByOccupancy,
  expandedHistory,
  currentYear,
  currentMonth,
  onAddTenant,
  onEditOccupancy,
  onVacateOccupancy,
  onCollect,
  onToggleHistory,
  onAdjustIncrease,
}: TenantsByFloorSectionProps) {
  function getPayment(
    occId: number,
    year: number,
    month: number
  ): RentPayment | undefined {
    return (paymentsByOccupancy[occId] ?? []).find(
      (p) => p.year === year && p.month === month
    );
  }

  function getDues(occ: Occupancy): number {
    const payments = paymentsByOccupancy[occ.id] ?? [];
    return computeDues(occ.rent, payments, occ.startDate, currentYear, currentMonth);
  }

  const now = new Date();

  return (
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
              {occs.length === 0 && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => onAddTenant(f.id)}
                >
                  <i className="bi bi-person-plus" aria-hidden /> Add Tenant
                </button>
              )}
            </div>

            {occs.length > 0 ? (
              occs.map((occ) => {
                const currentPayment = getPayment(occ.id, currentYear, currentMonth);
                const rentIncrease = rentIncreaseByOccupancy[occ.id];
                const payments = paymentsByOccupancy[occ.id] ?? [];
                const isExpanded = expandedHistory.has(occ.id);
                const dues = getDues(occ);
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
                  <TenantCard
                    key={occ.id}
                    occ={occ}
                    currentYear={currentYear}
                    currentMonth={currentMonth}
                    currentPayment={currentPayment}
                    rentIncrease={rentIncrease ?? null}
                    payments={payments}
                    isExpanded={isExpanded}
                    dues={dues}
                    totalDue={totalDue}
                    isPendingIncrease={!!isPendingIncrease}
                    onEdit={onEditOccupancy}
                    onVacate={onVacateOccupancy}
                    onCollect={onCollect}
                    onToggleHistory={onToggleHistory}
                    onAdjustIncrease={onAdjustIncrease}
                  />
                );
              })
            ) : (
              <p className="text-muted small">No tenants on this floor.</p>
            )}
          </div>
        );
      })}
    </section>
  );
}
