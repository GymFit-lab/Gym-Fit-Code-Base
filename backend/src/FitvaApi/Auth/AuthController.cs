using FitvaApi.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FitvaApi.Auth;

[ApiController]
[Route("auth")]
public sealed class AuthController(Db db, TokenService tokens, CurrentUser currentUser, TimeProvider clock) : ControllerBase
{
    // Compared against when the email is unknown, so a miss takes as long as a wrong password.
    static readonly string DummyHash = BCrypt.Net.BCrypt.HashPassword("fitva-dummy-password", 10);

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimits.Login)]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var users = await db.CallFn<UserRow>("usp_user_get_by_email", new { p_email = Pg.Citext(request.Email.Trim()) }, ct);
        var user = users.FirstOrDefault();

        var passwordOk = BCrypt.Net.BCrypt.Verify(request.Password, user?.PasswordHash ?? DummyHash);
        if (user is null || !passwordOk || !user.IsActive)
            return InvalidCredentials();

        await db.CallScalar<object>("usp_user_touch_login", new { p_gym_id = user.GymId, p_user_id = user.Id }, ct);
        return await Issue(user, ct);
    }

    /// <summary>Rotates the refresh token: the old one is revoked and a new pair is issued.</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request, CancellationToken ct)
    {
        var hash = TokenService.Hash(request.RefreshToken);
        var stored = (await db.CallFn<RefreshTokenRow>("usp_refresh_token_get", new { p_token_hash = hash }, ct)).FirstOrDefault();
        if (stored is null || stored.RevokedAt is not null || stored.ExpiresAt <= clock.GetUtcNow().UtcDateTime)
            return InvalidRefreshToken();

        var user = (await db.CallFn<UserRow>("usp_user_get_by_id", new { p_gym_id = stored.GymId, p_user_id = stored.UserId }, ct))
            .FirstOrDefault();
        if (user is null || !user.IsActive)
            return InvalidRefreshToken();

        // Revoke first: if two requests race with the same token, only one gets a new pair.
        var revoked = await db.CallScalar<bool>("usp_refresh_token_revoke", new { p_gym_id = stored.GymId, p_token_hash = hash }, ct);
        if (!revoked)
            return InvalidRefreshToken();

        return await Issue(user, ct);
    }

    /// <summary>Revokes the given refresh token. Always succeeds so it can't be used to probe tokens.</summary>
    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout(RefreshRequest request, CancellationToken ct)
    {
        var hash = TokenService.Hash(request.RefreshToken);
        var stored = (await db.CallFn<RefreshTokenRow>("usp_refresh_token_get", new { p_token_hash = hash }, ct)).FirstOrDefault();
        if (stored is not null)
            await db.CallScalar<bool>("usp_refresh_token_revoke", new { p_gym_id = stored.GymId, p_token_hash = hash }, ct);
        return Ok(new { ok = true });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthUser>> Me(CancellationToken ct)
    {
        var user = (await db.CallFn<UserRow>("usp_user_get_by_id", new { p_gym_id = currentUser.GymId, p_user_id = currentUser.UserId }, ct))
            .FirstOrDefault();
        if (user is null || !user.IsActive)
            return Unauthorized();
        return user.ToAuthUser();
    }

    /// <summary>
    /// The signed-in user changes their own password. Every refresh token is revoked (all devices
    /// sign out), and a fresh pair is returned for this device.
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    [EnableRateLimiting(RateLimits.Login)]
    public async Task<ActionResult<AuthResponse>> ChangePassword(Features.Staff.ChangePasswordRequest request, CancellationToken ct)
    {
        var self = (await db.CallFn<UserRow>("usp_user_get_by_id", new { p_gym_id = currentUser.GymId, p_user_id = currentUser.UserId }, ct))
            .FirstOrDefault();
        if (self is null || !self.IsActive)
            return Unauthorized();

        var withHash = (await db.CallFn<UserRow>("usp_user_get_by_email", new { p_email = Pg.Citext(self.Email) }, ct)).FirstOrDefault();
        if (withHash?.PasswordHash is null || !BCrypt.Net.BCrypt.Verify(request.CurrentPassword, withHash.PasswordHash))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Current password is incorrect");

        await db.CallScalar<Guid>("usp_user_set_password", new
        {
            p_gym_id = self.GymId,
            p_user_id = self.Id,
            p_password_hash = Features.Staff.StaffRules.Hash(request.NewPassword),
        }, ct);
        return await Issue(self, ct);
    }

    async Task<AuthResponse> Issue(UserRow user, CancellationToken ct)
    {
        var refresh = tokens.CreateRefreshToken();
        await db.CallScalar<Guid>("usp_refresh_token_save", new
        {
            p_gym_id = user.GymId,
            p_user_id = user.Id,
            p_token_hash = refresh.Hash,
            p_expires_at = refresh.ExpiresAt,
        }, ct);

        return new AuthResponse(
            tokens.CreateAccessToken(user.Id, user.GymId, user.Role),
            refresh.Token,
            tokens.AccessTokenSeconds,
            user.ToAuthUser());
    }

    ObjectResult InvalidCredentials() => Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Invalid email or password");

    ObjectResult InvalidRefreshToken() => Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Invalid or expired refresh token");
}
