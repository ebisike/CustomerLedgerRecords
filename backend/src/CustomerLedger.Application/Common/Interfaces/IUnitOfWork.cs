using CustomerLedger.Domain.Entities;

namespace CustomerLedger.Application.Common.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<Company> Companies { get; }
    IRepository<User> Users { get; }
    IRepository<Customer> Customers { get; }
    IRepository<LedgerEntry> LedgerEntries { get; }
    IRepository<RefreshToken> RefreshTokens { get; }
    IRepository<InvitationToken> InvitationTokens { get; }
    IRepository<PasswordResetToken> PasswordResetTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
