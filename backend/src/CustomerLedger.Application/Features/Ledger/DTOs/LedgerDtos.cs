namespace CustomerLedger.Application.Features.Ledger.DTOs;

public record LedgerEntryDto(
    Guid Id,
    DateTime Date,
    string Description,
    string InvoiceReceiptNumber,
    string? PageNo,
    string UpdatedByName,
    Guid UpdatedById,
    decimal Debit,
    decimal Credit,
    decimal Balance,
    DateTime CreatedAt
);

public record AddLedgerEntryDto(
    DateTime Date,
    string Description,
    string InvoiceReceiptNumber,
    string? PageNo,
    decimal Debit,
    decimal Credit
);

public record LedgerFilterDto(
    int PageIndex = 1,
    int PageSize = 20,
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    string? InvoiceReceiptNumber = null,
    Guid? UpdatedById = null,
    string? SortBy = null,
    bool SortDescending = false
);

public record LedgerExportDto(
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    string CustomerAddress,
    List<LedgerEntryDto> Entries,
    DateTime? StartDate,
    DateTime? EndDate,
    decimal OpeningBalance,
    decimal ClosingBalance,
    decimal TotalDebits,
    decimal TotalCredits
);
