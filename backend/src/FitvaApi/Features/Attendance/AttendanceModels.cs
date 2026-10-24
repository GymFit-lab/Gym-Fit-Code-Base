using System.Text.Json.Serialization;
using FitvaApi.Features.Common;
using FluentValidation;

namespace FitvaApi.Features.Attendance;

/// <summary>A check-in with the client's current status/plan/trainer (usp_attendance_get_paged).</summary>
public sealed class AttendanceRow : IHasTotalCount
{
    public Guid Id { get; init; }
    public DateTime CheckedInAt { get; init; }
    public Guid ClientId { get; init; }
    public string ClientName { get; init; } = "";
    public string ClientStatus { get; init; } = "";
    public string? PlanName { get; init; }
    public string? TrainerName { get; init; }

    [JsonIgnore]
    public long TotalCount { get; init; }
}

public sealed class AttendanceQuery : PageQuery
{
    /// <summary>Gym-local date (YYYY-MM-DD); null = today.</summary>
    public DateOnly? Date { get; init; }
}

/// <summary>A bare check-in (usp_attendance_get_list).</summary>
public sealed class AttendanceListRow
{
    public Guid Id { get; init; }
    public Guid ClientId { get; init; }
    public DateTime CheckedInAt { get; init; }
}

public sealed class DailyCountRow
{
    public DateOnly CheckInDate { get; init; }
    public long CheckInCount { get; init; }
}

public sealed class PeakHourRow
{
    public int PeakHour { get; init; }
    public long CheckInCount { get; init; }
}

public sealed record DayCount(DateOnly Date, long Count);

public sealed record AttendanceSummary(IReadOnlyList<DayCount> PerDay, int? PeakHourToday);

public sealed record CheckInRequest(Guid ClientId);

public sealed class AttendanceQueryValidator : AbstractValidator<AttendanceQuery>
{
    public AttendanceQueryValidator() => Include(new PageQueryValidator());
}

public sealed class CheckInRequestValidator : AbstractValidator<CheckInRequest>
{
    public CheckInRequestValidator() => RuleFor(x => x.ClientId).NotEmpty();
}
