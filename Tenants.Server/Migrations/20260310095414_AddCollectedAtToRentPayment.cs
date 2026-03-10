using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tenants.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddCollectedAtToRentPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CollectedAt",
                table: "RentPayments",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CollectedAt",
                table: "RentPayments");
        }
    }
}
