using Microsoft.EntityFrameworkCore;
using Tenants.Server.Data;
using Tenants.Server.DTOs;

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
                .Select(b => new BillDto(b.Id, b.TenantOccupancyId, b.PropertyId, b.FloorId, b.Type.ToString(), b.Year, b.Month, b.Amount, b.IsPaid))
                .ToListAsync();
            return Results.Ok(list);
        });
    }
}
