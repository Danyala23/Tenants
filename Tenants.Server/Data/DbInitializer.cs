using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Tenants.Server.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(UserManager<ApplicationUser> userManager)
    {
        if (await userManager.Users.AnyAsync())
            return;

        var admin = new ApplicationUser { UserName = "admin", Email = "admin@tenants.local" };
        var result = await userManager.CreateAsync(admin, "Admin@123");
        if (!result.Succeeded)
            throw new InvalidOperationException($"Failed to seed admin: {string.Join(", ", result.Errors.Select(e => e.Description))}");
    }
}
