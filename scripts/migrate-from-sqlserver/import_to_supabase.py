#!/usr/bin/env python3
"""
Import JSON exports from export.ps1 into Supabase (service role).

Usage:
  pip install supabase
  set SUPABASE_URL=...
  set SUPABASE_SERVICE_ROLE_KEY=...
  python import_to_supabase.py --dir export
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

try:
    from supabase import create_client
except ImportError:
    print("pip install supabase", file=sys.stderr)
    sys.exit(1)


def load_json(path: Path) -> list[dict]:
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        return []
    return json.loads(text)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", default="export", help="Directory with *.json exports")
    args = parser.parse_args()

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr)
        return 1

    sb = create_client(url, key)
    base = Path(args.dir)

    id_maps: dict[str, dict[int, int]] = {
        "properties": {},
        "floors": {},
        "tenants": {},
        "occupancies": {},
        "utilities": {},
    }

    for row in load_json(base / "Properties.json"):
        ins = sb.table("properties").insert({
            "house_number": row.get("HouseNumber", ""),
            "address": row.get("Address", ""),
            "size": row.get("Size", 0),
            "created_at": row.get("CreatedAt"),
        }).execute()
        if ins.data:
            id_maps["properties"][row["Id"]] = ins.data[0]["id"]

    for row in load_json(base / "Floors.json"):
        pid = id_maps["properties"].get(row["PropertyId"])
        if not pid:
            continue
        ins = sb.table("floors").insert({
            "property_id": pid,
            "floor_number": row["FloorNumber"],
            "label": row.get("Label", ""),
        }).execute()
        if ins.data:
            id_maps["floors"][row["Id"]] = ins.data[0]["id"]

    for row in load_json(base / "Tenants.json"):
        ins = sb.table("tenants").insert({
            "name": row.get("Name", ""),
            "phone_number": row.get("PhoneNumber", ""),
        }).execute()
        if ins.data:
            id_maps["tenants"][row["Id"]] = ins.data[0]["id"]

    for row in load_json(base / "TenantOccupancies.json"):
        tid = id_maps["tenants"].get(row["TenantId"])
        pid = id_maps["properties"].get(row["PropertyId"])
        if not tid or not pid:
            continue
        fid = id_maps["floors"].get(row["FloorId"]) if row.get("FloorId") else None
        ins = sb.table("tenant_occupancies").insert({
            "tenant_id": tid,
            "property_id": pid,
            "floor_id": fid,
            "rent": row.get("Rent", 0),
            "security_deposit": row.get("SecurityDeposit", 0),
            "start_date": str(row.get("StartDate", ""))[:10],
            "end_date": str(row["EndDate"])[:10] if row.get("EndDate") else None,
        }).execute()
        if ins.data:
            id_maps["occupancies"][row["Id"]] = ins.data[0]["id"]
            sb.table("rent_increase_rules").insert({
                "tenant_occupancy_id": ins.data[0]["id"],
                "increase_percent": 10,
                "next_increase_date": row.get("StartDate"),
            }).execute()

    for row in load_json(base / "UtilityConnections.json"):
        pid = id_maps["properties"].get(row["PropertyId"])
        if not pid:
            continue
        fid = id_maps["floors"].get(row["FloorId"]) if row.get("FloorId") else None
        ins = sb.table("utility_connections").insert({
            "property_id": pid,
            "floor_id": fid,
            "type": row.get("Type", "Gas"),
            "reference_number": row.get("ReferenceNumber"),
            "consumer_number": row.get("ConsumerNumber"),
            "provider_name": row.get("ProviderName"),
        }).execute()
        if ins.data:
            id_maps["utilities"][row["Id"]] = ins.data[0]["id"]

    for row in load_json(base / "MonthlyBills.json"):
        pid = id_maps["properties"].get(row["PropertyId"])
        if not pid:
            continue
        sb.table("monthly_bills").insert({
            "property_id": pid,
            "floor_id": id_maps["floors"].get(row["FloorId"]) if row.get("FloorId") else None,
            "tenant_occupancy_id": id_maps["occupancies"].get(row["TenantOccupancyId"])
            if row.get("TenantOccupancyId")
            else None,
            "utility_connection_id": id_maps["utilities"].get(row["UtilityConnectionId"])
            if row.get("UtilityConnectionId")
            else None,
            "type": row.get("Type", "Water"),
            "year": row["Year"],
            "month": row["Month"],
            "amount": row.get("Amount", 0),
            "is_paid": row.get("IsPaid", False),
            "due_date": row.get("DueDate"),
            "units_consumed": row.get("UnitsConsumed"),
            "bill_html_content": row.get("BillHtmlContent"),
            "scraped_at": row.get("ScrapedAt"),
        }).execute()

    for row in load_json(base / "RentPayments.json"):
        oid = id_maps["occupancies"].get(row["TenantOccupancyId"])
        if not oid:
            continue
        sb.table("rent_payments").insert({
            "tenant_occupancy_id": oid,
            "year": row["Year"],
            "month": row["Month"],
            "is_paid": row.get("IsPaid", False),
            "amount_paid": row.get("AmountPaid", 0),
            "collected_at": row.get("CollectedAt"),
        }).execute()

    print("Import finished. Verify row counts in Supabase dashboard.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
