using Microsoft.EntityFrameworkCore;
using Tenants.Server.Data;
using Tenants.Server.DTOs;

namespace Tenants.Server.Api;

public static class UtilityConnectionsApi
{
    public static void MapUtilityConnectionsApi(this IEndpointRouteBuilder routes)
    {
        var api = routes.MapGroup("/api").RequireAuthorization();

        api.MapGet("/properties/{propertyId:int}/utility-connections", async (int propertyId, TenantsDbContext db) =>
        {
            var list = await db.UtilityConnections
                .Where(c => c.PropertyId == propertyId)
                .Select(c => new UtilityConnectionDto(
                    c.Id, c.PropertyId, c.FloorId, c.Type.ToString(),
                    c.ReferenceNumber, c.ConsumerNumber, c.ProviderName))
                .ToListAsync();
            return Results.Ok(list);
        });

        api.MapPost("/properties/{propertyId:int}/utility-connections", async (int propertyId, CreateUtilityConnectionRequest req, TenantsDbContext db) =>
        {
            var type = Enum.TryParse<UtilityType>(req.Type, true, out var t) ? t : UtilityType.Gas;
            var conn = new UtilityConnection
            {
                PropertyId = propertyId,
                FloorId = req.FloorId,
                Type = type,
                ReferenceNumber = req.ReferenceNumber?.Trim().NullIfEmpty(),
                ConsumerNumber = req.ConsumerNumber?.Trim().NullIfEmpty(),
                ProviderName = req.ProviderName?.Trim().NullIfEmpty()
            };
            db.UtilityConnections.Add(conn);
            await db.SaveChangesAsync();
            return Results.Created($"/api/utility-connections/{conn.Id}", new UtilityConnectionDto(
                conn.Id, conn.PropertyId, conn.FloorId, conn.Type.ToString(),
                conn.ReferenceNumber, conn.ConsumerNumber, conn.ProviderName));
        });

        api.MapPut("/utility-connections/{id:int}", async (int id, UpdateUtilityConnectionRequest req, TenantsDbContext db) =>
        {
            var conn = await db.UtilityConnections.FindAsync(id);
            if (conn == null) return Results.NotFound();
            if (req.FloorId.HasValue) conn.FloorId = req.FloorId;
            if (req.ReferenceNumber != null) conn.ReferenceNumber = req.ReferenceNumber.Trim().NullIfEmpty();
            if (req.ConsumerNumber != null) conn.ConsumerNumber = req.ConsumerNumber.Trim().NullIfEmpty();
            if (req.ProviderName != null) conn.ProviderName = req.ProviderName.Trim().NullIfEmpty();
            await db.SaveChangesAsync();
            return Results.Ok(new UtilityConnectionDto(
                conn.Id, conn.PropertyId, conn.FloorId, conn.Type.ToString(),
                conn.ReferenceNumber, conn.ConsumerNumber, conn.ProviderName));
        });

        api.MapDelete("/utility-connections/{id:int}", async (int id, TenantsDbContext db) =>
        {
            var conn = await db.UtilityConnections.FindAsync(id);
            if (conn == null) return Results.NotFound();
            db.UtilityConnections.Remove(conn);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }

    private static string? NullIfEmpty(this string s) => string.IsNullOrWhiteSpace(s) ? null : s;
}
