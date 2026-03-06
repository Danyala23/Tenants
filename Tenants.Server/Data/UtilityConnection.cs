namespace Tenants.Server.Data;

public class UtilityConnection
{
    public int Id { get; set; }
    public int PropertyId { get; set; }
    public int? FloorId { get; set; }
    public UtilityType Type { get; set; } = UtilityType.Gas;

    /// <summary>LESCO: 14-digit reference number (e.g. "12112181887022")</summary>
    public string? ReferenceNumber { get; set; }
    /// <summary>SNGPL: 11-digit consumer number (e.g. "53467826375")</summary>
    public string? ConsumerNumber { get; set; }
    /// <summary>Provider name for scraper dispatch (e.g. "LESCO", "SNGPL")</summary>
    public string? ProviderName { get; set; }

    public Property Property { get; set; } = null!;
    public Floor? Floor { get; set; }
}
