namespace CustomerLedger.Application.Features.Auth.DTOs;

public record LoginDto(string Email, string Password);

public record AuthResultDto(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User
);

public record UserDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string FullName,
    string Role,
    Guid CompanyId
);

public record ForgotPasswordDto(string Email);

public record ResetPasswordDto(string Token, string NewPassword, string ConfirmPassword);

public record RefreshTokenDto(string RefreshToken);

public record InviteUserDto(string Email, string FirstName, string LastName);

public record AcceptInvitationDto(string Token, string Password, string ConfirmPassword);
