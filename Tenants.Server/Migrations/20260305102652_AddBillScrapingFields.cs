using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tenants.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddBillScrapingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConsumerNumber",
                table: "UtilityConnections",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderName",
                table: "UtilityConnections",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceNumber",
                table: "UtilityConnections",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BillImagePath",
                table: "MonthlyBills",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DueDate",
                table: "MonthlyBills",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScrapedAt",
                table: "MonthlyBills",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "UnitsConsumed",
                table: "MonthlyBills",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UtilityConnectionId",
                table: "MonthlyBills",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MonthlyBills_UtilityConnectionId",
                table: "MonthlyBills",
                column: "UtilityConnectionId");

            migrationBuilder.AddForeignKey(
                name: "FK_MonthlyBills_UtilityConnections_UtilityConnectionId",
                table: "MonthlyBills",
                column: "UtilityConnectionId",
                principalTable: "UtilityConnections",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MonthlyBills_UtilityConnections_UtilityConnectionId",
                table: "MonthlyBills");

            migrationBuilder.DropIndex(
                name: "IX_MonthlyBills_UtilityConnectionId",
                table: "MonthlyBills");

            migrationBuilder.DropColumn(
                name: "ConsumerNumber",
                table: "UtilityConnections");

            migrationBuilder.DropColumn(
                name: "ProviderName",
                table: "UtilityConnections");

            migrationBuilder.DropColumn(
                name: "ReferenceNumber",
                table: "UtilityConnections");

            migrationBuilder.DropColumn(
                name: "BillImagePath",
                table: "MonthlyBills");

            migrationBuilder.DropColumn(
                name: "DueDate",
                table: "MonthlyBills");

            migrationBuilder.DropColumn(
                name: "ScrapedAt",
                table: "MonthlyBills");

            migrationBuilder.DropColumn(
                name: "UnitsConsumed",
                table: "MonthlyBills");

            migrationBuilder.DropColumn(
                name: "UtilityConnectionId",
                table: "MonthlyBills");
        }
    }
}
