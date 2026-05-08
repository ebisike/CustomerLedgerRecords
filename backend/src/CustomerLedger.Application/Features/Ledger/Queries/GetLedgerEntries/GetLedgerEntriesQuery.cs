using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Common.Models;
using CustomerLedger.Application.Features.Ledger.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CustomerLedger.Application.Features.Ledger.Queries.GetLedgerEntries;

public record GetLedgerEntriesQuery(
    Guid CustomerId,
    int PageIndex,
    int PageSize,
    DateTime? StartDate,
    DateTime? EndDate,
    string? InvoiceReceiptNumber,
    Guid? UpdatedById,
    string? SortBy,
    bool SortDescending
) : IRequest<ApiResponse<List<LedgerEntryDto>>>;

public class GetLedgerEntriesQueryHandler : IRequestHandler<GetLedgerEntriesQuery, ApiResponse<List<LedgerEntryDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public GetLedgerEntriesQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<List<LedgerEntryDto>>> Handle(GetLedgerEntriesQuery request, CancellationToken cancellationToken)
    {
        var companyId = _currentUserService.CompanyId
            ?? throw new UnauthorizedAccessException("Company context not found.");

        var customerExists = await _unitOfWork.Customers.FirstOrDefaultAsync(
            c => c.Id == request.CustomerId && c.CompanyId == companyId && !c.IsDeleted,
            cancellationToken);

        if (customerExists == null)
            return ApiResponse<List<LedgerEntryDto>>.Failure("Customer not found.", 404);

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

        query = request.SortBy?.ToLower() switch
        {
            "date" => request.SortDescending ? query.OrderByDescending(e => e.Date) : query.OrderBy(e => e.Date),
            "debit" => request.SortDescending ? query.OrderByDescending(e => e.Debit) : query.OrderBy(e => e.Debit),
            "credit" => request.SortDescending ? query.OrderByDescending(e => e.Credit) : query.OrderBy(e => e.Credit),
            "balance" => request.SortDescending ? query.OrderByDescending(e => e.Balance) : query.OrderBy(e => e.Balance),
            _ => query.OrderBy(e => e.Date).ThenBy(e => e.CreatedAt)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var pageIndex = Math.Max(1, request.PageIndex);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var entries = await query
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = entries.Select(e => new LedgerEntryDto(
            e.Id, e.Date, e.Description, e.InvoiceReceiptNumber,
            e.PageNo,
            e.UpdatedBy?.FullName ?? "Unknown",
            e.UpdatedById, e.Debit, e.Credit, e.Balance, e.CreatedAt
        )).ToList();

        var metaData = MetaData.Create(pageIndex, pageSize, totalCount);
        return ApiResponse<List<LedgerEntryDto>>.Success(dtos, string.Empty, 200, metaData);
    }
}
