# Tenants

A property and tenant management web app with automatic utility bill scraping for **LESCO** (electricity) and **SNGPL** (gas) in Pakistan.

## Features

- **Properties & floors** – Manage properties and their floors
- **Tenants & occupancies** – Track tenants, move-in/out, and rent
- **Utility connections** – Link electricity (LESCO) and gas (SNGPL) accounts to properties
- **Bill scraping** – Automatically fetch and store monthly bills from LESCO and SNGPL portals
- **Bill summary** – View bills by property, mark as paid, download HTML snapshots
- **Authentication** – JWT-based login/register

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | ASP.NET Core 10, Entity Framework Core, SQL Server, Minimal APIs |
| Frontend | React 19, TypeScript, Vite 7, Bootstrap 5, React Router |
| Bill scraping | Python 3 scripts (requests, BeautifulSoup, ddddocr) invoked by the server |

## Prerequisites

- **.NET 10 SDK** (or latest .NET 8+ if you adjust the target framework)
- **SQL Server** (LocalDB, Express, or full) with a database for the app
- **Node.js 18+** and npm (for building the client)
- **Python 3.9+** and pip (for bill scraping scripts)

## Setup

### 1. Clone and restore

```bash
git clone <repo-url>
cd Tenants
dotnet restore
```

### 2. Database

Create a database (or use an existing one). Update the connection string in `Tenants.Server/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=Tenants;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True",
  "DefaultConnection_Express": "Server=localhost\\SQLEXPRESS;Database=Tenants;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True"
},
"ActiveConnection": "DefaultConnection_Express"
```

Use `DefaultConnection` or `DefaultConnection_Express` and set `ActiveConnection` to match. In **Development**, migrations run on startup and the DB is seeded with a default user.

### 3. Optional: JWT and scraping

Edit `Tenants.Server/appsettings.json` as needed:

- **Jwt:Key** – Secret for signing tokens (default is a dev-only value; change in production).
- **Scraping:PythonPath** – Set if `python` / `python3` is not on PATH (e.g. `"C:\\Python312\\python.exe"`).

### 4. Python environment (for bill scraping)

Install dependencies for the scraper scripts:

```bash
cd Tenants.Server/Scripts
pip install -r requirements.txt
```

See [Tenants.Server/BILLS_SCRAPING.md](Tenants.Server/BILLS_SCRAPING.md) for details (LESCO reference number, SNGPL consumer number, schedules, and troubleshooting).

### 5. Build the client

The server serves the React app from `tenants.client/dist`. Build it before running:

```bash
cd tenants.client
npm install
npm run build
cd ..
```

### 6. Run the application

From the solution root:

```bash
dotnet run --project Tenants.Server
```

Or run **Tenants.Server** from Visual Studio. The app will:

- Listen on the configured URLs (e.g. https://localhost:7xxx)
- Apply migrations and seed data in Development
- Serve the SPA and API from the same host

**Default seeded user** (Development): check `DbInitializer.SeedAsync` in the server project for the test username/password.

## Project structure

```
Tenants/
├── Tenants.slnx                 # Solution file
├── Tenants.AppHost/             # Aspire app host (optional)
├── Tenants.Server/              # ASP.NET Core API + SPA hosting
│   ├── Api/                     # Minimal API endpoints
│   ├── Data/                    # DbContext, entities, migrations
│   ├── Services/                # Bill scrapers, Python runner, etc.
│   ├── Scripts/                 # Python scrapers (LESCO, SNGPL)
│   │   ├── lesco_scraper.py
│   │   ├── sngpl_scraper.py
│   │   └── requirements.txt
│   ├── App_Data/                # Stored bill HTML (e.g. bills/1/)
│   ├── BILLS_SCRAPING.md        # Bill scraping setup guide
│   └── appsettings.json
├── Tenants.ServiceDefaults/     # Shared service configuration
└── tenants.client/              # React + Vite frontend
    ├── src/
    └── package.json
```

## API overview

- **Auth** – `POST /auth/login`, `POST /auth/register`
- **Properties** – CRUD `/properties`, `/properties/{id}`
- **Floors** – CRUD under `/properties/{propertyId}/floors`, `/floors/{id}`
- **Tenants** – CRUD `/tenants`
- **Occupancies** – CRUD `/occupancies`, by property/floor/tenant
- **Utility connections** – CRUD `/properties/{propertyId}/utility-connections`, `/utility-connections/{id}`
- **Bills** – `GET /properties/{id}/bills`, `PUT /bills/{id}/mark-paid`, `GET /bills/{id}/snapshot`, `GET /properties/bill-summary`, `POST /bills/scrape-now?type=Electricity|Gas`
- **Rent** – Payments and rent-increase under `/occupancies/{id}/...`

OpenAPI is available in Development at the configured OpenAPI path.

## Bill scraping summary

| Utility | Connection field | Script | Schedule (default) |
|---------|------------------|--------|---------------------|
| Electricity (LESCO) | 14-digit Reference Number | `lesco_scraper.py` | 5th of each month |
| Gas (SNGPL) | 11-digit Consumer Number | `sngpl_scraper.py` | 18th of each month |

Scrapers run in the background; you can also trigger a scrape from the UI or via `POST /bills/scrape-now?type=Electricity` or `?type=Gas`. Full setup and prerequisites are in [Tenants.Server/BILLS_SCRAPING.md](Tenants.Server/BILLS_SCRAPING.md).

## License

Private / All rights reserved (or specify your license).
