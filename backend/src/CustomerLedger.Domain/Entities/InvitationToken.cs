namespace CustomerLedger.Domain.Entities;

public class InvitationToken : BaseEntity
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; } = false;

    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public Guid InvitedByUserId { get; set; }
    public User InvitedBy { get; set; } = null!;

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsValid => !IsUsed && !IsExpired;
}
