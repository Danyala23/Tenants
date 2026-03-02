namespace Tenants.Server.DTOs;

public record PropertyDto(int Id, string HouseNumber, string Address, decimal Size, DateTime CreatedAt);
public record CreatePropertyRequest(string? HouseNumber, string? Address, decimal Size);
public record UpdatePropertyRequest(string? HouseNumber, string? Address, decimal? Size);
