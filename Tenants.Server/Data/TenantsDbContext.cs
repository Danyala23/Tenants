using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Tenants.Server.Data;

public class TenantsDbContext : IdentityDbContext<ApplicationUser>
{
    public TenantsDbContext(DbContextOptions<TenantsDbContext> options)
        : base(options) { }

    public DbSet<Property> Properties => Set<Property>();
    public DbSet<Floor> Floors => Set<Floor>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<TenantOccupancy> TenantOccupancies => Set<TenantOccupancy>();
    public DbSet<UtilityConnection> UtilityConnections => Set<UtilityConnection>();
    public DbSet<MonthlyBill> MonthlyBills => Set<MonthlyBill>();
    public DbSet<RentPayment> RentPayments => Set<RentPayment>();
    public DbSet<RentIncreaseRule> RentIncreaseRules => Set<RentIncreaseRule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Property>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.HouseNumber).HasMaxLength(50);
            e.Property(x => x.Address).HasMaxLength(500);
            e.Property(x => x.Size).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Floor>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Property)
                .WithMany(p => p.Floors)
                .HasForeignKey(x => x.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);
            e.Property(x => x.Label).HasMaxLength(100);
        });

        modelBuilder.Entity<Tenant>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.PhoneNumber).HasMaxLength(50);
        });

        modelBuilder.Entity<TenantOccupancy>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Tenant)
                .WithMany(t => t.Occupancies)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Property)
                .WithMany(p => p.Occupancies)
                .HasForeignKey(x => x.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Floor)
                .WithMany(f => f.Occupancies)
                .HasForeignKey(x => x.FloorId)
                .OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.Rent).HasPrecision(18, 2);
            e.Property(x => x.SecurityDeposit).HasPrecision(18, 2);
        });

        modelBuilder.Entity<UtilityConnection>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Property)
                .WithMany(p => p.UtilityConnections)
                .HasForeignKey(x => x.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Floor)
                .WithMany(f => f.UtilityConnections)
                .HasForeignKey(x => x.FloorId)
                .OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(50);
        });

        modelBuilder.Entity<MonthlyBill>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.TenantOccupancy)
                .WithMany()
                .HasForeignKey(x => x.TenantOccupancyId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Property)
                .WithMany(p => p.MonthlyBills)
                .HasForeignKey(x => x.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Floor)
                .WithMany(f => f.MonthlyBills)
                .HasForeignKey(x => x.FloorId)
                .OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(50);
            e.Property(x => x.Amount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<RentPayment>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.TenantOccupancy)
                .WithMany(o => o.RentPayments)
                .HasForeignKey(x => x.TenantOccupancyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RentIncreaseRule>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.TenantOccupancy)
                .WithOne(o => o.RentIncreaseRule)
                .HasForeignKey<RentIncreaseRule>(x => x.TenantOccupancyId)
                .OnDelete(DeleteBehavior.Cascade);
            e.Property(x => x.IncreasePercent).HasPrecision(5, 2);
        });
    }
}
