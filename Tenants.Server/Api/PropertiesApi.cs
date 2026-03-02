using Microsoft.EntityFrameworkCore;
using Tenants.Server.Data;
using Tenants.Server.DTOs;

namespace Tenants.Server.Api;

public static class PropertiesApi
{
    public static void MapPropertiesApi(this IEndpointRouteBuilder routes)
    {
        var api = routes.MapGroup("/api").RequireAuthorization();

        api.MapGet("/properties", async (TenantsDbContext db) =>
            Results.Ok(await db.Properties
                .OrderBy(p => p.Address)
                .Select(p => new PropertyDto(p.Id, p.HouseNumber, p.Address, p.Size, p.CreatedAt))
                .ToListAsync()));

        api.MapGet("/properties/{id:int}", async (int id, TenantsDbContext db) =>
        {
            var p = await db.Properties.FindAsync(id);
            return p == null ? Results.NotFound() : Results.Ok(new PropertyDto(p.Id, p.HouseNumber, p.Address, p.Size, p.CreatedAt));
        });

        api.MapPost("/properties", async (CreatePropertyRequest req, TenantsDbContext db) =>
        {
            var p = new Property
            {
                HouseNumber = req.HouseNumber ?? "",
                Address = req.Address ?? "",
                Size = req.Size
            };
            db.Properties.Add(p);
            await db.SaveChangesAsync();
            return Results.Created($"/api/properties/{p.Id}", new PropertyDto(p.Id, p.HouseNumber, p.Address, p.Size, p.CreatedAt));
        });

        api.MapPut("/properties/{id:int}", async (int id, UpdatePropertyRequest req, TenantsDbContext db) =>
        {
            var p = await db.Properties.FindAsync(id);
            if (p == null) return Results.NotFound();
            if (req.HouseNumber != null) p.HouseNumber = req.HouseNumber;
            if (req.Address != null) p.Address = req.Address;
            if (req.Size.HasValue) p.Size = req.Size.Value;
            await db.SaveChangesAsync();
            return Results.Ok(new PropertyDto(p.Id, p.HouseNumber, p.Address, p.Size, p.CreatedAt));
        });

        api.MapDelete("/properties/{id:int}", async (int id, TenantsDbContext db) =>
        {
            var p = await db.Properties.FindAsync(id);
            if (p == null) return Results.NotFound();
            db.Properties.Remove(p);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
