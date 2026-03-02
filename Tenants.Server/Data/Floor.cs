namespace Tenants.Server.Data;

public class Floor
{
    public int Id { get; set; }
    public int PropertyId { get; set; }
    public int FloorNumber { get; set; }
    public string Label { get; set; } = string.Empty;

    public Property Property { get; set; } = null!;
    public ICollection<TenantOccupancy> Occupancies { get; set; } = [];
    public ICollection<UtilityConnection> UtilityConnections { get; set; } = [];
    public ICollection<MonthlyBill> MonthlyBills { get; set; } = [];
}
