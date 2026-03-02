namespace Tenants.Server.DTOs;

public record BillDto(int Id, int? TenantOccupancyId, int PropertyId, int? FloorId, string Type, int Year, int Month, decimal Amount, bool IsPaid);
