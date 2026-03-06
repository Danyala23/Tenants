using Tenants.Server.Data;

namespace Tenants.Server.Services;

public class SngplBillScraper : IBillScraper
{
    private readonly PythonScriptRunner _runner;
    private readonly ILogger<SngplBillScraper> _logger;
    public SngplBillScraper(PythonScriptRunner runner, ILogger<SngplBillScraper> logger)
    {
        _runner = runner;
        _logger = logger;
    }

    public UtilityType UtilityType => UtilityType.Gas;

    public async Task<ScrapedBillResult?> ScrapeAsync(UtilityConnection connection, CancellationToken ct = default)
    {
        var consumerNo = connection.ConsumerNumber?.Trim();
        if (string.IsNullOrEmpty(consumerNo)) return null;

        _logger.LogDebug("SNGPL: Fetching bill for consumer {ConsumerNo}", consumerNo);

        var result = await _runner.RunAsync("sngpl_scraper.py", [consumerNo], ct);
        if (result == null)
        {
            _logger.LogWarning("SNGPL: Scrape failed for consumer {ConsumerNo}", consumerNo);
        }

        return result;
    }
}
