using System.Globalization;
using System.Text;
using FitvaApi.Auth;
using FitvaApi.Features.Clients;
using FitvaApi.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitvaApi.Features.Payments;

[ApiController]
[Route("payments")]
[Authorize(Policy = Policies.Staff)]
public sealed class PaymentsController(Db db, CurrentUser me, TimeProvider clock) : ControllerBase
{
    [HttpGet]
    public async Task<PaymentList> List([FromQuery] PaymentQuery q, CancellationToken ct)
    {
        var rows = await Page(db, me.GymId, q.Search, q.Page, q.PageSize, q.Status, q.Method, ct);
        var totals = (await db.CallFn<PaymentTotals>("usp_payment_get_totals", new { p_gym_id = me.GymId }, ct)).Single();
        return new PaymentList(rows, new PaymentListMeta(q.Page, q.PageSize, rows.Count > 0 ? rows[0].TotalCount : 0, totals));
    }

    [HttpPost]
    public async Task<ActionResult<PaymentRow>> Create(SavePaymentRequest r, CancellationToken ct)
    {
        var id = await db.CallScalar<Guid>("usp_payment_save", new
        {
            p_gym_id = me.GymId,
            p_payment_id = (Guid?)null,
            p_client_id = r.ClientId,
            p_amount = r.Amount,
            p_method = r.Method,
            p_status = r.Status,
            p_payment_date = r.Date,
            p_note = r.Note,
        }, ct);

        var client = (await db.CallFn<ClientRow>("usp_client_get_by_id", new { p_gym_id = me.GymId, p_client_id = r.ClientId }, ct)).Single();
        return Created($"/payments/{id}", await FindPayment(db, me.GymId, id, client.Name, ct));
    }

    /// <summary>Marks a pending payment paid, dated today (gym-local). Already-paid payments are unchanged.</summary>
    [HttpPatch("{id:guid}/mark-paid")]
    public async Task<ActionResult<PaymentRow>> MarkPaid(Guid id, CancellationToken ct)
    {
        await db.CallScalar<Guid>("usp_payment_mark_paid", new { p_gym_id = me.GymId, p_payment_id = id }, ct);

        // Just-paid rows are dated today, so they sort to the top of the paid list. A payment that was
        // already paid long ago may not be on that page; it still succeeded, so return its id.
        var paid = await Page(db, me.GymId, null, 1, 200, "paid", null, ct);
        return paid.FirstOrDefault(p => p.Id == id) is { } payment ? payment : Ok(new { id });
    }

    /// <summary>All payments as CSV (owner only).</summary>
    [HttpGet("export.csv")]
    [Authorize(Policy = Policies.Owner)]
    public async Task<IActionResult> Export(CancellationToken ct)
    {
        var rows = await db.CallFn<ExportRow>("usp_payment_get_export", new { p_gym_id = me.GymId }, ct);

        var csv = new StringBuilder("date,client,method,status,amount,note\r\n");
        foreach (var r in rows)
            csv.AppendJoin(',',
                    r.PaymentDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    Cell(r.ClientName), r.Method, r.Status,
                    r.Amount.ToString(CultureInfo.InvariantCulture),
                    Cell(r.Note ?? ""))
                .Append("\r\n");

        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        // UTF-8 BOM so Excel shows names in Indian scripts correctly.
        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv.ToString())).ToArray();
        return File(bytes, "text/csv; charset=utf-8", $"payments-{today}.csv");
    }

    /// <summary>Reads one payment back through the list (there is no usp_payment_get_by_id).</summary>
    internal static async Task<PaymentRow?> FindPayment(Db db, Guid gymId, Guid id, string clientName, CancellationToken ct) =>
        (await Page(db, gymId, clientName, 1, 200, null, null, ct)).FirstOrDefault(p => p.Id == id);

    static Task<IReadOnlyList<PaymentRow>> Page(Db db, Guid gymId, string? search, int page, int pageSize, string? status, string? method, CancellationToken ct) =>
        db.CallFn<PaymentRow>("usp_payment_get_paged", new
        {
            p_gym_id = gymId,
            p_search = search,
            p_page = page,
            p_page_size = pageSize,
            p_status = status,
            p_method = method,
        }, ct);

    // Quote fields with commas/quotes/newlines, and neutralise spreadsheet formulas (=, +, -, @).
    static string Cell(string value)
    {
        if (value.Length > 0 && value[0] is '=' or '+' or '-' or '@')
            value = "'" + value;
        return value.IndexOfAny([',', '"', '\r', '\n']) >= 0 ? "\"" + value.Replace("\"", "\"\"") + "\"" : value;
    }
}
