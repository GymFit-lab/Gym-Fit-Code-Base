"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { FormField, fieldA11y } from "@/components/auth/form-field";
import { BarChart } from "@/components/dashboard/charts/bar-chart";
import { Panel } from "@/components/dashboard/panel";
import { DemoBanner } from "@/components/gym/demo-banner";
import {
  DataTable,
  FormActions,
  FormDialog,
  LoadingState,
  PageHeader,
  Person,
  SearchField,
  StatTile,
  StatusPill,
  type Column,
} from "@/components/gym/shared";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { gymContent } from "@/content/gym";
import { formatNumber, formatWeekday } from "@/lib/dashboard/format";
import { dateOf, lastDays, todayISO } from "@/lib/gym/dates";
import { formatClock, formatDate } from "@/lib/gym/format";
import { buildClientRows, type ClientRow } from "@/lib/gym/selectors";
import { useGym } from "@/lib/gym/store";
import { attendanceSchema, type AttendanceFormValues } from "@/lib/schemas/gym";
import { fill } from "@/lib/utils";

const copy = gymContent.attendance;

function CheckInForm({ done, clients }: { done: () => void; clients: ClientRow[] }) {
  const { checkIn } = useGym();
  const f = copy.form;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { clientId: "" },
  });

  const onSubmit = handleSubmit(({ clientId }) => {
    if (checkIn(clientId) === "duplicate") {
      const name = clients.find((c) => c.id === clientId)?.name ?? "";
      setError("clientId", { message: fill(f.duplicate, { name }) });
      return;
    }
    done();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <FormField id="att-client" label={f.client} error={errors.clientId?.message}>
        <NativeSelect
          {...register("clientId")}
          {...fieldA11y("att-client", errors.clientId?.message)}
        >
          <option value="">{clients.length ? f.selectClient : f.noClients}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.status === "expired" ? ` (${f.expiredNote})` : ""}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      <FormActions submit={f.submit} onCancel={done} />
    </form>
  );
}

type Row = { id: string; checkedInAt: string; client: ClientRow | undefined };

const columns: Column<Row>[] = [
  {
    id: "time",
    header: copy.columns.time,
    cell: (r) => <span className="font-mono">{formatClock(r.checkedInAt)}</span>,
  },
  {
    id: "client",
    header: copy.columns.client,
    cell: (r) => <Person name={r.client?.name ?? "—"} />,
  },
  { id: "plan", header: copy.columns.plan, cell: (r) => r.client?.plan?.name ?? "—" },
  {
    id: "trainer",
    header: copy.columns.trainer,
    cell: (r) => (
      <span className="text-muted">{r.client?.trainer?.name ?? gymContent.common.noTrainer}</span>
    ),
  },
  {
    id: "status",
    header: copy.columns.status,
    cell: (r) => (r.client ? <StatusPill status={r.client.status} /> : "—"),
  },
];

export function AttendanceView() {
  const { ready, data } = useGym();
  const [date, setDate] = useState(() => todayISO());
  const [query, setQuery] = useState("");

  const today = todayISO();
  const clients = useMemo(() => buildClientRows(data, todayISO()), [data]);

  const perDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of data.attendance) {
      const d = dateOf(a.checkedInAt);
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    return counts;
  }, [data.attendance]);

  const rows = useMemo<Row[]>(() => {
    const byId = new Map(clients.map((c) => [c.id, c]));
    const q = query.trim().toLowerCase();
    return data.attendance
      .filter((a) => dateOf(a.checkedInAt) === date)
      .map((a) => ({ id: a.id, checkedInAt: a.checkedInAt, client: byId.get(a.clientId) }))
      .filter((r) => !q || r.client?.name.toLowerCase().includes(q))
      .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt));
  }, [data.attendance, clients, date, query]);

  if (!ready) return <LoadingState />;

  const sum = (days: string[]) => days.reduce((n, d) => n + (perDay.get(d) ?? 0), 0);
  const last30 = lastDays(30, today);
  const last14 = lastDays(14, today);

  // Busiest hour today (gym-local), from the same data the log shows.
  const hours = new Map<number, number>();
  for (const a of data.attendance) {
    if (dateOf(a.checkedInAt) !== today) continue;
    const h = Number(
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
      }).format(new Date(a.checkedInAt)),
    );
    hours.set(h, (hours.get(h) ?? 0) + 1);
  }
  const peak = [...hours.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
  const peakLabel = peak
    ? new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: true, timeZone: "UTC" }).format(
        new Date(Date.UTC(2000, 0, 1, peak[0])),
      )
    : copy.peakNone;

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          <FormDialog
            label={copy.checkIn}
            title={copy.form.title}
            description={copy.form.description}
          >
            {(done) => <CheckInForm done={done} clients={clients} />}
          </FormDialog>
        }
      />
      <DemoBanner />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={copy.stats.today} value={formatNumber(perDay.get(today) ?? 0)} />
        <StatTile label={copy.stats.week} value={formatNumber(sum(lastDays(7, today)))} />
        <StatTile label={copy.stats.average} value={formatNumber(Math.round(sum(last30) / 30))} />
        <StatTile label={copy.stats.peak} value={peakLabel} />
      </div>

      <Panel title={copy.chartTitle}>
        <BarChart
          title={copy.chartTitle}
          format="number"
          points={last14.map((d) => ({ label: formatWeekday(d), value: perDay.get(d) ?? 0 }))}
        />
      </Panel>

      <Panel
        title={copy.historyTitle}
        description={fill(copy.historyDescription, { date: formatDate(date) })}
      >
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <SearchField value={query} onChange={setQuery} placeholder={copy.searchPlaceholder} />
          <label className="grid gap-1 text-xs font-semibold text-muted">
            {copy.dateFilter}
            <Input
              type="date"
              value={date}
              max={today}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="h-11"
            />
          </label>
        </div>
        <DataTable columns={columns} rows={rows} getKey={(r) => r.id} empty={copy.empty} />
      </Panel>
    </div>
  );
}
