using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Common.Models;
using CustomerLedger.Application.Features.Ledger.DTOs;
using CustomerLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CustomerLedger.Application.Features.Ledger.Commands.AddLedgerEntry;

public record AddLedgerEntryCommand(
    Guid CustomerId,
    DateTime Date,
    string Description,
    string InvoiceReceiptNumber,
    decimal Debit,
    decimal Credit
) : IRequest<ApiResponse<LedgerEntryDto>>;

public class AddLedgerEntryCommandHandler : IRequestHandler<AddLedgerEntryCommand, ApiResponse<LedgerEntryDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public AddLedgerEntryCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<LedgerEntryDto>> Handle(AddLedgerEntryCommand request, CancellationToken cancellationToken)
    {
        var companyId = _currentUserService.CompanyId
            ?? throw new UnauthorizedAccessException("Company context not found.");
        var userId = _currentUserService.UserId
            ?? throw new UnauthorizedAccessException("User not authenticated.");

        var customer = await _unitOfWork.Customers.FirstOrDefaultAsync(
            c => c.Id == request.CustomerId && c.CompanyId == companyId && !c.IsDeleted,
            cancellationToken);

        if (customer == null)
            return ApiResponse<LedgerEntryDto>.Failure("Customer not found.", 404);

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // Server-side running balance calculation
            var lastEntry = await _unitOfWork.LedgerEntries.Query()
                .Where(e => e.CustomerId == request.CustomerId && !e.IsDeleted)
                .OrderByDescending(e => e.Date)
                .ThenByDescending(e => e.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            var previousBalance = lastEntry?.Balance ?? 0;
            var newBalance = previousBalance + request.Debit - request.Credit;

            var entry = new LedgerEntry
            {
                Date = request.Date.ToUniversalTime(),
                Description = request.Description,
                InvoiceReceiptNumber = request.InvoiceReceiptNumber,
                Debit = request.Debit,
                Credit = request.Credit,
                Balance = newBalance,
                CustomerId = request.CustomerId,
                UpdatedById = userId
            };

            await _unitOfWork.LedgerEntries.AddAsync(entry, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);

            var dto = new LedgerEntryDto(
                entry.Id,
                entry.Date,
                entry.Description,
                entry.InvoiceReceiptNumber,
                user?.FullName ?? "Unknown",
                userId,
                entry.Debit,
                entry.Credit,
                entry.Balance,
                entry.CreatedAt
            );

            return ApiResponse<LedgerEntryDto>.Success(dto, "Ledger entry added successfully.", 201);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }
}
