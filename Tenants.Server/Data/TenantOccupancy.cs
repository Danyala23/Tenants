namespace Tenants.Server.Data;

/// <summary>
/// Represents a tenant's occupancy of a floor or entire property.
/// FloorId null = whole property; non-null = specific floor.
/// </summary>
public class TenantOccupancy
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int PropertyId { get; set; }
    public int? FloorId { get; set; }
    public decimal Rent { get; set; }
    public decimal SecurityDeposit { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public Property Property { get; set; } = null!;
    public Floor? Floor { get; set; }
    public ICollection<RentPayment> RentPayments { get; set; } = [];
    public RentIncreaseRule? RentIncreaseRule { get; set; }
}
