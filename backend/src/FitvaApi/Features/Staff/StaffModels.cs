using FitvaApi.Auth;
using FitvaApi.Features.Common;
using FluentValidation;

namespace FitvaApi.Features.Staff;

/// <summary>A staff login of the gym (usp_user_get_list). Never includes the password hash.</summary>
public sealed class StaffRow
{
    public Guid Id { get; init; }
    public string Name { get; init; } = "";
    public string Email { get; init; } = "";
    public string? Phone { get; init; }
    /// <summary>owner | trainer | front_desk</summary>
    public string Role { get; init; } = "";
    public bool IsActive { get; init; }
    public DateTime? LastLoginAt { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed record CreateStaffRequest(string Name, string Email, string? Phone, string Role, string Password);

public sealed record UpdateStaffRequest(string Name, string Email, string? Phone, string Role);

public sealed record SetPasswordRequest(string Password);

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public static class StaffRules
{
    // Same limits as lib/schemas/auth.ts (PASSWORD_MIN / PASSWORD_MAX) and lib/auth.ts.
    public const int PasswordMin = 8;
    public const int PasswordMax = 128;

    public static IRuleBuilderOptions<T, string> NewPassword<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().Length(PasswordMin, PasswordMax)
            .WithMessage($"Password must be {PasswordMin}–{PasswordMax} characters.");

    public static IRuleBuilderOptions<T, string> StaffRole<T>(this IRuleBuilder<T, string> rule) =>
        rule.Must(r => r is Roles.Owner or Roles.Trainer or Roles.FrontDesk)
            .WithMessage("Role must be owner, trainer or front_desk.");

    /// <summary>bcrypt with the $2a$ prefix, so pgcrypto's crypt() (usp_user_verify_password) can verify it too.</summary>
    public static string Hash(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(10, 'a'));
}

public sealed class CreateStaffRequestValidator : AbstractValidator<CreateStaffRequest>
{
    public CreateStaffRequestValidator()
    {
        RuleFor(x => x.Name).Must(n => n?.Trim().Length is >= 2 and <= 80).WithMessage("Name must be 2–80 characters.");
        RuleFor(x => x.Email).NotEmpty().OptionalEmail();
        RuleFor(x => x.Phone).Must(p => string.IsNullOrWhiteSpace(p) || System.Text.RegularExpressions.Regex.IsMatch(p.Trim(), Rules.PhonePattern))
            .WithMessage("Enter a valid 10-digit mobile number.");
        RuleFor(x => x.Role).StaffRole();
        RuleFor(x => x.Password).NewPassword();
    }
}

public sealed class UpdateStaffRequestValidator : AbstractValidator<UpdateStaffRequest>
{
    public UpdateStaffRequestValidator()
    {
        RuleFor(x => x.Name).Must(n => n?.Trim().Length is >= 2 and <= 80).WithMessage("Name must be 2–80 characters.");
        RuleFor(x => x.Email).NotEmpty().OptionalEmail();
        RuleFor(x => x.Phone).Must(p => string.IsNullOrWhiteSpace(p) || System.Text.RegularExpressions.Regex.IsMatch(p.Trim(), Rules.PhonePattern))
            .WithMessage("Enter a valid 10-digit mobile number.");
        RuleFor(x => x.Role).StaffRole();
    }
}

public sealed class SetPasswordRequestValidator : AbstractValidator<SetPasswordRequest>
{
    public SetPasswordRequestValidator() => RuleFor(x => x.Password).NewPassword();
}

public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty().MaximumLength(StaffRules.PasswordMax);
        RuleFor(x => x.NewPassword).NewPassword();
    }
}
