using FitvaApi.Auth;
using FitvaApi.Features.Clients;
using FitvaApi.Features.Common;
using FitvaApi.Features.Payments;
using FitvaApi.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitvaApi.Features.Memberships;

[ApiController]
[Route("memberships")]
[Authorize(Policy = Policies.AnyStaff)]
public sealed class MembershipsController(Db db, CurrentUser me) : ControllerBase
{
    [HttpGet]
    public async Task<PagedResult<MembershipRow>> List([FromQuery] MembershipQuery q, CancellationToken ct)
    {
        var rows = await Page(q.Search, q.Page, q.PageSize, q.Status, q.PlanId, ct);
        return new PagedResult<MembershipRow>(rows, Paging.Meta(q, rows));
    }

    /// <summary>end = start + plan months − 1 day, amount = plan price, payment dated the start day.</summary>
    [HttpPost]
    [Authorize(Policy = Policies.Staff)]
    public async Task<ActionResult<MembershipCreated>> Create(CreateMembershipRequest r, CancellationToken ct)
    {
        var ids = (await db.CallFn<MembershipCreatedRow>("usp_membership_create", new
        {
            p_gym_id = me.GymId,
            p_client_id = r.ClientId,
            p_plan_id = r.PlanId,
            p_start_date = r.StartDate,
            p_payment_status = r.PaymentStatus,
            p_method = r.Method,
        }, ct)).Single();

        // No get-by-id functions for these: read both rows back through the lists, searched by client name.
        var client = (await db.CallFn<ClientRow>("usp_client_get_by_id", new { p_gym_id = me.GymId, p_client_id = r.ClientId }, ct)).Single();
        var membership = (await Page(client.Name, 1, 200, null, r.PlanId, ct)).FirstOrDefault(m => m.Id == ids.MembershipId);
        var payment = await PaymentsController.FindPayment(db, me.GymId, ids.PaymentId, client.Name, ct);

        return Created($"/memberships/{ids.MembershipId}", new MembershipCreated(membership, payment));
    }

    Task<IReadOnlyList<MembershipRow>> Page(string? search, int page, int pageSize, string? status, Guid? planId, CancellationToken ct) =>
        db.CallFn<MembershipRow>("usp_membership_get_paged", new
        {
            p_gym_id = me.GymId,
            p_search = search,
            p_page = page,
            p_page_size = pageSize,
            p_status = status,
            p_plan_id = planId,
        }, ct);
}
