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

## Deployment to Azure App Service

The app is deployed to **Azure App Service** using Web Deploy (MSDeploy). The publish profile is pre-configured at `Tenants.Server/Properties/PublishProfiles/AppService.pubxml`.

**Live URL:** https://tenants-app-fga3bpcbgtarf0d9.westcentralus-01.azurewebsites.net

### Prerequisites

- An **Azure App Service** with **.NET 10** runtime stack
- An **Azure SQL Database** with the connection string configured in App Service > Configuration > Connection strings
- **Basic Auth Publishing Credentials** enabled on the App Service (Settings > Configuration > General settings > SCM Basic Auth = On)

### Deploy from CLI

From the solution root:

```bash
dotnet publish Tenants.Server/Tenants.Server.csproj -c Release /p:PublishProfile=AppService /p:Password="<deployment-password>"
```

This builds the server and client, then deploys via MSDeploy to Azure. The deployment password is the app-level credential from your publish profile (stored in `AppService.pubxml.user`).

### Deploy from Visual Studio

1. Right-click **Tenants.Server** > **Publish**
2. Select the **AppService** profile (or import a `.PublishSettings` file downloaded from Azure Portal)
3. Click **Publish**

### Updating the publish profile

If the deployment credentials expire or the App Service is recreated:

1. Go to Azure Portal > your App Service > **Download publish profile**
2. In Visual Studio, delete the old profile and **Import Profile** with the downloaded `.PublishSettings` file
3. Alternatively, update `AppService.pubxml` manually — the key properties are:
   - `MSDeployServiceURL` — the SCM hostname with port (e.g. `<app>.scm.<region>.azurewebsites.net:443`)
   - `DeployIisAppPath` — the app name (e.g. `tenants-app`)
   - `UserName` — the deployment username (e.g. `$tenants-app`)
   - `Password` in `AppService.pubxml.user` — the deployment password

### Database migrations

Migrations run automatically on app startup (see `Program.cs`). To apply migrations manually against the Azure SQL database:

```bash
dotnet ef database update --project Tenants.Server --connection "Server=tcp:<server>.database.windows.net,1433;Initial Catalog=Tenants;User ID=<user>;Password=<password>;Encrypt=True;TrustServerCertificate=False;"
```

### Important notes

- **Do not use `PublishProtocol=Kudu`** in the pubxml — the .NET 10 SDK's KuduDeploy task has compatibility issues with regional Azure URLs. Use `WebPublishMethod=MSDeploy` instead.
- Keep `AppService.pubxml.user` (contains the deployment password) out of source control via `.gitignore`.
- The `Jwt:Key` and database connection string should be configured as **App Service Configuration** settings in Azure, not hardcoded in `appsettings.json`.

## License

Private / All rights reserved (or specify your license).
