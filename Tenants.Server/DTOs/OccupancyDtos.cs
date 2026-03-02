namespace Tenants.Server.DTOs;

public record OccupancyDto(
    int Id,
    int TenantId,
    string TenantName,
    string TenantPhone,
    int PropertyId,
    int? FloorId,
    string? FloorLabel,
    bool IsWholeProperty,
    decimal Rent,
    decimal SecurityDeposit,
    DateTime StartDate);

public record CreateOccupancyRequest(
    int? TenantId,
    string? Name,
    string? PhoneNumber,
    int? FloorId,
    decimal Rent,
    decimal SecurityDeposit,
    DateTime StartDate);

public record UpdateOccupancyRequest(decimal? Rent, decimal? SecurityDeposit, DateTime? StartDate);
