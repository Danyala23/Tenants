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
                .Select(r => new RentPaymentDto(r.Id, r.TenantOccupancyId, r.Year, r.Month, r.IsPaid, r.AmountPaid))
                .ToListAsync()));

        api.MapPut("/occupancies/{occupancyId:int}/payments/collect", async (int occupancyId, CollectRentRequest req, TenantsDbContext db) =>
        {
            var occupancy = await db.TenantOccupancies.FindAsync(occupancyId);
            if (occupancy == null) return Results.NotFound();

            var payment = await db.RentPayments
                .FirstOrDefaultAsync(r => r.TenantOccupancyId == occupancyId && r.Year == req.Year && r.Month == req.Month);

            if (payment == null)
            {
                payment = new RentPayment
                {
                    TenantOccupancyId = occupancyId,
                    Year = req.Year,
                    Month = req.Month,
                    AmountPaid = req.AmountPaid,
                    IsPaid = req.AmountPaid >= occupancy.Rent,
                };
                db.RentPayments.Add(payment);
            }
            else
            {
                payment.AmountPaid = req.AmountPaid;
                payment.IsPaid = req.AmountPaid >= occupancy.Rent;
            }

            await db.SaveChangesAsync();
            return Results.Ok(new RentPaymentDto(payment.Id, payment.TenantOccupancyId, payment.Year, payment.Month, payment.IsPaid, payment.AmountPaid));
        });

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
