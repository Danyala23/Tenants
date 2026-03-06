using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tenants.Server.Data;
using Tenants.Server.DTOs;
using Tenants.Server.Services;

namespace Tenants.Server.Api;

public static class BillsApi
{
    public static void MapBillsApi(this IEndpointRouteBuilder routes)
    {
        var api = routes.MapGroup("/api").RequireAuthorization();

        api.MapGet("/properties/{propertyId:int}/bills", async (int propertyId, int? year, int? month, TenantsDbContext db) =>
        {
            var q = db.MonthlyBills.Where(b => b.PropertyId == propertyId).AsQueryable();
            if (year.HasValue) q = q.Where(b => b.Year == year.Value);
            if (month.HasValue) q = q.Where(b => b.Month == month.Value);
            var list = await q
                .Select(b => new BillDto(
                    b.Id, b.TenantOccupancyId, b.PropertyId, b.FloorId, b.Type.ToString(),
                    b.Year, b.Month, b.Amount, b.IsPaid,
                    b.DueDate, b.UnitsConsumed, b.ScrapedAt, b.BillHtmlContent != null))
                .ToListAsync();
            return Results.Ok(list);
        });

        api.MapPut("/bills/{id:int}/mark-paid", async (int id, TenantsDbContext db) =>
        {
            var bill = await db.MonthlyBills.FindAsync(id);
            if (bill == null) return Results.NotFound();
            bill.IsPaid = !bill.IsPaid;
            await db.SaveChangesAsync();
            return Results.Ok(new { isPaid = bill.IsPaid });
        });

        api.MapGet("/properties/bill-summary", async (TenantsDbContext db) =>
        {
            var now = DateTime.UtcNow;
            var year = now.Year;
            var month = now.Month;
            var summaries = await db.MonthlyBills
                .Where(b => b.Year == year && b.Month == month)
                .GroupBy(b => b.PropertyId)
                .Select(g => new BillSummaryDto(
                    g.Key,
                    g.Count(b => !b.IsPaid),
                    g.Count()))
                .ToListAsync();
            return Results.Ok(summaries);
        });

        api.MapGet("/bills/{id:int}/snapshot", async (int id, TenantsDbContext db) =>
        {
            var bill = await db.MonthlyBills.FindAsync(id);
            if (bill == null || string.IsNullOrEmpty(bill.BillHtmlContent))
                return Results.NotFound();
            return Results.Content(bill.BillHtmlContent, "text/html");
        });

        api.MapPost("/bills/scrape-now", async ([FromQuery] string? type, BillScraperService scraperService) =>
        {
            UtilityType? filter = null;
            if (!string.IsNullOrEmpty(type) && Enum.TryParse<UtilityType>(type, true, out var t))
                filter = t;
            await scraperService.ScrapeAsync(filter);
            return Results.Ok();
        });
    }
}
