using System.Security.Claims;
using CustomerLedger.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace CustomerLedger.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var claim = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return claim != null && Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    public string? Email => User?.FindFirstValue(ClaimTypes.Email);
    public string? FullName => User?.FindFirstValue(ClaimTypes.Name);

    public Guid? CompanyId
    {
        get
        {
            var claim = User?.FindFirstValue("CompanyId");
            return claim != null && Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    public string? Role => User?.FindFirstValue(ClaimTypes.Role);
    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;
}
