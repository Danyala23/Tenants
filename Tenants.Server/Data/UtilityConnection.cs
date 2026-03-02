namespace Tenants.Server.Data;

public class UtilityConnection
{
    public int Id { get; set; }
    public int PropertyId { get; set; }
    public int? FloorId { get; set; }
    public UtilityType Type { get; set; } = UtilityType.Gas;

    public Property Property { get; set; } = null!;
    public Floor? Floor { get; set; }
}
