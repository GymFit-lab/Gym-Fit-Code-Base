using System.Data;
using System.Reflection;
using System.Text.RegularExpressions;
using Dapper;
using Npgsql;

namespace FitvaApi.Infrastructure;

/// <summary>
/// Access to fitva_db (see database/DB_CONTRACT.md). Everything goes through the usp_* stored
/// functions, called with named arguments: <c>select * from usp_x(p_gym_id => @p_gym_id, …)</c>.
/// Pass an anonymous object whose property names are the function's parameter names.
/// </summary>
public sealed partial class Db(NpgsqlDataSource dataSource)
{
    static Db()
    {
        // usp_* functions return snake_case columns; map them onto PascalCase record properties.
        DefaultTypeMap.MatchNamesWithUnderscores = true;
        SqlMapper.AddTypeHandler(new DateOnlyHandler());
    }

    /// <summary>Calls a set-returning function and maps each row to <typeparamref name="T"/>.</summary>
    public async Task<IReadOnlyList<T>> CallFn<T>(string name, object? args = null, CancellationToken ct = default)
    {
        await using var conn = await dataSource.OpenConnectionAsync(ct);
        var rows = await conn.QueryAsync<T>(new CommandDefinition(BuildSql("select * from", name, args), args, cancellationToken: ct));
        return rows.AsList();
    }

    /// <summary>Calls a scalar function (e.g. usp_client_save → uuid) and returns its value.</summary>
    public async Task<T?> CallScalar<T>(string name, object? args = null, CancellationToken ct = default)
    {
        await using var conn = await dataSource.OpenConnectionAsync(ct);
        return await conn.ExecuteScalarAsync<T>(new CommandDefinition(BuildSql("select", name, args), args, cancellationToken: ct));
    }

    /// <summary>Checks that the database is reachable (used by GET /health).</summary>
    public async Task<bool> Ping(CancellationToken ct = default)
    {
        await using var conn = await dataSource.OpenConnectionAsync(ct);
        return await conn.ExecuteScalarAsync<int>(new CommandDefinition("select 1", cancellationToken: ct)) == 1;
    }

    // Function and parameter names are interpolated into SQL, so only safe identifiers are allowed;
    // values always travel as parameters.
    static string BuildSql(string prefix, string name, object? args)
    {
        if (!FunctionName().IsMatch(name))
            throw new ArgumentException($"Not a usp_* function name: {name}", nameof(name));

        var named = ParameterNames(args).Select(p =>
            ParamName().IsMatch(p) ? $"{p} => @{p}" : throw new ArgumentException($"Bad parameter name: {p}", nameof(args)));
        return $"{prefix} {name}({string.Join(", ", named)})";
    }

    static IEnumerable<string> ParameterNames(object? args) => args switch
    {
        null => [],
        DynamicParameters dp => dp.ParameterNames,
        _ => args.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance).Select(p => p.Name),
    };

    [GeneratedRegex("^usp_[a-z0-9_]+$")]
    private static partial Regex FunctionName();

    [GeneratedRegex("^p_[a-z0-9_]+$")]
    private static partial Regex ParamName();

    // Npgsql returns `date` as DateTime through IDataReader.GetValue; keep it a plain DateOnly so
    // gym-local dates never shift by a timezone.
    sealed class DateOnlyHandler : SqlMapper.TypeHandler<DateOnly>
    {
        public override DateOnly Parse(object value) => value switch
        {
            DateOnly d => d,
            DateTime dt => DateOnly.FromDateTime(dt),
            _ => DateOnly.Parse(value.ToString()!),
        };

        public override void SetValue(IDbDataParameter parameter, DateOnly value)
        {
            parameter.DbType = DbType.Date;
            parameter.Value = value;
        }
    }
}
