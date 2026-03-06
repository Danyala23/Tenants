# Bill Scraping Setup

Scraping is implemented via Python scripts in `Tenants.Server/Scripts/` that the .NET server invokes as subprocesses.

## Prerequisites

1. **Python 3.9+** installed on the deployment machine (and on PATH, or set `Scraping:PythonPath` in `appsettings.json`).
2. **pip install** the script dependencies:
   ```bash
   cd Tenants.Server/Scripts
   pip install -r requirements.txt
   ```
   This installs `requests`, `beautifulsoup4`, and `ddddocr` (used for SNGPL captcha recognition). No Tesseract or system OCR is required.

## Optional Configuration

- **Scraping:PythonPath** in `appsettings.json`: Set to a custom Python executable path (e.g. `"C:\\Python312\\python.exe"`) if `python` or `python3` is not on PATH.

## Electricity (LESCO)

- Add a Utility Connection with type **Electricity** and your 14-digit **Reference Number** (from your LESCO bill).
- Bills are scraped automatically on the **5th of every month**; you can also use **Scrape Now** in the UI or call `POST /bills/scrape-now?type=Electricity`.
- Uses `lesco_scraper.py`: submits the ASP.NET form at `bill.pitc.com.pk` (TLS adapter for legacy SSL) and parses amount, due date, units, and billing period from the bill HTML.

## Gas (SNGPL)

- Add a Utility Connection with type **Gas** and your 11-digit **Consumer Number** (from your SNGPL bill).
- Bills are scraped automatically on the **18th of every month**; you can also use **Scrape Now** or `POST /bills/scrape-now?type=Gas`.
- Uses `sngpl_scraper.py`: loads the login page at `www.sngpl.com.pk`, fetches the captcha image, solves it with **ddddocr** (no Tesseract), and POSTs the form with the same headers as the site’s jQuery AJAX. If a run fails (e.g. captcha rejected), the script retries up to 10 times.

## Troubleshooting

- **LESCO "Could not parse amount"** – The server may have returned the search form instead of the bill. Ensure the reference number is correct and the PITC site is reachable. Check `Tenants.Server/Scripts/lesco_debug.html` (written when `LESCO_DEBUG_HTML` is set) to inspect the HTML.
- **SNGPL "All captcha attempts failed"** – Ensure `ddddocr` is installed (`pip install ddddocr`). If it still fails, the site’s captcha validation can be unreliable; try again later or use Scrape Now multiple times.
- **Python script not found** – Build the server at least once so `Scripts/` is copied to the output directory. Set `Scraping:PythonPath` if your Python executable is not on PATH when the server runs.
