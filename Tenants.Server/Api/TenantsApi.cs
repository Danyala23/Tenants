using Microsoft.EntityFrameworkCore;
using Tenants.Server.Data;
using Tenants.Server.DTOs;

namespace Tenants.Server.Api;

public static class TenantsApi
{
    public static void MapTenantEndpoints(this IEndpointRouteBuilder routes)
    {
        var api = routes.MapGroup("/api").RequireAuthorization();

        api.MapGet("/tenants", async (TenantsDbContext db) =>
            Results.Ok(await db.Tenants
                .OrderBy(t => t.Name)
                .Select(t => new TenantDto(t.Id, t.Name, t.PhoneNumber))
                .ToListAsync()));

        api.MapGet("/tenants/{id:int}", async (int id, TenantsDbContext db) =>
        {
            var t = await db.Tenants
                .Include(x => x.Occupancies)
                .ThenInclude(o => o.Property)
                .Include(x => x.Occupancies)
                .ThenInclude(o => o.Floor)
                .FirstOrDefaultAsync(x => x.Id == id);
            return t == null ? Results.NotFound() : Results.Ok(new TenantDto(t.Id, t.Name, t.PhoneNumber));
        });

        api.MapPost("/tenants", async (CreateTenantRequest req, TenantsDbContext db) =>
        {
            var t = new Tenant { Name = req.Name ?? "", PhoneNumber = req.PhoneNumber ?? "" };
            db.Tenants.Add(t);
            await db.SaveChangesAsync();
            return Results.Created($"/api/tenants/{t.Id}", new TenantDto(t.Id, t.Name, t.PhoneNumber));
        });

        api.MapPut("/tenants/{id:int}", async (int id, UpdateTenantRequest req, TenantsDbContext db) =>
        {
            var t = await db.Tenants.FindAsync(id);
            if (t == null) return Results.NotFound();
            if (req.Name != null) t.Name = req.Name;
            if (req.PhoneNumber != null) t.PhoneNumber = req.PhoneNumber;
            await db.SaveChangesAsync();
            return Results.Ok(new TenantDto(t.Id, t.Name, t.PhoneNumber));
        });

        api.MapDelete("/tenants/{id:int}", async (int id, TenantsDbContext db) =>
        {
            var t = await db.Tenants.FindAsync(id);
            if (t == null) return Results.NotFound();
            db.Tenants.Remove(t);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
