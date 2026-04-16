namespace CustomerLedger.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    string? FullName { get; }
    Guid? CompanyId { get; }
    string? Role { get; }
    bool IsAuthenticated { get; }
}
