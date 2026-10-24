using System.Data;
using Dapper;
using Npgsql;
using NpgsqlTypes;

namespace FitvaApi.Infrastructure;

/// <summary>Typed parameter helpers for arguments Npgsql can't infer from the CLR type.</summary>
public static class Pg
{
    /// <summary>
    /// A <c>citext</c> argument (e.g. <c>usp_user_get_by_email(p_email citext)</c>). A plain string is
    /// sent as <c>text</c>, and text → citext is only an assignment cast, so the function wouldn't resolve.
    /// </summary>
    public static SqlMapper.ICustomQueryParameter Citext(string? value) => new Typed(value, NpgsqlDbType.Citext);

    sealed class Typed(object? value, NpgsqlDbType type) : SqlMapper.ICustomQueryParameter
    {
        public void AddParameter(IDbCommand command, string name) =>
            command.Parameters.Add(new NpgsqlParameter(name, type) { Value = value ?? DBNull.Value });
    }
}
