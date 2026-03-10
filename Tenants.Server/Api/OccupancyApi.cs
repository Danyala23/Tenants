using Microsoft.EntityFrameworkCore;
using Tenants.Server.Data;
using Tenants.Server.DTOs;

namespace Tenants.Server.Api;

public static class OccupancyApi
{
    public static void MapOccupancyEndpoints(this IEndpointRouteBuilder routes)
    {
        var api = routes.MapGroup("/api").RequireAuthorization();

        api.MapGet("/floors/{floorId:int}/occupancies", async (int floorId, TenantsDbContext db) =>
            Results.Ok(await db.TenantOccupancies
                .Where(o => o.FloorId == floorId && o.EndDate == null)
                .Include(o => o.Tenant)
                .Include(o => o.Floor)
                .Select(o => new OccupancyDto(o.Id, o.TenantId, o.Tenant.Name, o.Tenant.PhoneNumber, o.PropertyId, o.FloorId, o.Floor!.Label, false, o.Rent, o.SecurityDeposit, o.StartDate))
                .ToListAsync()));

        api.MapGet("/properties/{propertyId:int}/occupancies", async (int propertyId, TenantsDbContext db) =>
            Results.Ok(await db.TenantOccupancies
                .Where(o => o.PropertyId == propertyId && o.EndDate == null)
                .Include(o => o.Tenant)
                .Include(o => o.Floor)
                .Select(o => new OccupancyDto(o.Id, o.TenantId, o.Tenant.Name, o.Tenant.PhoneNumber, o.PropertyId, o.FloorId, o.Floor != null ? o.Floor.Label : null, o.FloorId == null, o.Rent, o.SecurityDeposit, o.StartDate))
                .ToListAsync()));

        api.MapGet("/tenants/{tenantId:int}/occupancies", async (int tenantId, TenantsDbContext db) =>
            Results.Ok(await db.TenantOccupancies
                .Where(o => o.TenantId == tenantId)
                .Include(o => o.Tenant)
                .Include(o => o.Floor)
                .Include(o => o.Property)
                .Select(o => new OccupancyDto(o.Id, o.TenantId, o.Tenant.Name, o.Tenant.PhoneNumber, o.PropertyId, o.FloorId, o.Floor != null ? o.Floor.Label : null, o.FloorId == null, o.Rent, o.SecurityDeposit, o.StartDate))
                .ToListAsync()));

        api.MapGet("/occupancies/{id:int}", async (int id, TenantsDbContext db) =>
        {
            var o = await db.TenantOccupancies.Include(x => x.Tenant).Include(x => x.Floor).FirstOrDefaultAsync(x => x.Id == id);
            return o == null ? Results.NotFound() : Results.Ok(new OccupancyDto(o.Id, o.TenantId, o.Tenant.Name, o.Tenant.PhoneNumber, o.PropertyId, o.FloorId, o.Floor?.Label, o.FloorId == null, o.Rent, o.SecurityDeposit, o.StartDate));
        });

        api.MapPost("/properties/{propertyId:int}/occupancies", async (int propertyId, CreateOccupancyRequest req, TenantsDbContext db) =>
        {
            Tenant tenant;
            if (req.TenantId.HasValue)
            {
                tenant = await db.Tenants.FindAsync(req.TenantId.Value) ?? throw new InvalidOperationException("Tenant not found");
            }
            else
            {
                tenant = new Tenant { Name = req.Name ?? "", PhoneNumber = req.PhoneNumber ?? "" };
                db.Tenants.Add(tenant);
                await db.SaveChangesAsync();
            }

            var occ = new TenantOccupancy
            {
                TenantId = tenant.Id,
                PropertyId = propertyId,
                FloorId = req.FloorId,
                Rent = req.Rent,
                SecurityDeposit = req.SecurityDeposit,
                StartDate = req.StartDate
            };
            db.TenantOccupancies.Add(occ);
            await db.SaveChangesAsync();

            var rule = new RentIncreaseRule { TenantOccupancyId = occ.Id, IncreasePercent = 10, NextIncreaseDate = occ.StartDate.AddYears(1) };
            db.RentIncreaseRules.Add(rule);
            await db.SaveChangesAsync();

            return Results.Created($"/api/occupancies/{occ.Id}", new OccupancyDto(occ.Id, tenant.Id, tenant.Name, tenant.PhoneNumber, propertyId, occ.FloorId, null, occ.FloorId == null, occ.Rent, occ.SecurityDeposit, occ.StartDate));
        });

        api.MapPut("/occupancies/{id:int}", async (int id, UpdateOccupancyRequest req, TenantsDbContext db) =>
        {
            var o = await db.TenantOccupancies.Include(x => x.Tenant).Include(x => x.Floor).FirstOrDefaultAsync(x => x.Id == id);
            if (o == null) return Results.NotFound();
            if (req.FloorId.HasValue) o.FloorId = req.FloorId.Value;
            if (req.Rent.HasValue) o.Rent = req.Rent.Value;
            if (req.SecurityDeposit.HasValue) o.SecurityDeposit = req.SecurityDeposit.Value;
            if (req.StartDate.HasValue) o.StartDate = req.StartDate.Value;
            await db.SaveChangesAsync();
            o = await db.TenantOccupancies.Include(x => x.Tenant).Include(x => x.Floor).FirstAsync(x => x.Id == id);
            return Results.Ok(new OccupancyDto(o.Id, o.TenantId, o.Tenant.Name, o.Tenant.PhoneNumber, o.PropertyId, o.FloorId, o.Floor?.Label, o.FloorId == null, o.Rent, o.SecurityDeposit, o.StartDate));
        });

        api.MapPut("/occupancies/{id:int}/vacate", async (int id, TenantsDbContext db) =>
        {
            var o = await db.TenantOccupancies.FindAsync(id);
            if (o == null) return Results.NotFound();
            o.EndDate = DateTime.UtcNow.Date;
            await db.SaveChangesAsync();
            o = await db.TenantOccupancies.Include(x => x.Tenant).Include(x => x.Floor).FirstAsync(x => x.Id == id);
            return Results.Ok(new OccupancyDto(o.Id, o.TenantId, o.Tenant.Name, o.Tenant.PhoneNumber, o.PropertyId, o.FloorId, o.Floor?.Label, o.FloorId == null, o.Rent, o.SecurityDeposit, o.StartDate));
        });

        api.MapDelete("/occupancies/{id:int}", async (int id, TenantsDbContext db) =>
        {
            var o = await db.TenantOccupancies.FindAsync(id);
            if (o == null) return Results.NotFound();
            db.TenantOccupancies.Remove(o);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
