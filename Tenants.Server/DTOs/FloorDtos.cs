namespace Tenants.Server.DTOs;

public record FloorDto(int Id, int PropertyId, int FloorNumber, string Label);
public record CreateFloorRequest(int FloorNumber, string? Label);
public record UpdateFloorRequest(int? FloorNumber, string? Label);
