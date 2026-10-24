using Microsoft.AspNetCore.Diagnostics;

namespace FitvaApi.Infrastructure;

/// <summary>
/// A client that disconnects mid-request (closed app, timeout) cancels the database call. That is
/// not a server error: answer 499 (client closed request) quietly instead of logging a 500.
/// </summary>
public sealed class CancelledRequestHandler : IExceptionHandler
{
    public const int ClientClosedRequest = 499;

    public ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        if (exception is not OperationCanceledException || !context.RequestAborted.IsCancellationRequested)
            return ValueTask.FromResult(false);

        context.Response.StatusCode = ClientClosedRequest;
        return ValueTask.FromResult(true);
    }
}
