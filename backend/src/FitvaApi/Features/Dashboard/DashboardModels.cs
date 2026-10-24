namespace FitvaApi.Features.Dashboard;

// Response shapes. DashboardData mirrors lib/dashboard/types.ts exactly (the website's contract),
// so the site can switch to DASHBOARD_DATA_SOURCE=api without changes.

public sealed record GymHeader(string Name, string Branch);

public sealed record Kpi(string Id, long Value, long Previous, string Format);

public sealed record MonthAmount(string Month, long Amount);

public sealed record DayCount(DateOnly Date, long Count);

public sealed record PlanCount(string Plan, long Count);

public sealed record Renewal(Guid Id, string MemberName, string Plan, DateOnly DueDate, int Amount, string Status);

public sealed record CheckIn(Guid Id, string MemberName, DateTime CheckedInAt, string? TrainerName);

public sealed record TrainerLoad(Guid Id, string Name, string Specialty, long ActiveClients, long SessionsToday);

public sealed record PendingPayment(Guid Id, string MemberName, int Amount, DateOnly DueDate, int DaysOverdue);

public sealed record PendingPayments(long Total, IReadOnlyList<PendingPayment> Items);

public sealed record DashboardData(
    GymHeader Gym,
    DateTime GeneratedAt,
    IReadOnlyList<Kpi> Kpis,
    IReadOnlyList<MonthAmount> RevenueByMonth,
    IReadOnlyList<DayCount> CheckInsByDay,
    IReadOnlyList<PlanCount> MembersByPlan,
    IReadOnlyList<Renewal> Renewals,
    IReadOnlyList<CheckIn> RecentCheckIns,
    IReadOnlyList<TrainerLoad> Trainers,
    PendingPayments PendingPayments);

public sealed record MethodAmount(string Method, long Amount);

public sealed record ReportTrainer(Guid Id, string Name, string Specialty, long ActiveClients, long AssignedClients, long SessionsToday);

public sealed record UpcomingRenewal(Guid ClientId, string ClientName, string? PlanName, DateOnly EndDate, int Amount, int DaysLeft);

/// <summary>GET /reports, as ANALYSIS.md §4. Retention is null when no membership ended in the last 90 days.</summary>
public sealed record ReportsData(
    long ThisMonth,
    long NewClients,
    long Outstanding,
    int? Retention,
    IReadOnlyList<MonthAmount> Revenue,
    IReadOnlyList<DayCount> CheckIns,
    IReadOnlyList<PlanCount> ByPlan,
    IReadOnlyList<MethodAmount> Methods,
    IReadOnlyList<ReportTrainer> Trainers,
    IReadOnlyList<UpcomingRenewal> Renewals);

// Rows returned by the usp_dashboard_* / usp_report_* functions (snake_case → PascalCase).

public sealed class GymRow
{
    public string Name { get; init; } = "";
    public string? Branch { get; init; }
}

public sealed class KpiRow
{
    public string Id { get; init; } = "";
    public long Value { get; init; }
    public long Previous { get; init; }
    public string Format { get; init; } = "";
}

public sealed class RevenueRow
{
    public string RevenueMonth { get; init; } = "";
    public long Amount { get; init; }
}

public sealed class DailyRow
{
    public DateOnly CheckInDate { get; init; }
    public long CheckInCount { get; init; }
}

public sealed class PlanMembersRow
{
    public string? PlanName { get; init; }
    public long MemberCount { get; init; }
}

public sealed class RenewalRow
{
    public Guid Id { get; init; }
    public string MemberName { get; init; } = "";
    public string? Plan { get; init; }
    public DateOnly DueDate { get; init; }
    public int Amount { get; init; }
    public string Status { get; init; } = "";
}

public sealed class CheckInRow
{
    public Guid Id { get; init; }
    public string MemberName { get; init; } = "";
    public DateTime CheckedInAt { get; init; }
    public string? TrainerName { get; init; }
}

public sealed class TrainerLoadRow
{
    public Guid Id { get; init; }
    public string Name { get; init; } = "";
    public string Specialty { get; init; } = "";
    public long ActiveClients { get; init; }
    public long AssignedClients { get; init; }
    public long SessionsToday { get; init; }
}

public sealed class PendingRow
{
    public Guid Id { get; init; }
    public string MemberName { get; init; } = "";
    public int Amount { get; init; }
    public DateOnly DueDate { get; init; }
    public int DaysOverdue { get; init; }
    public long TotalPending { get; init; }
}

public sealed class ReportSummaryRow
{
    public long ThisMonth { get; init; }
    public long NewClients { get; init; }
    public long Outstanding { get; init; }
    public int? RetentionPct { get; init; }
}

public sealed class MethodRow
{
    public string Method { get; init; } = "";
    public long Amount { get; init; }
}

public sealed class UpcomingRenewalRow
{
    public Guid ClientId { get; init; }
    public string ClientName { get; init; } = "";
    public string? PlanName { get; init; }
    public DateOnly EndDate { get; init; }
    public int Amount { get; init; }
    public int DaysLeft { get; init; }
}
