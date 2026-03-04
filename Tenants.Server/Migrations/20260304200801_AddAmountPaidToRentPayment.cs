using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tenants.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddAmountPaidToRentPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AmountPaid",
                table: "RentPayments",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AmountPaid",
                table: "RentPayments");
        }
    }
}
