using Microsoft.EntityFrameworkCore;
using Tenants.Server.Data;

namespace Tenants.Server.Services;

public class BillScraperService
{
    private readonly TenantsDbContext _db;
    private readonly IEnumerable<IBillScraper> _scrapers;
    private readonly ILogger<BillScraperService> _logger;

    public BillScraperService(
        TenantsDbContext db,
        IEnumerable<IBillScraper> scrapers,
        ILogger<BillScraperService> logger)
    {
        _db = db;
        _scrapers = scrapers;
        _logger = logger;
    }

    public async Task ScrapeAsync(UtilityType? typeFilter, CancellationToken ct = default)
    {
        var typesToRun = typeFilter.HasValue
            ? new[] { typeFilter.Value }
            : new[] { UtilityType.Electricity, UtilityType.Gas };

        foreach (var ut in typesToRun)
        {
            var scraper = _scrapers.FirstOrDefault(s => s.UtilityType == ut);
            if (scraper == null) continue;

            var connections = await _db.UtilityConnections
                .Where(c => c.Type == ut && (ut == UtilityType.Electricity ? c.ReferenceNumber != null : c.ConsumerNumber != null))
                .Include(c => c.Property)
                .ToListAsync(ct);

            foreach (var conn in connections)
            {
                try
                {
                    var result = await scraper.ScrapeAsync(conn, ct);
                    if (result == null) continue;

                    var billType = ut == UtilityType.Electricity ? BillType.Electricity : BillType.Gas;
                    var provider = conn.ProviderName ?? (ut == UtilityType.Electricity ? "LESCO" : "SNGPL");

                    var existing = await _db.MonthlyBills
                        .FirstOrDefaultAsync(b =>
                            b.PropertyId == conn.PropertyId &&
                            b.FloorId == conn.FloorId &&
                            (int)b.Type == (int)billType &&
                            b.Year == result.Year &&
                            b.Month == result.Month, ct);

                    var cleanedHtml = !string.IsNullOrEmpty(result.HtmlContent)
                        ? HtmlCleaner.Clean(result.HtmlContent)
                        : null;

                    if (existing != null)
                    {
                        existing.Amount = result.Amount;
                        existing.DueDate = result.DueDate;
                        existing.UnitsConsumed = result.UnitsConsumed;
                        existing.BillHtmlContent = cleanedHtml ?? existing.BillHtmlContent;
                        existing.ScrapedAt = DateTime.UtcNow;
                        existing.UtilityConnectionId = conn.Id;
                    }
                    else
                    {
                        _db.MonthlyBills.Add(new MonthlyBill
                        {
                            PropertyId = conn.PropertyId,
                            FloorId = conn.FloorId,
                            UtilityConnectionId = conn.Id,
                            Type = billType,
                            Year = result.Year,
                            Month = result.Month,
                            Amount = result.Amount,
                            DueDate = result.DueDate,
                            UnitsConsumed = result.UnitsConsumed,
                            BillHtmlContent = cleanedHtml,
                            ScrapedAt = DateTime.UtcNow,
                            IsPaid = false
                        });
                    }

                    await _db.SaveChangesAsync(ct);
                    _logger.LogInformation("Scraped bill for property {PropertyId} {Type} {Year}-{Month}", conn.PropertyId, billType, result.Year, result.Month);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to scrape bill for connection {ConnectionId} ({Provider})", conn.Id, conn.ProviderName);
                }
            }
        }
    }
}
