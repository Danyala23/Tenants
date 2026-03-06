using Tenants.Server.Data;

namespace Tenants.Server.Services;

public class LescoBillScraper : IBillScraper
{
    private readonly PythonScriptRunner _runner;
    private readonly ILogger<LescoBillScraper> _logger;

    public LescoBillScraper(PythonScriptRunner runner, ILogger<LescoBillScraper> logger)
    {
        _runner = runner;
        _logger = logger;
    }

    public UtilityType UtilityType => UtilityType.Electricity;

    public async Task<ScrapedBillResult?> ScrapeAsync(UtilityConnection connection, CancellationToken ct = default)
    {
        var refNo = connection.ReferenceNumber?.Trim();
        if (string.IsNullOrEmpty(refNo)) return null;

        _logger.LogDebug("LESCO: Fetching bill for ref {RefNo}", refNo);

        var result = await _runner.RunAsync("lesco_scraper.py", [refNo], ct);
        if (result == null)
        {
            _logger.LogWarning("LESCO: Scrape failed for ref {RefNo}", refNo);
            return null;
        }

        return result;
    }
}
