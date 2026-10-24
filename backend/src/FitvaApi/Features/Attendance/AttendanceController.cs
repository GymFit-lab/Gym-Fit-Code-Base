using FitvaApi.Auth;
using FitvaApi.Features.Clients;
using FitvaApi.Features.Common;
using FitvaApi.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitvaApi.Features.Attendance;

[ApiController]
[Route("attendance")]
[Authorize(Policy = Policies.AnyStaff)]
public sealed class AttendanceController(Db db, CurrentUser me) : ControllerBase
{
    [HttpGet]
    public async Task<PagedResult<AttendanceRow>> List([FromQuery] AttendanceQuery q, CancellationToken ct)
    {
        var rows = await Page(q.Search, q.Page, q.PageSize, q.Date, ct);
        return new PagedResult<AttendanceRow>(rows, Paging.Meta(q, rows));
    }

    /// <summary>Check-ins per day for the last <paramref name="days"/> days (oldest first) and today's busiest hour.</summary>
    [HttpGet("summary")]
    public async Task<ActionResult<AttendanceSummary>> Summary([FromQuery] int days = 30, CancellationToken ct = default)
    {
        if (days is < 1 or > 366)
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["days"] = ["Days must be between 1 and 366."],
            }));

        var perDay = await db.CallFn<DailyCountRow>("usp_attendance_get_daily", new { p_gym_id = me.GymId, p_days = days }, ct);
        var peak = (await db.CallFn<PeakHourRow>("usp_attendance_get_peak_hour", new { p_gym_id = me.GymId }, ct)).FirstOrDefault();
        return new AttendanceSummary(perDay.Select(d => new DayCount(d.CheckInDate, d.CheckInCount)).ToList(), peak?.PeakHour);
    }

    /// <summary>Every check-in of the last <paramref name="days"/> days, newest first (bulk load for offline/caching apps).</summary>
    [HttpGet("recent")]
    public async Task<ActionResult<IReadOnlyList<AttendanceListRow>>> Recent([FromQuery] int days = 90, CancellationToken ct = default)
    {
        if (days is < 1 or > 366)
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["days"] = ["Days must be between 1 and 366."],
            }));

        var rows = await db.CallFn<AttendanceListRow>("usp_attendance_get_list", new { p_gym_id = me.GymId, p_days = days }, ct);
        return Ok(rows);
    }

    /// <summary>Checks a client in now. 409 DUPLICATE_CHECKIN if they already checked in today.</summary>
    [HttpPost]
    [Authorize(Policy = Policies.Staff)]
    public async Task<ActionResult<AttendanceRow>> CheckIn(CheckInRequest r, CancellationToken ct)
    {
        var id = await db.CallScalar<Guid>("usp_attendance_check_in", new { p_gym_id = me.GymId, p_client_id = r.ClientId }, ct);

        var client = (await db.CallFn<ClientRow>("usp_client_get_by_id", new { p_gym_id = me.GymId, p_client_id = r.ClientId }, ct)).Single();
        var row = (await Page(client.Name, 1, 200, null, ct)).FirstOrDefault(a => a.Id == id);
        return Created($"/attendance/{id}", row);
    }

    Task<IReadOnlyList<AttendanceRow>> Page(string? search, int page, int pageSize, DateOnly? date, CancellationToken ct) =>
        db.CallFn<AttendanceRow>("usp_attendance_get_paged", new
        {
            p_gym_id = me.GymId,
            p_search = search,
            p_page = page,
            p_page_size = pageSize,
            p_date = date,
        }, ct);
}
