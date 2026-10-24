using FitvaApi.Auth;
using FitvaApi.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitvaApi.Features.Dashboard;

[ApiController]
public sealed class DashboardController(Db db, CurrentUser me, TimeProvider clock) : ControllerBase
{
    /// <summary>Everything the owner dashboard renders, as DashboardData (lib/dashboard/types.ts).</summary>
    [HttpGet("dashboard")]
    [Authorize(Policy = Policies.AnyStaff)]
    public async Task<ActionResult<DashboardData>> Get(CancellationToken ct)
    {
        var gymId = me.GymId;
        // Independent reads, so they run in parallel (each on its own pooled connection).
        var gym = db.CallFn<GymRow>("usp_gym_get", new { p_gym_id = gymId }, ct);
        var kpis = db.CallFn<KpiRow>("usp_dashboard_get_kpis", new { p_gym_id = gymId }, ct);
        var revenue = Revenue(gymId, ct);
        var daily = CheckInsByDay(gymId, 7, ct);
        var plans = MembersByPlan(gymId, ct);
        var renewals = db.CallFn<RenewalRow>("usp_dashboard_get_renewals", new { p_gym_id = gymId }, ct);
        var checkIns = db.CallFn<CheckInRow>("usp_dashboard_get_recent_checkins", new { p_gym_id = gymId, p_limit = 8 }, ct);
        var trainers = db.CallFn<TrainerLoadRow>("usp_dashboard_get_trainer_load", new { p_gym_id = gymId }, ct);
        var pending = db.CallFn<PendingRow>("usp_dashboard_get_pending_payments", new { p_gym_id = gymId, p_limit = 5 }, ct);
        await Task.WhenAll(gym, kpis, revenue, daily, plans, renewals, checkIns, trainers, pending);

        var g = gym.Result.FirstOrDefault();
        if (g is null)
            return NotFound();

        return new DashboardData(
            new GymHeader(g.Name, g.Branch ?? ""),
            clock.GetUtcNow().UtcDateTime,
            kpis.Result.Select(k => new Kpi(k.Id, k.Value, k.Previous, k.Format)).ToList(),
            revenue.Result,
            daily.Result,
            plans.Result,
            renewals.Result.Select(r => new Renewal(r.Id, r.MemberName, r.Plan ?? "", r.DueDate, r.Amount, r.Status)).ToList(),
            checkIns.Result.Select(c => new CheckIn(c.Id, c.MemberName, c.CheckedInAt, c.TrainerName)).ToList(),
            trainers.Result.Select(t => new TrainerLoad(t.Id, t.Name, t.Specialty, t.ActiveClients, t.SessionsToday)).ToList(),
            new PendingPayments(
                pending.Result.FirstOrDefault()?.TotalPending ?? 0,
                pending.Result.Select(p => new PendingPayment(p.Id, p.MemberName, p.Amount, p.DueDate, p.DaysOverdue)).ToList()));
    }

    /// <summary>The Reports page (owner only).</summary>
    [HttpGet("reports")]
    [Authorize(Policy = Policies.Owner)]
    public async Task<ReportsData> Reports(CancellationToken ct)
    {
        var gymId = me.GymId;
        var summary = db.CallFn<ReportSummaryRow>("usp_report_get_summary", new { p_gym_id = gymId }, ct);
        var revenue = Revenue(gymId, ct);
        var daily = CheckInsByDay(gymId, 14, ct);
        var plans = MembersByPlan(gymId, ct);
        var methods = db.CallFn<MethodRow>("usp_report_get_paid_by_method", new { p_gym_id = gymId }, ct);
        var trainers = db.CallFn<TrainerLoadRow>("usp_dashboard_get_trainer_load", new { p_gym_id = gymId }, ct);
        var renewals = db.CallFn<UpcomingRenewalRow>("usp_report_get_renewals", new { p_gym_id = gymId, p_days = 14 }, ct);
        await Task.WhenAll(summary, revenue, daily, plans, methods, trainers, renewals);

        var s = summary.Result.Single();
        return new ReportsData(
            s.ThisMonth,
            s.NewClients,
            s.Outstanding,
            s.RetentionPct,
            revenue.Result,
            daily.Result,
            plans.Result,
            methods.Result.Select(m => new MethodAmount(m.Method, m.Amount)).ToList(),
            trainers.Result.Select(t => new ReportTrainer(t.Id, t.Name, t.Specialty, t.ActiveClients, t.AssignedClients, t.SessionsToday)).ToList(),
            renewals.Result.Select(r => new UpcomingRenewal(r.ClientId, r.ClientName, r.PlanName, r.EndDate, r.Amount, r.DaysLeft)).ToList());
    }

    async Task<IReadOnlyList<MonthAmount>> Revenue(Guid gymId, CancellationToken ct) =>
        (await db.CallFn<RevenueRow>("usp_dashboard_get_revenue_by_month", new { p_gym_id = gymId, p_months = 6 }, ct))
            .Select(r => new MonthAmount(r.RevenueMonth, r.Amount)).ToList();

    async Task<IReadOnlyList<DayCount>> CheckInsByDay(Guid gymId, int days, CancellationToken ct) =>
        (await db.CallFn<DailyRow>("usp_attendance_get_daily", new { p_gym_id = gymId, p_days = days }, ct))
            .Select(d => new DayCount(d.CheckInDate, d.CheckInCount)).ToList();

    async Task<IReadOnlyList<PlanCount>> MembersByPlan(Guid gymId, CancellationToken ct) =>
        (await db.CallFn<PlanMembersRow>("usp_dashboard_get_members_by_plan", new { p_gym_id = gymId }, ct))
            .Select(p => new PlanCount(p.PlanName ?? "", p.MemberCount)).ToList();
}
