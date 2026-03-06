namespace Tenants.Server.DTOs;

public record BillDto(
    int Id,
    int? TenantOccupancyId,
    int PropertyId,
    int? FloorId,
    string Type,
    int Year,
    int Month,
    decimal Amount,
    bool IsPaid,
    DateTime? DueDate,
    decimal? UnitsConsumed,
    DateTime? ScrapedAt,
    bool HasSnapshot
);

public record BillSummaryDto(int PropertyId, int UnpaidCount, int TotalCount);
