#!/usr/bin/env python3
"""
LESCO bill scraper. Handles ASP.NET form submission at bill.pitc.com.pk.
Usage: python lesco_scraper.py <14-digit-reference-number>
Output: JSON to stdout with keys: amount, due_date, units, year, month, html
"""
import json
import os
import re
import ssl
import sys
from datetime import datetime
from urllib.parse import urljoin

import urllib3
import requests

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from requests.adapters import HTTPAdapter
from bs4 import BeautifulSoup

FORM_URL = "https://bill.pitc.com.pk/lescobill/general"


class TLSAdapter(HTTPAdapter):
    """Adapter that allows legacy cipher suites for bill.pitc.com.pk."""

    def init_poolmanager(self, *args, **kwargs):
        ctx = ssl.create_default_context()
        try:
            ctx.set_ciphers("DEFAULT@SECLEVEL=1")
        except ssl.SSLError:
            ctx.set_ciphers("DEFAULT")
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        kwargs["ssl_context"] = ctx
        return super().init_poolmanager(*args, **kwargs)


def is_bill_page(soup: BeautifulSoup) -> bool:
    """Return True if the page contains actual bill data, not just the search form."""
    text = soup.get_text(separator=" ", strip=True).lower()
    bill_indicators = [
        "payable within due date",
        "payable after due date",
        "units consumed",
        "current bill",
        "meter reading",
        "meter no",
        "consumer id",
        "bill month",
        "cost of electricity",
        "lesco charges",
    ]
    matches = sum(1 for ind in bill_indicators if ind in text)
    return matches >= 2


def extract_aspnet_fields(soup: BeautifulSoup) -> dict[str, str]:
    """Extract ASP.NET hidden form fields from the page."""
    fields: dict[str, str] = {}
    for name in [
        "__VIEWSTATE",
        "__VIEWSTATEGENERATOR",
        "__EVENTVALIDATION",
        "__RequestVerificationToken",
        "__EVENTTARGET",
        "__EVENTARGUMENT",
        "__LASTFOCUS",
    ]:
        inp = soup.find("input", {"name": name})
        if inp:
            fields[name] = inp.get("value", "")
    return fields


def fetch_bill_via_form(session: requests.Session, ref_no: str) -> str | None:
    """Load the search form, extract tokens, and POST to retrieve the bill."""
    resp = session.get(FORM_URL, timeout=120, verify=False)
    resp.raise_for_status()

    form_soup = BeautifulSoup(resp.text, "html.parser")
    fields = extract_aspnet_fields(form_soup)
    if "__VIEWSTATE" not in fields:
        return None

    fields.update({
        "rbSearchByList": "refno",
        "searchTextBox": ref_no,
        "ruCodeTextBox": "",
        "btnSearch": "Search",
    })

    form_tag = form_soup.find("form", {"id": "SubmitForm"})
    action = form_tag.get("action", "") if form_tag else ""
    post_url = urljoin(resp.url, action) if action else resp.url

    resp = session.post(post_url, data=fields, timeout=120, verify=False)
    resp.raise_for_status()
    return resp.text


def parse_amount(soup: BeautifulSoup) -> float:
    text = soup.get_text(separator=" ", strip=True)
    NUM = r"(\d[\d,]*(?:\.\d{1,2})?)"

    m = re.search(
        r"payable\s+within\s+due\s+date\s+" + NUM, text, re.I
    )
    if m:
        return float(m.group(1).replace(",", ""))

    m = re.search(
        r"current\s+bill\s+" + NUM, text, re.I
    )
    if m:
        return float(m.group(1).replace(",", ""))

    m = re.search(
        r"payable\s+after\s+due\s+date[^0-9]*" + NUM, text, re.I
    )
    if m:
        return float(m.group(1).replace(",", ""))

    m = re.search(
        r"total\s+amount\s+due[^0-9]*" + NUM, text, re.I
    )
    if m:
        return float(m.group(1).replace(",", ""))

    for pat in [
        r"(?:net\s+amount|bill\s+amount|total\s+payable|amount\s+payable)[^0-9]{0,20}" + NUM,
        r"(?:Rs\.?|PKR)\s*" + NUM,
    ]:
        for match in re.finditer(pat, text, re.I):
            amt = float(match.group(1).replace(",", ""))
            if amt > 50:
                return amt

    return 0.0


def parse_due_date(soup: BeautifulSoup) -> str | None:
    text = soup.get_text(separator=" ", strip=True)
    date_fmts_text = ["%d %b %y", "%d %b %Y", "%d %B %y", "%d %B %Y"]
    date_fmts_slash = ["%d/%m/%Y", "%d/%m/%y", "%d-%m-%Y", "%d-%m-%y"]
    DATE_PAT = r"(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})"
    now = datetime.now()
    cutoff = datetime(now.year - 1, 1, 1)

    def try_parse_date(raw: str) -> datetime | None:
        for fmt in date_fmts_text + date_fmts_slash:
            for s in (raw, raw.replace("-", "/"), raw.replace("/", "-")):
                try:
                    dt = datetime.strptime(s, fmt)
                    if dt > cutoff:
                        return dt
                except ValueError:
                    continue
        return None

    # Collect all dates found in windows after every "DUE DATE" occurrence
    candidates: list[datetime] = []
    for m in re.finditer(r"due\s*date", text, re.I):
        window = text[m.end() : m.end() + 300]
        for dm in re.finditer(DATE_PAT, window, re.I):
            dt = try_parse_date(dm.group(1).strip())
            if dt:
                candidates.append(dt)
        for dm in re.finditer(r"(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})", window):
            dt = try_parse_date(dm.group(1).strip())
            if dt:
                candidates.append(dt)

    if candidates:
        return max(candidates).strftime("%Y-%m-%d")

    return None


def parse_units(soup: BeautifulSoup) -> float | None:
    text = soup.get_text(separator=" ", strip=True)
    m = re.search(r"units?\s*consumed[:\s]*(\d+(?:\.\d+)?)", text, re.I)
    if m:
        return float(m.group(1))
    m = re.search(r"(?:units?|kwh|consumption)[:\s]*(\d+(?:\.\d+)?)", text, re.I)
    if m:
        return float(m.group(1))
    m = re.search(r"(\d+)\s*(?:units?|kwh)", text, re.I)
    if m:
        return float(m.group(1))
    return None


def strip_base64_images(html: str) -> str:
    """Replace inline base64 images with a tiny placeholder to reduce size.
    LESCO bills contain large QR codes and meter images (100KB-500KB each) that cause
    process pipe overflow and DB bloat. The placeholder preserves img tags for layout."""
    return re.sub(
        r"data:image/[^;]+;base64,[A-Za-z0-9+/=]+",
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        html,
    )


def parse_billing_period(soup: BeautifulSoup) -> tuple[int, int]:
    now = datetime.now()
    text = soup.get_text(separator=" ", strip=True)
    MONTH_PAT = r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"

    def _try(mon_str: str, yr_str: str) -> tuple[int, int] | None:
        try:
            month = datetime.strptime(mon_str[:3], "%b").month
            year = int(yr_str)
            if year < 100:
                year += 2000
            if 1 <= month <= 12 and 2020 <= year <= 2030:
                return (year, month)
        except ValueError:
            pass
        return None

    # "PAYABLE WITHIN DUE DATE 11288 FEB 26 09 MAR 26"
    # The bill month appears right after the amount
    m = re.search(
        r"payable\s+within\s+due\s+date\s+\d[\d,]*(?:\.\d{1,2})?\s+"
        + MONTH_PAT + r"[a-z]*\s+(\d{2,4})",
        text,
        re.I,
    )
    if m:
        r = _try(m.group(1), m.group(2))
        if r:
            return r

    # "BILL MONTH" header followed by values; pick standalone "MMM YY" (not "DD MMM YY")
    for m in re.finditer(r"bill\s*month", text, re.I):
        window = text[m.end() : m.end() + 300]
        for dm in re.finditer(
            r"(?<!\d\s)" + MONTH_PAT + r"[a-z]*\s+(\d{2,4})", window, re.I
        ):
            r = _try(dm.group(1), dm.group(2))
            if r and r[0] >= now.year - 1:
                return r

    m = re.search(r"(?:billing|period)[:\s]*(\d{1,2})[/\-](\d{2,4})", text, re.I)
    if m:
        r = _try(str(m.group(1)), m.group(2))
        if r:
            return r

    return (now.year, now.month)


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: lesco_scraper.py <reference_number>"}), file=sys.stderr)
        sys.exit(1)

    ref_no = sys.argv[1].strip()
    if not ref_no:
        print(json.dumps({"error": "Reference number is empty"}), file=sys.stderr)
        sys.exit(1)

    session = requests.Session()
    session.mount("https://", TLSAdapter())
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    })

    html = None
    soup = None

    # Strategy 1: direct GET with query parameter
    try:
        url = f"{FORM_URL}?refno={ref_no}"
        resp = session.get(url, timeout=120, verify=False)
        resp.raise_for_status()
        html = resp.text
        soup = BeautifulSoup(html, "html.parser")
    except requests.RequestException:
        pass

    # Strategy 2: ASP.NET form POST if direct GET didn't yield a bill
    if soup is None or not is_bill_page(soup):
        try:
            html = fetch_bill_via_form(session, ref_no)
            if html:
                soup = BeautifulSoup(html, "html.parser")
        except requests.RequestException as e:
            print(json.dumps({"error": f"Form POST failed: {e}"}), file=sys.stderr)
            sys.exit(1)

    if soup is None or not is_bill_page(soup):
        debug_path = os.environ.get("LESCO_DEBUG_HTML")
        if debug_path and html:
            with open(debug_path, "w", encoding="utf-8") as f:
                f.write(html)
        text_lower = (html or "").lower()
        if "no record" in text_lower or "not found" in text_lower or "invalid reference" in text_lower:
            print(json.dumps({"error": "No bill found for this reference number"}), file=sys.stderr)
        else:
            msg = "Could not retrieve bill page"
            if debug_path:
                msg += f". HTML saved to {debug_path}"
            print(json.dumps({"error": msg}), file=sys.stderr)
        sys.exit(1)

    amount = parse_amount(soup)
    if amount <= 0:
        debug_path = os.environ.get("LESCO_DEBUG_HTML")
        if debug_path:
            with open(debug_path, "w", encoding="utf-8") as f:
                f.write(html)
            print(json.dumps({"error": f"Could not parse amount. HTML saved to {debug_path}"}), file=sys.stderr)
        else:
            print(json.dumps({"error": "Could not parse amount from HTML"}), file=sys.stderr)
        sys.exit(1)

    due_date = parse_due_date(soup)
    units = parse_units(soup)
    year, month = parse_billing_period(soup)

    # Strip base64 images before JSON output to avoid pipe/DB size limits
    html = strip_base64_images(html)

    result = {
        "amount": amount,
        "due_date": due_date,
        "units": units,
        "year": year,
        "month": month,
        "html": html,
    }
    print(json.dumps(result))


if __name__ == "__main__":
    main()
