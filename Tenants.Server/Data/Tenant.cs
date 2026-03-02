namespace Tenants.Server.Data;

public class Tenant
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    public ICollection<TenantOccupancy> Occupancies { get; set; } = [];
}
