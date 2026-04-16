using BCrypt.Net;
using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Common.Models;
using CustomerLedger.Application.Features.Auth.DTOs;
using CustomerLedger.Domain.Entities;
using CustomerLedger.Domain.Enums;
using MediatR;

namespace CustomerLedger.Application.Features.Auth.Commands.AcceptInvitation;

public record AcceptInvitationCommand(string Token, string Password, string ConfirmPassword) : IRequest<ApiResponse<AuthResultDto>>;

public class AcceptInvitationCommandHandler : IRequestHandler<AcceptInvitationCommand, ApiResponse<AuthResultDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;

    public AcceptInvitationCommandHandler(IUnitOfWork unitOfWork, IJwtService jwtService, IEmailService emailService)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
        _emailService = emailService;
    }

    public async Task<ApiResponse<AuthResultDto>> Handle(AcceptInvitationCommand request, CancellationToken cancellationToken)
    {
        var invitation = await _unitOfWork.InvitationTokens.FirstOrDefaultAsync(
            t => t.Token == request.Token && !t.IsDeleted,
            cancellationToken);

        if (invitation == null || !invitation.IsValid)
            return ApiResponse<AuthResultDto>.Failure("Invalid or expired invitation token.", 400);

        var newUser = new User
        {
            FirstName = invitation.FirstName,
            LastName = invitation.LastName,
            Email = invitation.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.User,
            IsActive = true,
            CompanyId = invitation.CompanyId
        };

        await _unitOfWork.Users.AddAsync(newUser, cancellationToken);

        invitation.IsUsed = true;
        invitation.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.InvitationTokens.Update(invitation);

        var accessToken = _jwtService.GenerateAccessToken(newUser);
        var refreshTokenValue = _jwtService.GenerateRefreshToken();

        var refreshToken = new CustomerLedger.Domain.Entities.RefreshToken
        {
            Token = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            UserId = newUser.Id
        };

        await _unitOfWork.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _emailService.SendWelcomeEmailAsync(newUser.Email, newUser.FullName, cancellationToken);

        var result = new AuthResultDto(
            accessToken,
            refreshTokenValue,
            DateTime.UtcNow.AddMinutes(60),
            new UserDto(newUser.Id, newUser.FirstName, newUser.LastName, newUser.Email, newUser.FullName, newUser.Role.ToString(), newUser.CompanyId)
        );

        return ApiResponse<AuthResultDto>.Success(result, "Account created successfully. Welcome!");
    }
}
