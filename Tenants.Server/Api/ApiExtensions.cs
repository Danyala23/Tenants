namespace Tenants.Server.Api;

public static class ApiExtensions
{
    public static void MapApi(this IEndpointRouteBuilder routes, IConfiguration config)
    {
        routes.MapAuthApi(config);
        routes.MapPropertiesApi();
        routes.MapFloorsApi();
        routes.MapTenantEndpoints();
        routes.MapOccupancyEndpoints();
        routes.MapBillsApi();
        routes.MapRentApi();
    }
}
