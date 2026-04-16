using CustomerLedger.Domain.Enums;

namespace CustomerLedger.Domain.Entities;

public class User : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.User;
    public bool IsActive { get; set; } = true;

    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<LedgerEntry> LedgerEntries { get; set; } = new List<LedgerEntry>();

    public string FullName => $"{FirstName} {LastName}";
}
