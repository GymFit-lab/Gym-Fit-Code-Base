using System.Security.Claims;

namespace FitvaApi.Auth;

/// <summary>
/// The signed-in staff member, read only from the validated JWT. The gym id never comes from the
/// request body, route or query (DB_CONTRACT.md §4).
/// </summary>
public sealed class CurrentUser(IHttpContextAccessor accessor)
{
    ClaimsPrincipal Principal =>
        accessor.HttpContext?.User ?? throw new InvalidOperationException("No HTTP context.");

    public Guid UserId => Guid.Parse(Required(TokenService.SubjectClaim));
    public Guid GymId => Guid.Parse(Required(TokenService.GymIdClaim));
    public string Role => Required(TokenService.RoleClaim);

    string Required(string type) =>
        Principal.FindFirstValue(type) ?? throw new UnauthorizedAccessException($"Token has no '{type}' claim.");
}
