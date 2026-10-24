using System.Text.Json.Serialization;
using FitvaApi.Features.Common;
using FluentValidation;

namespace FitvaApi.Features.Clients;

/// <summary>Client + current membership + plan + trainer + derived status (usp_client_get_paged / _by_id).</summary>
public sealed class ClientRow : IHasTotalCount
{
    public Guid Id { get; init; }
    public string Name { get; init; } = "";
    public string Phone { get; init; } = "";
    public string? Email { get; init; }
    public string Gender { get; init; } = "";
    public DateOnly JoinedOn { get; init; }
    public Guid? TrainerId { get; init; }
    public string? TrainerName { get; init; }
    public Guid? MembershipId { get; init; }
    public Guid? PlanId { get; init; }
    public string? PlanName { get; init; }
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public int? Amount { get; init; }
    /// <summary>none | active | due | expired</summary>
    public string Status { get; init; } = "";

    [JsonIgnore]
    public long TotalCount { get; init; }
}

public sealed class ClientCounts
{
    [JsonPropertyName("total")]
    public long TotalCount { get; init; }
    [JsonPropertyName("active")]
    public long ActiveCount { get; init; }
    [JsonPropertyName("due")]
    public long DueCount { get; init; }
    [JsonPropertyName("expired")]
    public long ExpiredCount { get; init; }
    [JsonPropertyName("none")]
    public long NoneCount { get; init; }
}

public sealed record ClientListMeta(int Page, int PageSize, long Total, ClientCounts Counts);

public sealed record ClientList(IReadOnlyList<ClientRow> Items, ClientListMeta Meta);

public sealed class ClientQuery : PageQuery
{
    /// <summary>all | active | due | expired | none</summary>
    public string? Status { get; init; }

    /// <summary>all | none | trainer id</summary>
    public string? TrainerId { get; init; }
}

public sealed record SaveClientRequest(string Name, string Phone, string? Email, string Gender, Guid? TrainerId);

public sealed class ClientQueryValidator : AbstractValidator<ClientQuery>
{
    static readonly string[] Statuses = ["all", "active", "due", "expired", "none"];

    public ClientQueryValidator()
    {
        Include(new PageQueryValidator());
        RuleFor(x => x.Status).Must(s => string.IsNullOrEmpty(s) || Statuses.Contains(s))
            .WithMessage("Status must be one of: " + string.Join(", ", Statuses) + ".");
        RuleFor(x => x.TrainerId).Must(t => string.IsNullOrEmpty(t) || t is "all" or "none" || Guid.TryParse(t, out _))
            .WithMessage("TrainerId must be 'all', 'none' or a trainer id.");
    }
}

// Limits match clientSchema in lib/schemas/gym.ts.
public sealed class SaveClientRequestValidator : AbstractValidator<SaveClientRequest>
{
    public SaveClientRequestValidator()
    {
        RuleFor(x => x.Name).Must(n => n?.Trim().Length is >= 2 and <= 80).WithMessage("Name must be 2–80 characters.");
        RuleFor(x => x.Phone).IndianPhone();
        RuleFor(x => x.Email).OptionalEmail();
        RuleFor(x => x.Gender).Must(g => g is "male" or "female" or "other").WithMessage("Gender must be male, female or other.");
    }
}
