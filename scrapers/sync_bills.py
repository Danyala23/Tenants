#!/usr/bin/env python3
"""
Fetch utility bills and upsert into Supabase.
Used by GitHub Actions (.github/workflows/scrape-bills.yml).

Env:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  UTILITY_TYPE (optional): Electricity | Gas | empty for both
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from supabase import create_client
except ImportError:
    print("pip install supabase", file=sys.stderr)
    sys.exit(1)

SCRIPT_DIR = Path(__file__).resolve().parent


def clean_html(html: str) -> str:
    if not html or not html.strip():
        return html
    placeholder = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    result = html
    result = re.sub(
        r'<div\s+id="loader-container"[^>]*>[\s\S]*?</div>\s*', "", result, flags=re.I
    )
    result = re.sub(r"data:image/[^;]+;base64,[A-Za-z0-9+/=]+", placeholder, result)
    result = re.sub(r"<!--[\s\S]*?-->", "", result)
    result = re.sub(r"<script\b[^>]*>[\s\S]*?</script>", "", result, flags=re.I)
    result = re.sub(r">\s+<", "><", result)
    result = re.sub(r"[ \t]+", " ", result)
    result = re.sub(r"\s*\n\s*", " ", result)
    return result.strip()


def run_scraper(script: str, arg: str) -> dict | None:
    proc = subprocess.run(
        [sys.executable, str(SCRIPT_DIR / script), arg],
        capture_output=True,
        text=True,
        cwd=str(SCRIPT_DIR),
        timeout=300,
    )
    if proc.returncode != 0:
        print(proc.stderr or proc.stdout, file=sys.stderr)
        return None
    if not proc.stdout.strip():
        return None
    data = json.loads(proc.stdout)
    if not data or float(data.get("amount", 0)) <= 0:
        return None
    return data


def main() -> int:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr)
        return 1

    utility_filter = os.environ.get("UTILITY_TYPE", "").strip()
    types = (
        [utility_filter]
        if utility_filter in ("Electricity", "Gas")
        else ["Electricity", "Gas"]
    )

    sb = create_client(url, key)
    now = datetime.now(timezone.utc).isoformat()

    for ut in types:
        q = sb.table("utility_connections").select("*").eq("type", ut)
        if ut == "Electricity":
            q = q.not_.is_("reference_number", "null")
        else:
            q = q.not_.is_("consumer_number", "null")
        res = q.execute()
        connections = res.data or []

        for conn in connections:
            script = "lesco_scraper.py" if ut == "Electricity" else "sngpl_scraper.py"
            arg = (
                conn["reference_number"]
                if ut == "Electricity"
                else conn["consumer_number"]
            )
            if not arg:
                continue

            print(f"Scraping {ut} connection {conn['id']} ({arg})...")
            try:
                result = run_scraper(script, str(arg))
            except Exception as ex:
                print(f"  Failed: {ex}", file=sys.stderr)
                continue

            if not result:
                print("  No bill data")
                continue

            bill_type = ut
            year = int(result["year"])
            month = int(result["month"])
            amount = float(result["amount"])
            due_date = result.get("due_date")
            units = result.get("units")
            html = clean_html(result.get("html") or "")

            q = (
                sb.table("monthly_bills")
                .select("id")
                .eq("property_id", conn["property_id"])
                .eq("type", bill_type)
                .eq("year", year)
                .eq("month", month)
            )
            if conn.get("floor_id") is not None:
                q = q.eq("floor_id", conn["floor_id"])
            else:
                q = q.is_("floor_id", "null")
            existing = q.limit(1).execute()

            row = {
                "property_id": conn["property_id"],
                "floor_id": conn.get("floor_id"),
                "utility_connection_id": conn["id"],
                "type": bill_type,
                "year": year,
                "month": month,
                "amount": amount,
                "due_date": due_date,
                "units_consumed": units,
                "bill_html_content": html or None,
                "scraped_at": now,
            }

            if existing.data and len(existing.data) > 0:
                sb.table("monthly_bills").update(row).eq("id", existing.data[0]["id"]).execute()
                print(f"  Updated bill {year}-{month}")
            else:
                row["is_paid"] = False
                sb.table("monthly_bills").insert(row).execute()
                print(f"  Inserted bill {year}-{month}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
