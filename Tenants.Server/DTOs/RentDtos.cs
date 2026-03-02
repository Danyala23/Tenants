namespace Tenants.Server.DTOs;

public record RentPaymentDto(int Id, int TenantOccupancyId, int Year, int Month, bool IsPaid);
public record RentIncreaseRuleDto(int Id, int TenantOccupancyId, decimal IncreasePercent, DateTime NextIncreaseDate);
public record UpdateRentIncreaseRequest(decimal? IncreasePercent, DateTime? NextIncreaseDate);
