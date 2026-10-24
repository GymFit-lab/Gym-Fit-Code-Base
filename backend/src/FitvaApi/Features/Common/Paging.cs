using FluentValidation;

namespace FitvaApi.Features.Common;

/// <summary>Query string shared by the paged lists: <c>?page=1&amp;pageSize=20&amp;search=…</c>.</summary>
public class PageQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public string? Search { get; init; }
}

public sealed record PageMeta(int Page, int PageSize, long Total);

public sealed record PagedResult<T>(IReadOnlyList<T> Items, PageMeta Meta);

/// <summary>Rows from usp_*_get_paged carry the full match count on every row.</summary>
public interface IHasTotalCount
{
    long TotalCount { get; }
}

public static class Paging
{
    public static PageMeta Meta<T>(PageQuery q, IReadOnlyList<T> rows) where T : IHasTotalCount =>
        new(q.Page, q.PageSize, rows.Count > 0 ? rows[0].TotalCount : 0);
}

/// <summary>Validation rules for <see cref="PageQuery"/>; derived queries include these with Include().</summary>
public sealed class PageQueryValidator : AbstractValidator<PageQuery>
{
    public PageQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 200);
        RuleFor(x => x.Search).MaximumLength(100);
    }
}

public static partial class Rules
{
    public const string PhonePattern = "^[6-9][0-9]{9}$";

    /// <summary>Indian mobile number, as lib/schemas/gym.ts.</summary>
    public static IRuleBuilderOptions<T, string> IndianPhone<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().Matches(PhonePattern).WithMessage("Enter a valid 10-digit mobile number.");

    /// <summary>Empty / null (no email) or a valid email of at most 160 characters.</summary>
    public static IRuleBuilderOptions<T, string?> OptionalEmail<T>(this IRuleBuilder<T, string?> rule) =>
        rule.Must(v => string.IsNullOrWhiteSpace(v) || (v.Trim().Length <= 160 && EmailPattern().IsMatch(v.Trim())))
            .WithMessage("Enter a valid email address.");

    [System.Text.RegularExpressions.GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    private static partial System.Text.RegularExpressions.Regex EmailPattern();
}
