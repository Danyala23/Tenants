namespace Tenants.Server.Data;

public class MonthlyBill
{
    public int Id { get; set; }
    public int? TenantOccupancyId { get; set; }
    public int PropertyId { get; set; }
    public int? FloorId { get; set; }
    public int? UtilityConnectionId { get; set; }
    public BillType Type { get; set; } = BillType.Water;
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal Amount { get; set; }
    public bool IsPaid { get; set; }

    public DateTime? DueDate { get; set; }
    public decimal? UnitsConsumed { get; set; }
    public string? BillHtmlContent { get; set; }
    public DateTime? ScrapedAt { get; set; }

    public TenantOccupancy? TenantOccupancy { get; set; }
    public Property Property { get; set; } = null!;
    public Floor? Floor { get; set; }
    public UtilityConnection? UtilityConnection { get; set; }
}
