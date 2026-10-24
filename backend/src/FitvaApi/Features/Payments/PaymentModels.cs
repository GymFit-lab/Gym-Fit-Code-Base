using System.Text.Json.Serialization;
using FitvaApi.Features.Common;
using FluentValidation;

namespace FitvaApi.Features.Payments;

/// <summary>A payment with the client's name (usp_payment_get_paged).</summary>
public sealed class PaymentRow : IHasTotalCount
{
    public Guid Id { get; init; }
    public Guid ClientId { get; init; }
    public string ClientName { get; init; } = "";
    public Guid? MembershipId { get; init; }
    /// <summary>Whole rupees.</summary>
    public int Amount { get; init; }
    /// <summary>cash | upi | card | bank</summary>
    public string Method { get; init; } = "";
    /// <summary>paid | pending</summary>
    public string Status { get; init; } = "";
    [JsonPropertyName("date")]
    public DateOnly PaymentDate { get; init; }
    public string Note { get; init; } = "";
    /// <summary>Days since the due date for pending payments, else 0.</summary>
    public int DaysOverdue { get; init; }

    [JsonIgnore]
    public long TotalCount { get; init; }
}

public sealed class PaymentTotals
{
    public long PaidThisMonth { get; init; }
    public long PendingTotal { get; init; }
    public long PendingCount { get; init; }
}

public sealed record PaymentListMeta(int Page, int PageSize, long Total, PaymentTotals Totals);

public sealed record PaymentList(IReadOnlyList<PaymentRow> Items, PaymentListMeta Meta);

public sealed class ExportRow
{
    public DateOnly PaymentDate { get; init; }
    public string ClientName { get; init; } = "";
    public string Method { get; init; } = "";
    public string Status { get; init; } = "";
    public int Amount { get; init; }
    public string? Note { get; init; }
}

public sealed class PaymentQuery : PageQuery
{
    /// <summary>all | paid | pending</summary>
    public string? Status { get; init; }

    /// <summary>all | cash | upi | card | bank</summary>
    public string? Method { get; init; }
}

public sealed record SavePaymentRequest(
    Guid ClientId,
    int Amount,
    string Method,
    string Status,
    /// <summary>Null = today (gym-local).</summary>
    DateOnly? Date,
    string? Note);

public static class PaymentRules
{
    public static IRuleBuilderOptions<T, string> PaymentStatus<T>(this IRuleBuilder<T, string> rule) =>
        rule.Must(s => s is "paid" or "pending").WithMessage("Status must be paid or pending.");

    public static IRuleBuilderOptions<T, string> PaymentMethod<T>(this IRuleBuilder<T, string> rule) =>
        rule.Must(m => m is "cash" or "upi" or "card" or "bank").WithMessage("Method must be cash, upi, card or bank.");
}

public sealed class PaymentQueryValidator : AbstractValidator<PaymentQuery>
{
    public PaymentQueryValidator()
    {
        Include(new PageQueryValidator());
        RuleFor(x => x.Status).Must(s => string.IsNullOrEmpty(s) || s is "all" or "paid" or "pending")
            .WithMessage("Status must be one of: all, paid, pending.");
        RuleFor(x => x.Method).Must(m => string.IsNullOrEmpty(m) || m is "all" or "cash" or "upi" or "card" or "bank")
            .WithMessage("Method must be one of: all, cash, upi, card, bank.");
    }
}

// Rules match paymentSchema in lib/schemas/gym.ts.
public sealed class SavePaymentRequestValidator : AbstractValidator<SavePaymentRequest>
{
    public SavePaymentRequestValidator()
    {
        RuleFor(x => x.ClientId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThanOrEqualTo(1);
        RuleFor(x => x.Method).PaymentMethod();
        RuleFor(x => x.Status).PaymentStatus();
        RuleFor(x => x.Note).Must(n => n is null || n.Trim().Length <= 120).WithMessage("Note must be at most 120 characters.");
    }
}
