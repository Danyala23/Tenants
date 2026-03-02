using Microsoft.EntityFrameworkCore;
using Tenants.Server.Data;
using Tenants.Server.DTOs;

namespace Tenants.Server.Api;

public static class RentApi
{
    public static void MapRentApi(this IEndpointRouteBuilder routes)
    {
        var api = routes.MapGroup("/api").RequireAuthorization();

        api.MapGet("/occupancies/{occupancyId:int}/payments", async (int occupancyId, TenantsDbContext db) =>
            Results.Ok(await db.RentPayments
                .Where(r => r.TenantOccupancyId == occupancyId)
                .OrderByDescending(r => r.Year).ThenByDescending(r => r.Month)
                .Select(r => new RentPaymentDto(r.Id, r.TenantOccupancyId, r.Year, r.Month, r.IsPaid))
                .ToListAsync()));

        api.MapGet("/occupancies/{occupancyId:int}/rent-increase", async (int occupancyId, TenantsDbContext db) =>
        {
            var rule = await db.RentIncreaseRules.FirstOrDefaultAsync(r => r.TenantOccupancyId == occupancyId);
            if (rule == null) return Results.NotFound();
            return Results.Ok(new RentIncreaseRuleDto(rule.Id, rule.TenantOccupancyId, rule.IncreasePercent, rule.NextIncreaseDate));
        });

        api.MapPut("/occupancies/{occupancyId:int}/rent-increase", async (int occupancyId, UpdateRentIncreaseRequest req, TenantsDbContext db) =>
        {
            var rule = await db.RentIncreaseRules.FirstOrDefaultAsync(r => r.TenantOccupancyId == occupancyId);
            if (rule == null) return Results.NotFound();
            if (req.IncreasePercent.HasValue) rule.IncreasePercent = req.IncreasePercent.Value;
            if (req.NextIncreaseDate.HasValue) rule.NextIncreaseDate = req.NextIncreaseDate.Value;
            await db.SaveChangesAsync();
            return Results.Ok(new RentIncreaseRuleDto(rule.Id, rule.TenantOccupancyId, rule.IncreasePercent, rule.NextIncreaseDate));
        });
    }
}
