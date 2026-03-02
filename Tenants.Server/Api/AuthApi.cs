using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Tenants.Server.Data;
using Tenants.Server.DTOs;

namespace Tenants.Server.Api;

public static class AuthApi
{
    public static void MapAuthApi(this IEndpointRouteBuilder routes, IConfiguration config)
    {
        var api = routes.MapGroup("/api");

        api.MapPost("/auth/login", async (LoginRequest req, UserManager<ApplicationUser> userManager) =>
        {
            var user = await userManager.FindByNameAsync(req.Username ?? "");
            if (user == null || !await userManager.CheckPasswordAsync(user, req.Password ?? ""))
                return Results.Unauthorized();

            var token = GenerateJwtToken(user, config);
            return Results.Ok(new { success = true, username = user.UserName, token });
        });

        api.MapPost("/auth/register", async (RegisterRequest req, UserManager<ApplicationUser> userManager) =>
        {
            var user = new ApplicationUser { UserName = req.Username, Email = req.Email ?? $"{req.Username}@tenants.local" };
            var result = await userManager.CreateAsync(user, req.Password ?? "");
            if (!result.Succeeded)
                return Results.BadRequest(new { errors = result.Errors.Select(e => e.Description) });

            var token = GenerateJwtToken(user, config);
            return Results.Ok(new { success = true, username = user.UserName, token });
        });
    }

    private static string GenerateJwtToken(ApplicationUser user, IConfiguration config)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key not configured")));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = int.Parse(config["Jwt:ExpiryMinutes"] ?? "60");

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName ?? ""),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
