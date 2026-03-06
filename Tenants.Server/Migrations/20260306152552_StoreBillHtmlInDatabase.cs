using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tenants.Server.Migrations
{
    /// <inheritdoc />
    public partial class StoreBillHtmlInDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BillImagePath",
                table: "MonthlyBills");

            migrationBuilder.AddColumn<string>(
                name: "BillHtmlContent",
                table: "MonthlyBills",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BillHtmlContent",
                table: "MonthlyBills");

            migrationBuilder.AddColumn<string>(
                name: "BillImagePath",
                table: "MonthlyBills",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }
    }
}
