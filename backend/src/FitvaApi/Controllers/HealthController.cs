using FitvaApi.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitvaApi.Controllers;

[ApiController]
[Route("health")]
[AllowAnonymous]
public sealed class HealthController(Db db, ILogger<HealthController> logger) : ControllerBase
{
    /// <summary>200 when the API and fitva_db are both reachable, 503 otherwise.</summary>
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        try
        {
            await db.Ping(ct);
            return Ok(new { status = "ok", database = "ok" });
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Health check: database unreachable");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "degraded", database = "unreachable" });
        }
    }
}
