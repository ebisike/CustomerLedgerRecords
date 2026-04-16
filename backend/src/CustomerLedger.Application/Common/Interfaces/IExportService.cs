using CustomerLedger.Application.Features.Ledger.DTOs;

namespace CustomerLedger.Application.Common.Interfaces;

public interface IExportService
{
    Task<byte[]> ExportLedgerToPdfAsync(LedgerExportDto data, CancellationToken cancellationToken = default);
    Task<byte[]> ExportLedgerToExcelAsync(LedgerExportDto data, CancellationToken cancellationToken = default);
}
