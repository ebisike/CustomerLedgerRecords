using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Features.Ledger.Commands.AddLedgerEntry;
using CustomerLedger.Application.Features.Ledger.DTOs;
using CustomerLedger.Application.Features.Ledger.Queries.ExportLedger;
using CustomerLedger.Application.Features.Ledger.Queries.GetLedgerEntries;
using CustomerLedger.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Org.BouncyCastle.Asn1.Ocsp;
using System.IO;

namespace CustomerLedger.API.Controllers;

[Authorize]
public class LedgerController : BaseController
{
    /// <summary>Get ledger entries for a customer</summary>
    [HttpGet("customers/{customerId:guid}/entries")]
    public async Task<IActionResult> GetLedgerEntries(
        Guid customerId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? invoiceReceiptNumber = null,
        [FromQuery] Guid? updatedById = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false,
        CancellationToken ct = default)
        => HandleResponse(await Mediator.Send(
            new GetLedgerEntriesQuery(customerId, pageIndex, pageSize, startDate, endDate, invoiceReceiptNumber, updatedById, sortBy, sortDescending), ct));

    /// <summary>Add a new ledger entry for a customer</summary>
    [HttpPost("customers/{customerId:guid}/entries")]
    public async Task<IActionResult> AddLedgerEntry(
        Guid customerId,
        [FromBody] AddLedgerEntryDto dto,
        CancellationToken ct)
        => HandleResponse(await Mediator.Send(
            new AddLedgerEntryCommand(customerId, dto.Date, dto.Description, dto.InvoiceReceiptNumber, dto.PageNo, dto.Debit, dto.Credit), ct));

    /// <summary>Export ledger to PDF or Excel</summary>
    [HttpGet("customers/{customerId:guid}/export")]
    public async Task<IActionResult> ExportLedger(
        Guid customerId,
        [FromQuery] string format = "pdf",
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? invoiceReceiptNumber = null,
        [FromQuery] Guid? updatedById = null,
        CancellationToken ct = default)
    {
        var response = await Mediator.Send(
            new ExportLedgerQuery(customerId, format, startDate, endDate, invoiceReceiptNumber, updatedById), ct);

        if (!response.Status)
            return HandleResponse(response);

        var result = response.Results!;
        return File(result.FileBytes, result.ContentType, result.FileName);
    }


    [ApiExplorerSettings(IgnoreApi = true)]
    [AllowAnonymous]
    [HttpGet("test")]
    public async Task<IActionResult> Test([FromServices]IUnitOfWork unitOfWork, [FromServices]IWebHostEnvironment environment, CancellationToken ct)
    {
        try
        {
            throw new NotImplementedException("Do not run this endpoint in production. It is for testing purposes only.");

            var filePath = Path.Combine(
            environment.WebRootPath,
            "data",
            "customers_balances.json");

            //var json = File.ReadAllText(filePath);
            string json = System.IO.File.ReadAllText(filePath);

            var customers = JsonConvert.DeserializeObject<List<CustomerBalance>>(json);

            var newCustomers = new List<Customer>();
            var newLedgerEntries = new List<LedgerEntry>();

            var comapnyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");

            int i = 0;
            foreach (var item in customers)
            {
                if (i == 0 || item.Balance.Equals("AMOUNT", StringComparison.OrdinalIgnoreCase))
                {
                    i++;
                    continue;
                }

                i++;

                var customer = new Customer
                {
                    Id = Guid.NewGuid(),
                    Name = item.Customer,
                    CompanyId = comapnyId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false,
                    Address = "N/A",
                    Phone = "N/A",
                    Email = "N/A"
                };
                newCustomers.Add(customer);

                var previousBalance = 0;
                var debit = decimal.Parse(item.Balance);
                var newBalance = previousBalance + debit - 0;

                var ledgerEntry = new LedgerEntry
                {
                    Id = Guid.NewGuid(),
                    CustomerId = customer.Id,
                    Date = DateTime.UtcNow,
                    Description = "Initial Balance",
                    InvoiceReceiptNumber = "N/A",
                    Debit = debit,
                    Credit = 0,
                    Balance = newBalance,
                    UpdatedById = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };
                newLedgerEntries.Add(ledgerEntry);
            }

            await unitOfWork.Customers.AddRangeAsync(newCustomers, ct);
            await unitOfWork.LedgerEntries.AddRangeAsync(newLedgerEntries, ct);

            await unitOfWork.SaveChangesAsync(ct);

            return Ok("Test endpoint is working.");
        }
        catch (Exception e)
        {

            throw;
        }
    }
}


public class CustomerBalance
{
    public string Customer { get; set; }
    public string Balance { get; set; }
}