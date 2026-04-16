using CustomerLedger.Domain.Entities;

namespace CustomerLedger.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    Guid? GetUserIdFromToken(string token);
    bool ValidateToken(string token);
}
