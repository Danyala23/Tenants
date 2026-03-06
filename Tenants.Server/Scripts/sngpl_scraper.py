#!/usr/bin/env python3
"""
SNGPL bill scraper. Uses ddddocr for captcha recognition.
Usage: python sngpl_scraper.py <11-digit-consumer-number>
Output: JSON to stdout with keys: amount, due_date, units, year, month, html

Requires: pip install ddddocr requests beautifulsoup4
"""
import json
import os
import re
import sys
import time
from datetime import datetime

import urllib3
import requests
from bs4 import BeautifulSoup
import ddddocr

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_URL = "https://www.sngpl.com.pk"
LOGIN_URL = BASE_URL + "/login.jsp"
VIEW_BILL_URL = BASE_URL + "/viewbill"
CAPTCHA_URL = BASE_URL + "/captcha-image.jpg"
MAX_RETRIES = 10

_ocr = ddddocr.DdddOcr(show_ad=False)


def solve_captcha(image_bytes: bytes) -> str:
    return _ocr.classification(image_bytes)


def parse_amount(soup: BeautifulSoup) -> float:
    text = soup.get_text(separator=" ", strip=True)
    NUM = r"(\d[\d,]*(?:\.\d{1,2})?)"

    specific_patterns = [
        r"payable\s+within\s+due\s+date[^0-9]*" + NUM,
        r"total\s+amount\s+due[^0-9]*" + NUM,
        r"amount\s+within\s+due\s+date[^0-9]*" + NUM,
        r"current\s+bill[^0-9]*" + NUM,
        r"payable\s+after\s+due\s+date[^0-9]*" + NUM,
        r"amount\s+after\s+due\s+date[^0-9]*" + NUM,
    ]
    for pat in specific_patterns:
        m = re.search(pat, text, re.I)
        if m:
            amt = float(m.group(1).replace(",", ""))
            if amt > 10:
                return amt

    general_patterns = [
        r"(?:Rs\.?|PKR|Amount|Total|Payable|Net\s+Amount)[:\s]*" + NUM,
        NUM + r"\s*(?:Rs\.?|PKR)",
    ]
    for pat in general_patterns:
        for m in re.finditer(pat, text, re.I):
            amt = float(m.group(1).replace(",", ""))
            if amt > 10:
                return amt

    return 0.0


def parse_due_date(soup: BeautifulSoup) -> str | None:
    text = soup.get_text(separator=" ", strip=True)
    fmts = ["%d/%m/%Y", "%d/%m/%y", "%d-%m-%Y", "%d-%m-%y"]

    def _try_date(raw: str) -> str | None:
        for s in (raw, raw.replace("-", "/"), raw.replace("/", "-")):
            for fmt in fmts:
                try:
                    return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
                except ValueError:
                    continue
        return None

    m = re.search(
        r"\d[\d,]+\s+(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})\s+\d[\d,]+",
        text,
    )
    if m:
        result = _try_date(m.group(1))
        if result:
            return result

    m = re.search(r"due\s*date[^0-9]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})", text, re.I)
    if m:
        result = _try_date(m.group(1))
        if result:
            return result

    all_dates = list(re.finditer(r"(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})", text))
    if all_dates:
        result = _try_date(all_dates[-1].group(1))
        if result:
            return result

    return None


def parse_units(soup: BeautifulSoup) -> float | None:
    text = soup.get_text(separator=" ", strip=True)
    for pat in [
        r"gas\s*consumed\s*(?:hm3)?\s*(\d+(?:\.\d+)?)",
        r"(?:hm3)[:\s]+(\d+(?:\.\d+)?)",
        r"(?:units?|consumption|gas\s*used)[:\s]+(\d+(?:\.\d+)?)",
    ]:
        m = re.search(pat, text, re.I)
        if m:
            return float(m.group(1))
    return None


def parse_billing_period(soup: BeautifulSoup) -> tuple[int, int]:
    now = datetime.now()
    text = soup.get_text(separator=" ", strip=True)

    m = re.search(
        r"billing\s*month[:\s]*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*['\-]?\s*(\d{2,4})",
        text,
        re.I,
    )
    if m:
        try:
            month_dt = datetime.strptime(m.group(1)[:3], "%b")
            year = int(m.group(2))
            if year < 100:
                year += 2000
            if 1 <= month_dt.month <= 12 and 2020 <= year <= 2030:
                return (year, month_dt.month)
        except ValueError:
            pass

    m = re.search(r"(?:billing|period)[:\s]*(\d{1,2})[/\-](\d{2,4})", text, re.I)
    if m:
        month = int(m.group(1))
        year = int(m.group(2))
        if year < 100:
            year += 2000
        if 1 <= month <= 12 and 2020 <= year <= 2030:
            return (year, month)

    return (now.year, now.month)


def try_scrape(consumer_no: str) -> dict | None:
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    })

    page_url = LOGIN_URL + "?mdids=85"
    login_resp = session.get(page_url, timeout=120, verify=False)
    login_resp.raise_for_status()

    ts = str(int(time.time() * 1000))
    captcha_resp = session.get(CAPTCHA_URL + "?t=" + ts, timeout=120, verify=False)
    captcha_resp.raise_for_status()

    captcha_text = solve_captcha(captcha_resp.content)
    if not captcha_text:
        return None

    form_data = {
        "proc": "viewbill",
        "consumer": consumer_no,
        "contype": "NewCon",
        "txtCaptcha": captcha_text,
    }

    response = session.post(
        VIEW_BILL_URL,
        data=form_data,
        timeout=120,
        verify=False,
        headers={
            "X-Requested-With": "XMLHttpRequest",
            "Referer": page_url,
            "Origin": BASE_URL,
            "Accept": "*/*",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
    )
    html = response.text
    trimmed = html.strip().lower()

    if any(trimmed.startswith(s) for s in [
        "invalid captcha", "bill is not available",
        "incorrect consumer number", "login required",
    ]):
        return None

    if len(html.strip()) < 100:
        return None

    soup = BeautifulSoup(html, "html.parser")
    amount = parse_amount(soup)
    if amount <= 0:
        debug_path = os.environ.get("SNGPL_DEBUG_HTML")
        if debug_path:
            with open(debug_path, "w", encoding="utf-8") as f:
                f.write(html)
        return None

    due_date = parse_due_date(soup)
    units = parse_units(soup)
    year, month = parse_billing_period(soup)

    return {
        "amount": amount,
        "due_date": due_date,
        "units": units,
        "year": year,
        "month": month,
        "html": html,
    }


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: sngpl_scraper.py <consumer_number>"}), file=sys.stderr)
        sys.exit(1)

    consumer_no = sys.argv[1].strip()
    if not consumer_no:
        print(json.dumps({"error": "Consumer number is empty"}), file=sys.stderr)
        sys.exit(1)

    for attempt in range(MAX_RETRIES):
        try:
            result = try_scrape(consumer_no)
            if result is not None:
                print(json.dumps(result))
                return
        except Exception:
            pass
        if attempt < MAX_RETRIES - 1:
            time.sleep(0.5)

    print(json.dumps({"error": f"All {MAX_RETRIES} captcha attempts failed"}), file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
