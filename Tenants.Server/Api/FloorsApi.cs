using Microsoft.EntityFrameworkCore;
using Tenants.Server.Data;
using Tenants.Server.DTOs;

namespace Tenants.Server.Api;

public static class FloorsApi
{
    public static void MapFloorsApi(this IEndpointRouteBuilder routes)
    {
        var api = routes.MapGroup("/api").RequireAuthorization();

        api.MapGet("/properties/{propertyId:int}/floors", async (int propertyId, TenantsDbContext db) =>
            Results.Ok(await db.Floors
                .Where(f => f.PropertyId == propertyId)
                .OrderBy(f => f.FloorNumber)
                .Select(f => new FloorDto(f.Id, f.PropertyId, f.FloorNumber, f.Label))
                .ToListAsync()));

        api.MapGet("/floors/{id:int}", async (int id, TenantsDbContext db) =>
        {
            var f = await db.Floors.Include(x => x.Property).FirstOrDefaultAsync(x => x.Id == id);
            return f == null ? Results.NotFound() : Results.Ok(new FloorDto(f.Id, f.PropertyId, f.FloorNumber, f.Label));
        });

        api.MapPost("/properties/{propertyId:int}/floors", async (int propertyId, CreateFloorRequest req, TenantsDbContext db) =>
        {
            var f = new Floor { PropertyId = propertyId, FloorNumber = req.FloorNumber, Label = req.Label ?? "" };
            db.Floors.Add(f);
            await db.SaveChangesAsync();
            return Results.Created($"/api/floors/{f.Id}", new FloorDto(f.Id, f.PropertyId, f.FloorNumber, f.Label));
        });

        api.MapPut("/floors/{id:int}", async (int id, UpdateFloorRequest req, TenantsDbContext db) =>
        {
            var f = await db.Floors.FindAsync(id);
            if (f == null) return Results.NotFound();
            if (req.FloorNumber.HasValue) f.FloorNumber = req.FloorNumber.Value;
            if (req.Label != null) f.Label = req.Label;
            await db.SaveChangesAsync();
            return Results.Ok(new FloorDto(f.Id, f.PropertyId, f.FloorNumber, f.Label));
        });

        api.MapDelete("/floors/{id:int}", async (int id, TenantsDbContext db) =>
        {
            var f = await db.Floors.FindAsync(id);
            if (f == null) return Results.NotFound();
            db.Floors.Remove(f);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
