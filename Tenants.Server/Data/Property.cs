namespace Tenants.Server.Data;

public class Property
{
    public int Id { get; set; }
    public string HouseNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal Size { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Floor> Floors { get; set; } = [];
    public ICollection<TenantOccupancy> Occupancies { get; set; } = [];
    public ICollection<UtilityConnection> UtilityConnections { get; set; } = [];
    public ICollection<MonthlyBill> MonthlyBills { get; set; } = [];
}
