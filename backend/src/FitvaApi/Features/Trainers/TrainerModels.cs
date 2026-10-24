using System.Text.Json.Serialization;
using FitvaApi.Features.Common;
using FluentValidation;

namespace FitvaApi.Features.Trainers;

/// <summary>Trainer + assigned clients + their check-ins in the last 7 days (usp_trainer_get_paged).</summary>
public sealed class TrainerRow : IHasTotalCount
{
    public Guid Id { get; init; }
    public string Name { get; init; } = "";
    public string Specialty { get; init; } = "";
    public string Phone { get; init; } = "";
    public string? Email { get; init; }
    public DateOnly JoinedOn { get; init; }
    public long ClientCount { get; init; }
    [JsonPropertyName("checkInsLast7Days")]
    public long CheckInsLast7Days { get; init; }

    [JsonIgnore]
    public long TotalCount { get; init; }
}

public sealed record SaveTrainerRequest(string Name, string Specialty, string Phone, string? Email);

// Limits match trainerSchema in lib/schemas/gym.ts.
public sealed class SaveTrainerRequestValidator : AbstractValidator<SaveTrainerRequest>
{
    public SaveTrainerRequestValidator()
    {
        RuleFor(x => x.Name).Must(n => n?.Trim().Length is >= 2 and <= 80).WithMessage("Name must be 2–80 characters.");
        RuleFor(x => x.Specialty).Must(s => s?.Trim().Length is >= 2 and <= 80).WithMessage("Specialty must be 2–80 characters.");
        RuleFor(x => x.Phone).IndianPhone();
        RuleFor(x => x.Email).OptionalEmail();
    }
}
