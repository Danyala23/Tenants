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
        {
            var occupancy = await db.TenantOccupancies.FindAsync(occupancyId);
            if (occupancy == null) return Results.NotFound();

            var realPayments = await db.RentPayments
                .Where(r => r.TenantOccupancyId == occupancyId)
                .ToListAsync();

            var paymentLookup = realPayments.ToDictionary(r => (r.Year, r.Month));

            var now = DateTime.UtcNow;
            var currentYear = now.Year;
            var currentMonth = now.Month;

            var start = occupancy.StartDate;
            var startYear = start.Year;
            var startMonth = start.Month;

            var result = new List<RentPaymentDto>();

            for (var y = startYear; y <= currentYear; y++)
            {
                var monthStart = (y == startYear) ? startMonth : 1;
                var monthEnd = (y == currentYear) ? currentMonth : 12;

                for (var m = monthStart; m <= monthEnd; m++)
                {
                    if (paymentLookup.TryGetValue((y, m), out var p))
                        result.Add(new RentPaymentDto(p.Id, p.TenantOccupancyId, p.Year, p.Month, p.IsPaid, p.AmountPaid, p.CollectedAt));
                    else
                        result.Add(new RentPaymentDto(0, occupancyId, y, m, false, 0, null));
                }
            }

            result = result.OrderByDescending(r => r.Year).ThenByDescending(r => r.Month).ToList();
            return Results.Ok(result);
        });

        api.MapPut("/occupancies/{occupancyId:int}/payments/collect", async (int occupancyId, CollectRentRequest req, TenantsDbContext db) =>
        {
            var occupancy = await db.TenantOccupancies.FindAsync(occupancyId);
            if (occupancy == null) return Results.NotFound();

            var payment = await db.RentPayments
                .FirstOrDefaultAsync(r => r.TenantOccupancyId == occupancyId && r.Year == req.Year && r.Month == req.Month);

            var collectedAt = req.CollectedAt ?? DateTime.UtcNow;
            if (payment == null)
            {
                payment = new RentPayment
                {
                    TenantOccupancyId = occupancyId,
                    Year = req.Year,
                    Month = req.Month,
                    AmountPaid = req.AmountPaid,
                    IsPaid = req.AmountPaid >= occupancy.Rent,
                    CollectedAt = collectedAt,
                };
                db.RentPayments.Add(payment);
            }
            else
            {
                payment.AmountPaid = req.AmountPaid;
                payment.IsPaid = req.AmountPaid >= occupancy.Rent;
                payment.CollectedAt = collectedAt;
            }

            await db.SaveChangesAsync();
            return Results.Ok(new RentPaymentDto(payment.Id, payment.TenantOccupancyId, payment.Year, payment.Month, payment.IsPaid, payment.AmountPaid, payment.CollectedAt));
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
