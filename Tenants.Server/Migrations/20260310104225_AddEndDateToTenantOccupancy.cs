using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tenants.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddEndDateToTenantOccupancy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EndDate",
                table: "TenantOccupancies",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "TenantOccupancies");
        }
    }
}
