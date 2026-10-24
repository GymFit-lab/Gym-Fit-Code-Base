using FitvaApi.Auth;
using FitvaApi.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitvaApi.Features.Plans;

[ApiController]
[Route("plans")]
[Authorize(Policy = Policies.AnyStaff)]
public sealed class PlansController(Db db, CurrentUser me) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<PlanRow>> List(CancellationToken ct) =>
        db.CallFn<PlanRow>("usp_plan_get_list", new { p_gym_id = me.GymId }, ct);

    [HttpPost]
    [Authorize(Policy = Policies.Owner)]
    public async Task<ActionResult<PlanRow>> Create(SavePlanRequest request, CancellationToken ct)
    {
        var id = await Save(null, request, ct);
        return Created($"/plans/{id}", await Find(id, ct));
    }

    /// <summary>Changing the price doesn't touch existing memberships (they keep their own amount).</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.Owner)]
    public async Task<ActionResult<PlanRow>> Update(Guid id, SavePlanRequest request, CancellationToken ct)
    {
        await Save(id, request, ct);
        return await Find(id, ct) is { } plan ? plan : NotFound();
    }

    async Task<Guid> Save(Guid? id, SavePlanRequest r, CancellationToken ct) =>
        await db.CallScalar<Guid>("usp_plan_save", new
        {
            p_gym_id = me.GymId,
            p_plan_id = id,
            p_name = r.Name,
            p_duration_months = r.DurationMonths,
            p_price = r.Price,
        }, ct);

    async Task<PlanRow?> Find(Guid id, CancellationToken ct) =>
        (await List(ct)).FirstOrDefault(p => p.Id == id);
}
