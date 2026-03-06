using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Tenants.Server.Api;
using Tenants.Server.Data;
using Tenants.Server.Services;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddDbContext<TenantsDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString(builder.Configuration["ActiveConnection"] ?? "DefaultConnection")));
builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
})
    .AddEntityFrameworkStores<TenantsDbContext>()
    .AddSignInManager<SignInManager<ApplicationUser>>()
    .AddUserManager<UserManager<ApplicationUser>>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? ""))
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.AddHttpClient();
builder.Services.AddSingleton<PythonScriptRunner>();
builder.Services.AddSingleton<IBillScraper, LescoBillScraper>();
builder.Services.AddSingleton<IBillScraper, SngplBillScraper>();
builder.Services.AddScoped<BillScraperService>();
builder.Services.AddHostedService<BillScraperBackgroundService>();

var app = builder.Build();

app.MapDefaultEndpoints();

// Serve SPA from client's dist folder (build with: cd tenants.client && npm run build)
var clientDistPath = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "tenants.client", "dist"));
if (Directory.Exists(clientDistPath))
{
    var fileProvider = new PhysicalFileProvider(clientDistPath);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = fileProvider });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = fileProvider });
}
else
{
    app.UseDefaultFiles();
    app.MapStaticAssets();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<TenantsDbContext>();
    await db.Database.MigrateAsync();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    await DbInitializer.SeedAsync(userManager);
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Minimal APIs
app.MapApi(app.Configuration);

// SPA fallback: serve index.html for unmatched routes
if (Directory.Exists(clientDistPath))
{
    app.MapFallback(async context =>
    {
        context.Response.ContentType = "text/html";
        await context.Response.SendFileAsync(Path.Combine(clientDistPath, "index.html"));
    });
}
else
{
    app.MapFallbackToFile("/index.html");
}

app.Run();
