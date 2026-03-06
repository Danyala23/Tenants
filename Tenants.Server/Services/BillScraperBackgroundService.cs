using Tenants.Server.Data;

namespace Tenants.Server.Services;

public class BillScraperBackgroundService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<BillScraperBackgroundService> _logger;

    public BillScraperBackgroundService(IServiceProvider services, ILogger<BillScraperBackgroundService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.UtcNow;
            var day = now.Day;

            if (day == 5)
            {
                _logger.LogInformation("Running electricity bill scrape (5th of month)");
                await RunScrapeAsync(UtilityType.Electricity, stoppingToken);
            }
            else if (day == 18)
            {
                _logger.LogInformation("Running gas bill scrape (18th of month)");
                await RunScrapeAsync(UtilityType.Gas, stoppingToken);
            }

            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    private async Task RunScrapeAsync(UtilityType? typeFilter, CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var scraperService = scope.ServiceProvider.GetRequiredService<BillScraperService>();
        await scraperService.ScrapeAsync(typeFilter, ct);
    }
}
