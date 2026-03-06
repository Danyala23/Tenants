using Tenants.Server.Data;

namespace Tenants.Server.Services;

public interface IBillScraper
{
    UtilityType UtilityType { get; }

    Task<ScrapedBillResult?> ScrapeAsync(UtilityConnection connection, CancellationToken ct = default);
}

public record ScrapedBillResult(
    decimal Amount,
    DateTime? DueDate,
    decimal? UnitsConsumed,
    int Year,
    int Month,
    string HtmlContent
);
