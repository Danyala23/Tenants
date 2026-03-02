namespace Tenants.Server.DTOs;

public record TenantDto(int Id, string Name, string PhoneNumber);
public record CreateTenantRequest(string? Name, string? PhoneNumber);
public record UpdateTenantRequest(string? Name, string? PhoneNumber);
