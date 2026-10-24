using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace FitvaApi.Infrastructure;

/// <summary>
/// Runs the registered FluentValidation validator for every action argument that has one and
/// returns a 400 ValidationProblem (field → messages) before the action runs.
/// </summary>
public sealed class ValidationFilter(IServiceProvider services) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        foreach (var argument in context.ActionArguments.Values)
        {
            if (argument is null)
                continue;

            var validatorType = typeof(IValidator<>).MakeGenericType(argument.GetType());
            if (services.GetService(validatorType) is not IValidator validator)
                continue;

            var result = await validator.ValidateAsync(new ValidationContext<object>(argument), context.HttpContext.RequestAborted);
            if (result.IsValid)
                continue;

            var errors = result.Errors
                .GroupBy(e => JsonName(e.PropertyName))
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            context.Result = new BadRequestObjectResult(new ValidationProblemDetails(errors)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation failed",
            });
            return;
        }

        await next();
    }

    // Report field names the way clients send them (camelCase JSON).
    static string JsonName(string property) =>
        string.IsNullOrEmpty(property) ? property : char.ToLowerInvariant(property[0]) + property[1..];
}
