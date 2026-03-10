namespace Tenants.Server.Data;

public class RentPayment
{
    public int Id { get; set; }
    public int TenantOccupancyId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public bool IsPaid { get; set; }
    public decimal AmountPaid { get; set; }
    public DateTime? CollectedAt { get; set; }

    public TenantOccupancy TenantOccupancy { get; set; } = null!;
}
