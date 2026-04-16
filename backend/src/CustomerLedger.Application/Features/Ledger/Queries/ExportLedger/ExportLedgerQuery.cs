using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Common.Models;
using CustomerLedger.Application.Features.Ledger.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CustomerLedger.Application.Features.Ledger.Queries.ExportLedger;

public record ExportLedgerQuery(
    Guid CustomerId,
    string Format, // "pdf" or "excel"
    DateTime? StartDate,
    DateTime? EndDate,
    string? InvoiceReceiptNumber,
    Guid? UpdatedById
) : IRequest<ApiResponse<ExportResultDto>>;

public record ExportResultDto(byte[] FileBytes, string FileName, string ContentType);

public class ExportLedgerQueryHandler : IRequestHandler<ExportLedgerQuery, ApiResponse<ExportResultDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IExportService _exportService;

    public ExportLedgerQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService, IExportService exportService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _exportService = exportService;
    }

    public async Task<ApiResponse<ExportResultDto>> Handle(ExportLedgerQuery request, CancellationToken cancellationToken)
    {
        var companyId = _currentUserService.CompanyId
            ?? throw new UnauthorizedAccessException("Company context not found.");

        var customer = await _unitOfWork.Customers.FirstOrDefaultAsync(
            c => c.Id == request.CustomerId && c.CompanyId == companyId && !c.IsDeleted,
            cancellationToken);

        if (customer == null)
            return ApiResponse<ExportResultDto>.Failure("Customer not found.", 404);

        var query = _unitOfWork.LedgerEntries.Query()
            .Include(e => e.UpdatedBy)
            .Where(e => e.CustomerId == request.CustomerId && !e.IsDeleted);

        if (request.StartDate.HasValue)
            query = query.Where(e => e.Date >= request.StartDate.Value.ToUniversalTime());

        if (request.EndDate.HasValue)
            query = query.Where(e => e.Date <= request.EndDate.Value.ToUniversalTime().AddDays(1).AddTicks(-1));

        if (!string.IsNullOrWhiteSpace(request.InvoiceReceiptNumber))
            query = query.Where(e => e.InvoiceReceiptNumber.Contains(request.InvoiceReceiptNumber));

        if (request.UpdatedById.HasValue)
            query = query.Where(e => e.UpdatedById == request.UpdatedById.Value);

        var entries = await query
            .OrderBy(e => e.Date).ThenBy(e => e.CreatedAt)
            .ToListAsync(cancellationToken);

        var entryDtos = entries.Select(e => new LedgerEntryDto(
            e.Id, e.Date, e.Description, e.InvoiceReceiptNumber,
            e.UpdatedBy?.FullName ?? "Unknown",
            e.UpdatedById, e.Debit, e.Credit, e.Balance, e.CreatedAt
        )).ToList();

        var exportData = new LedgerExportDto(
            customer.Name,
            customer.Phone,
            customer.Email,
            customer.Address,
            entryDtos,
            request.StartDate,
            request.EndDate,
            entryDtos.FirstOrDefault()?.Balance - (entryDtos.FirstOrDefault()?.Debit ?? 0) + (entryDtos.FirstOrDefault()?.Credit ?? 0) ?? 0,
            entryDtos.LastOrDefault()?.Balance ?? 0,
            entryDtos.Sum(e => e.Debit),
            entryDtos.Sum(e => e.Credit)
        );

        byte[] fileBytes;
        string fileName;
        string contentType;

        if (request.Format.ToLower() == "pdf")
        {
            fileBytes = await _exportService.ExportLedgerToPdfAsync(exportData, cancellationToken);
            fileName = $"ledger_{customer.Name.Replace(" ", "_")}_{DateTime.UtcNow:yyyyMMdd}.pdf";
            contentType = "application/pdf";
        }
        else
        {
            fileBytes = await _exportService.ExportLedgerToExcelAsync(exportData, cancellationToken);
            fileName = $"ledger_{customer.Name.Replace(" ", "_")}_{DateTime.UtcNow:yyyyMMdd}.xlsx";
            contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        }

        return ApiResponse<ExportResultDto>.Success(new ExportResultDto(fileBytes, fileName, contentType));
    }
}
