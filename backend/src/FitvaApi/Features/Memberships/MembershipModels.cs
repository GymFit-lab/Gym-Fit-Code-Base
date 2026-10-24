using System.Text.Json.Serialization;
using FitvaApi.Features.Common;
using FitvaApi.Features.Payments;
using FluentValidation;

namespace FitvaApi.Features.Memberships;

/// <summary>A membership with client/plan name and its own status (usp_membership_get_paged).</summary>
public sealed class MembershipRow : IHasTotalCount
{
    public Guid Id { get; init; }
    public Guid ClientId { get; init; }
    public string ClientName { get; init; } = "";
    public Guid PlanId { get; init; }
    public string PlanName { get; init; } = "";
    public DateOnly StartDate { get; init; }
    /// <summary>Inclusive.</summary>
    public DateOnly EndDate { get; init; }
    public int Amount { get; init; }
    /// <summary>active | due | expired</summary>
    public string Status { get; init; } = "";

    [JsonIgnore]
    public long TotalCount { get; init; }
}

public sealed class MembershipQuery : PageQuery
{
    /// <summary>all | active | due | expired</summary>
    public string? Status { get; init; }
    public Guid? PlanId { get; init; }
}

/// <summary>Sells a plan to a client; the payment is recorded in the same transaction.</summary>
public sealed record CreateMembershipRequest(
    Guid ClientId,
    Guid PlanId,
    /// <summary>Null = today (gym-local).</summary>
    DateOnly? StartDate,
    string PaymentStatus,
    string Method);

public sealed class MembershipCreatedRow
{
    public Guid MembershipId { get; init; }
    public Guid PaymentId { get; init; }
}

public sealed record MembershipCreated(MembershipRow? Membership, PaymentRow? Payment);

public sealed class MembershipQueryValidator : AbstractValidator<MembershipQuery>
{
    public MembershipQueryValidator()
    {
        Include(new PageQueryValidator());
        RuleFor(x => x.Status).Must(s => string.IsNullOrEmpty(s) || s is "all" or "active" or "due" or "expired")
            .WithMessage("Status must be one of: all, active, due, expired.");
    }
}

// Rules match membershipSchema in lib/schemas/gym.ts.
public sealed class CreateMembershipRequestValidator : AbstractValidator<CreateMembershipRequest>
{
    public CreateMembershipRequestValidator()
    {
        RuleFor(x => x.ClientId).NotEmpty();
        RuleFor(x => x.PlanId).NotEmpty();
        RuleFor(x => x.PaymentStatus).PaymentStatus();
        RuleFor(x => x.Method).PaymentMethod();
    }
}
