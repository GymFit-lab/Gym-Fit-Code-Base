using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace FitvaApi.Infrastructure;

/// <summary>
/// Maps PostgreSQL errors raised by the usp_* functions to HTTP responses (DB_CONTRACT.md §1).
/// Anything else falls through to the default 500 ProblemDetails.
/// </summary>
public sealed class PgExceptionHandler(IProblemDetailsService problemDetails, ILogger<PgExceptionHandler> logger)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        if (exception is not PostgresException pg)
            return false;

        var (status, code, title) = pg.SqlState switch
        {
            "P0002" => (StatusCodes.Status404NotFound, "NOT_FOUND", "Not found"),
            "P0004" => (StatusCodes.Status409Conflict, "LAST_OWNER", "The gym needs at least one active owner"),
            "23505" when pg.ConstraintName == "uq_attendance_client_day" =>
                (StatusCodes.Status409Conflict, "DUPLICATE_CHECKIN", "Already checked in today"),
            "23505" => (StatusCodes.Status409Conflict, "DUPLICATE", "Already exists"),
            "23514" => (StatusCodes.Status400BadRequest, "INVALID_VALUE", "Invalid value"),
            "23503" => (StatusCodes.Status400BadRequest, "BAD_REFERENCE", "Referenced record does not exist"),
            _ => (0, "", ""),
        };
        if (status == 0)
            return false;

        logger.LogInformation("Postgres {SqlState} ({Constraint}) → {Status}", pg.SqlState, pg.ConstraintName, status);

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            // The functions' own not-found messages are safe and useful; other DB messages are not shown.
            Detail = pg.SqlState == "P0002" ? pg.MessageText : null,
        };
        problem.Extensions["code"] = code;
        if (pg.ConstraintName is { } constraint)
            problem.Extensions["constraint"] = constraint;

        context.Response.StatusCode = status;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = problem,
            Exception = exception,
        });
    }
}
