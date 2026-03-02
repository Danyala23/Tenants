namespace Tenants.Server.Data;

public class RentIncreaseRule
{
    public int Id { get; set; }
    public int TenantOccupancyId { get; set; }
    public decimal IncreasePercent { get; set; } = 10;
    public DateTime NextIncreaseDate { get; set; }

    public TenantOccupancy TenantOccupancy { get; set; } = null!;
}
