using FitvaApi.Auth;
using FitvaApi.Features.Common;
using FitvaApi.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitvaApi.Features.Trainers;

[ApiController]
[Route("trainers")]
[Authorize(Policy = Policies.AnyStaff)]
public sealed class TrainersController(Db db, CurrentUser me) : ControllerBase
{
    [HttpGet]
    public async Task<PagedResult<TrainerRow>> List([FromQuery] PageQuery q, CancellationToken ct)
    {
        var rows = await Page(q.Search, q.Page, q.PageSize, ct);
        return new PagedResult<TrainerRow>(rows, Paging.Meta(q, rows));
    }

    [HttpPost]
    [Authorize(Policy = Policies.Owner)]
    public async Task<ActionResult<TrainerRow>> Create(SaveTrainerRequest request, CancellationToken ct)
    {
        var id = await Save(null, request, ct);
        return Created($"/trainers/{id}", await Find(id, request.Name, ct));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.Owner)]
    
    public async Task<ActionResult<TrainerRow>> Update(Guid id, SaveTrainerRequest request, CancellationToken ct)
    {
        await Save(id, request, ct);
        return await Find(id, request.Name, ct) is { } trainer ? trainer : NotFound();
    }

    async Task<Guid> Save(Guid? id, SaveTrainerRequest r, CancellationToken ct) =>
        await db.CallScalar<Guid>("usp_trainer_save", new
        {
            p_gym_id = me.GymId,
            p_trainer_id = id,
            p_name = r.Name,
            p_specialty = r.Specialty,
            p_phone = r.Phone,
            p_email = r.Email,
        }, ct);

    Task<IReadOnlyList<TrainerRow>> Page(string? search, int page, int pageSize, CancellationToken ct) =>
        db.CallFn<TrainerRow>("usp_trainer_get_paged", new
        {
            p_gym_id = me.GymId,
            p_search = search,
            p_page = page,
            p_page_size = pageSize,
        }, ct);

    // There is no usp_trainer_get_by_id: read the saved row back through the list, searched by its name.
    async Task<TrainerRow?> Find(Guid id, string name, CancellationToken ct) =>
        (await Page(name.Trim(), 1, 200, ct)).FirstOrDefault(t => t.Id == id);
}
