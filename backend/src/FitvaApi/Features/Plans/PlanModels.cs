using FluentValidation;

namespace FitvaApi.Features.Plans;

/// <summary>Membership plan + memberships running today (usp_plan_get_list).</summary>
public sealed class PlanRow
{
    public Guid Id { get; init; }
    public string Name { get; init; } = "";
    public int DurationMonths { get; init; }
    /// <summary>Whole rupees.</summary>
    public int Price { get; init; }
    public long ActiveCount { get; init; }
}

public sealed record SavePlanRequest(string Name, int DurationMonths, int Price);

// Limits match planSchema in lib/schemas/gym.ts.
public sealed class SavePlanRequestValidator : AbstractValidator<SavePlanRequest>
{
    public SavePlanRequestValidator()
    {
        RuleFor(x => x.Name).Must(n => n?.Trim().Length is >= 2 and <= 40).WithMessage("Plan name must be 2–40 characters.");
        RuleFor(x => x.DurationMonths).InclusiveBetween(1, 36);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(1);
    }
}
