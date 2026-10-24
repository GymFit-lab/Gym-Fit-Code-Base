using FluentValidation;

namespace FitvaApi.Auth;

public sealed record LoginRequest(string Email, string Password);

public sealed record RefreshRequest(string RefreshToken);

public sealed record AuthUser(Guid Id, string Name, string Email, string Role, Guid GymId);

public sealed record AuthResponse(string AccessToken, string RefreshToken, int ExpiresIn, AuthUser User);

// Rows returned by the usp_user_* / usp_refresh_token_* functions (snake_case → PascalCase).
public sealed class UserRow
{
    public Guid Id { get; init; }
    public Guid GymId { get; init; }
    public string Name { get; init; } = "";
    public string Email { get; init; } = "";
    public string Role { get; init; } = "";
    public string? PasswordHash { get; init; }
    public bool IsActive { get; init; }

    public AuthUser ToAuthUser() => new(Id, Name, Email, Role, GymId);
}

public sealed class RefreshTokenRow
{
    public Guid Id { get; init; }
    public Guid GymId { get; init; }
    public Guid UserId { get; init; }
    public DateTime ExpiresAt { get; init; }
    public DateTime? RevokedAt { get; init; }
}

// Limits match lib/schemas/auth.ts (email ≤ 160, password ≤ 128).
public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(160);
        RuleFor(x => x.Password).NotEmpty().MaximumLength(128);
    }
}

public sealed class RefreshRequestValidator : AbstractValidator<RefreshRequest>
{
    public RefreshRequestValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty().MaximumLength(200);
    }
}
