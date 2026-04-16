using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Domain.Entities;
using CustomerLedger.Infrastructure.Data;
using CustomerLedger.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore.Storage;

namespace CustomerLedger.Infrastructure.UnitOfWork;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IDbContextTransaction? _transaction;

    private IRepository<Company>? _companies;
    private IRepository<User>? _users;
    private IRepository<Customer>? _customers;
    private IRepository<LedgerEntry>? _ledgerEntries;
    private IRepository<RefreshToken>? _refreshTokens;
    private IRepository<InvitationToken>? _invitationTokens;
    private IRepository<PasswordResetToken>? _passwordResetTokens;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public IRepository<Company> Companies => _companies ??= new BaseRepository<Company>(_context);
    public IRepository<User> Users => _users ??= new BaseRepository<User>(_context);
    public IRepository<Customer> Customers => _customers ??= new BaseRepository<Customer>(_context);
    public IRepository<LedgerEntry> LedgerEntries => _ledgerEntries ??= new BaseRepository<LedgerEntry>(_context);
    public IRepository<RefreshToken> RefreshTokens => _refreshTokens ??= new BaseRepository<RefreshToken>(_context);
    public IRepository<InvitationToken> InvitationTokens => _invitationTokens ??= new BaseRepository<InvitationToken>(_context);
    public IRepository<PasswordResetToken> PasswordResetTokens => _passwordResetTokens ??= new BaseRepository<PasswordResetToken>(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => await _context.SaveChangesAsync(cancellationToken);

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
        => _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
