using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Common.Models;
using CustomerLedger.Application.Features.Auth.DTOs;
using MediatR;

namespace CustomerLedger.Application.Features.Auth.Commands.Login;

public record LoginCommand(string Email, string Password) : IRequest<ApiResponse<AuthResultDto>>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, ApiResponse<AuthResultDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtService _jwtService;

    public LoginCommandHandler(IUnitOfWork unitOfWork, IJwtService jwtService)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
    }

    public async Task<ApiResponse<AuthResultDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.FirstOrDefaultAsync(
            u => u.Email.ToLower() == request.Email.ToLower() && !u.IsDeleted,
            cancellationToken);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return ApiResponse<AuthResultDto>.Failure("Invalid email or password.", 401);

        if (!user.IsActive)
            return ApiResponse<AuthResultDto>.Failure("Your account has been deactivated. Please contact admin.", 403);

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshTokenValue = _jwtService.GenerateRefreshToken();
        var expiresAt = DateTime.UtcNow.AddMinutes(60);

        var refreshToken = new Domain.Entities.RefreshToken
        {
            Token = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            UserId = user.Id
        };

        await _unitOfWork.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = new AuthResultDto(
            accessToken,
            refreshTokenValue,
            expiresAt,
            new UserDto(user.Id, user.FirstName, user.LastName, user.Email, user.FullName, user.Role.ToString(), user.CompanyId)
        );

        return ApiResponse<AuthResultDto>.Success(result, "Login successful.");
    }
}
