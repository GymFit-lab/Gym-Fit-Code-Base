using FitvaApi.Auth;
using FitvaApi.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitvaApi.Features.Staff;

/// <summary>
/// Staff logins (owner only). A gym always keeps at least one active owner: changes that would
/// break that get 409 LAST_OWNER. Deactivating or resetting a password signs that person out of
/// every device (their refresh tokens are revoked).
/// </summary>
[ApiController]
[Route("staff")]
[Authorize(Policy = Policies.Owner)]
public sealed class StaffController(Db db, CurrentUser me) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<StaffRow>> List(CancellationToken ct) =>
        db.CallFn<StaffRow>("usp_user_get_list", new { p_gym_id = me.GymId }, ct);

    [HttpPost]
    public async Task<ActionResult<StaffRow>> Create(CreateStaffRequest r, CancellationToken ct)
    {
        var id = await Save(null, r.Name, r.Email, r.Phone, r.Role, StaffRules.Hash(r.Password), ct);
        return Created($"/staff/{id}", await Find(id, ct));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<StaffRow>> Update(Guid id, UpdateStaffRequest r, CancellationToken ct)
    {
        await Save(id, r.Name, r.Email, r.Phone, r.Role, null, ct);
        return await Find(id, ct) is { } staff ? staff : NotFound();
    }

    /// <summary>Sets a new password for a staff member (e.g. they forgot theirs).</summary>
    [HttpPost("{id:guid}/password")]
    public async Task<IActionResult> SetPassword(Guid id, SetPasswordRequest r, CancellationToken ct)
    {
        await db.CallScalar<Guid>("usp_user_set_password", new
        {
            p_gym_id = me.GymId,
            p_user_id = id,
            p_password_hash = StaffRules.Hash(r.Password),
        }, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/deactivate")]
    public Task<ActionResult<StaffRow>> Deactivate(Guid id, CancellationToken ct) => SetActive(id, false, ct);

    [HttpPost("{id:guid}/activate")]
    public Task<ActionResult<StaffRow>> Activate(Guid id, CancellationToken ct) => SetActive(id, true, ct);

    async Task<ActionResult<StaffRow>> SetActive(Guid id, bool active, CancellationToken ct)
    {
        await db.CallScalar<Guid>("usp_user_set_active", new { p_gym_id = me.GymId, p_user_id = id, p_is_active = active }, ct);
        return await Find(id, ct) is { } staff ? staff : NotFound();
    }

    async Task<Guid> Save(Guid? id, string name, string email, string? phone, string role, string? hash, CancellationToken ct) =>
        await db.CallScalar<Guid>("usp_user_save", new
        {
            p_gym_id = me.GymId,
            p_user_id = id,
            p_name = name,
            p_email = Pg.Citext(email.Trim().ToLowerInvariant()),
            p_phone = phone,
            p_role = role,
            p_password_hash = hash,
        }, ct);

    async Task<StaffRow?> Find(Guid id, CancellationToken ct) =>
        (await List(ct)).FirstOrDefault(s => s.Id == id);
}
