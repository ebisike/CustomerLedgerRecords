using CustomerLedger.Application.Features.Ledger.Commands.AddLedgerEntry;
using CustomerLedger.Application.Features.Ledger.DTOs;
using CustomerLedger.Application.Features.Ledger.Queries.ExportLedger;
using CustomerLedger.Application.Features.Ledger.Queries.GetLedgerEntries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
}
