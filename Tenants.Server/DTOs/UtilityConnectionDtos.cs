namespace Tenants.Server.DTOs;

public record UtilityConnectionDto(
    int Id,
    int PropertyId,
    int? FloorId,
    string Type,
    string? ReferenceNumber,
    string? ConsumerNumber,
    string? ProviderName
);

public record CreateUtilityConnectionRequest(
    int? FloorId,
    string Type,
    string? ReferenceNumber,
    string? ConsumerNumber,
    string? ProviderName
);

public record UpdateUtilityConnectionRequest(
    int? FloorId,
    string? ReferenceNumber,
    string? ConsumerNumber,
    string? ProviderName
);
