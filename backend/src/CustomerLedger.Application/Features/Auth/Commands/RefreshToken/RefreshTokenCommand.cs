using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Common.Models;
using CustomerLedger.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CustomerLedger.Application.Features.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(string Token) : IRequest<ApiResponse<AuthResultDto>>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, ApiResponse<AuthResultDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtService _jwtService;

    public RefreshTokenCommandHandler(IUnitOfWork unitOfWork, IJwtService jwtService)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
    }

    public async Task<ApiResponse<AuthResultDto>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var refreshToken = await _unitOfWork.RefreshTokens
            .Query()
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == request.Token, cancellationToken);

        if (refreshToken == null || !refreshToken.IsActive)
            return ApiResponse<AuthResultDto>.Failure("Invalid or expired refresh token.", 401);

        var user = refreshToken.User;
        if (!user.IsActive || user.IsDeleted)
            return ApiResponse<AuthResultDto>.Failure("User account is inactive.", 403);

        // Revoke old token
        refreshToken.IsRevoked = true;
        refreshToken.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.RefreshTokens.Update(refreshToken);

        // Issue new tokens
        var newAccessToken = _jwtService.GenerateAccessToken(user);
        var newRefreshTokenValue = _jwtService.GenerateRefreshToken();
        refreshToken.ReplacedByToken = newRefreshTokenValue;

        var newRefreshToken = new Domain.Entities.RefreshToken
        {
            Token = newRefreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            UserId = user.Id
        };

        await _unitOfWork.RefreshTokens.AddAsync(newRefreshToken, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = new AuthResultDto(
            newAccessToken,
            newRefreshTokenValue,
            DateTime.UtcNow.AddMinutes(60),
            new UserDto(user.Id, user.FirstName, user.LastName, user.Email, user.FullName, user.Role.ToString(), user.CompanyId)
        );

        return ApiResponse<AuthResultDto>.Success(result, "Token refreshed successfully.");
    }
}
