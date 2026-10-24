using FitvaApi.Auth;
using FitvaApi.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitvaApi.Features.Clients;

[ApiController]
[Route("clients")]
[Authorize(Policy = Policies.AnyStaff)]
public sealed class ClientsController(Db db, CurrentUser me) : ControllerBase
{
    [HttpGet]
    public async Task<ClientList> List([FromQuery] ClientQuery q, CancellationToken ct)
    {
        var rows = await db.CallFn<ClientRow>("usp_client_get_paged", new
        {
            p_gym_id = me.GymId,
            p_search = q.Search,
            p_page = q.Page,
            p_page_size = q.PageSize,
            p_status = q.Status,
            p_trainer_id = q.TrainerId,
        }, ct);
        var counts = (await db.CallFn<ClientCounts>("usp_client_get_counts", new { p_gym_id = me.GymId }, ct)).Single();

        return new ClientList(rows, new ClientListMeta(q.Page, q.PageSize, rows.Count > 0 ? rows[0].TotalCount : 0, counts));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClientRow>> Get(Guid id, CancellationToken ct)
    {
        var client = await Find(id, ct);
        return client is null ? NotFound() : client;
    }

    [HttpPost]
    [Authorize(Policy = Policies.Staff)]
    public async Task<ActionResult<ClientRow>> Create(SaveClientRequest request, CancellationToken ct)
    {
        var id = await Save(null, request, ct);
        return CreatedAtAction(nameof(Get), new { id }, await Find(id, ct));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.Staff)]
    public async Task<ActionResult<ClientRow>> Update(Guid id, SaveClientRequest request, CancellationToken ct)
    {
        await Save(id, request, ct);
        return await Find(id, ct) is { } client ? client : NotFound();
    }

    /// <summary>Soft delete (owner only); memberships and payments stay for the reports.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Policies.Owner)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var deleted = await db.CallScalar<Guid>("usp_client_delete", new { p_gym_id = me.GymId, p_client_id = id }, ct);
        return Ok(new { id = deleted });
    }

    async Task<Guid> Save(Guid? id, SaveClientRequest r, CancellationToken ct) =>
        await db.CallScalar<Guid>("usp_client_save", new
        {
            p_gym_id = me.GymId,
            p_client_id = id,
            p_name = r.Name,
            p_phone = r.Phone,
            p_email = r.Email,
            p_gender = r.Gender,
            p_trainer_id = r.TrainerId,
        }, ct);

    async Task<ClientRow?> Find(Guid id, CancellationToken ct) =>
        (await db.CallFn<ClientRow>("usp_client_get_by_id", new { p_gym_id = me.GymId, p_client_id = id }, ct)).FirstOrDefault();
}
