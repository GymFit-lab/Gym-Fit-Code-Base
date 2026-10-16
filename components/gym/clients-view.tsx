"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { FormField, fieldA11y } from "@/components/auth/form-field";
import { Panel } from "@/components/dashboard/panel";
import { DemoBanner } from "@/components/gym/demo-banner";
import {
  DataTable,
  FilterField,
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
import { formatNumber } from "@/lib/dashboard/format";
import { todayISO } from "@/lib/gym/dates";
import { formatDate } from "@/lib/gym/format";
import { buildClientRows, type ClientRow } from "@/lib/gym/selectors";
import { useGym } from "@/lib/gym/store";
import type { ClientStatus } from "@/lib/gym/types";
import { clientSchema, type ClientFormValues } from "@/lib/schemas/gym";

const copy = gymContent.clients;
const { common } = gymContent;

function ClientForm({ done }: { done: () => void }) {
  const { data, addClient } = useGym();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", phone: "", email: "", gender: "male", trainerId: "" },
  });

  const onSubmit = handleSubmit((values) => {
    addClient({ ...values, trainerId: values.trainerId || null });
    done();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <FormField id="client-name" label={copy.form.name} error={errors.name?.message}>
        <Input
          {...register("name")}
          {...fieldA11y("client-name", errors.name?.message)}
          autoComplete="off"
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="client-phone" label={copy.form.phone} error={errors.phone?.message}>
          <Input
            {...register("phone")}
            {...fieldA11y("client-phone", errors.phone?.message)}
            type="tel"
            inputMode="numeric"
            maxLength={10}
          />
        </FormField>
        <FormField id="client-gender" label={copy.form.gender}>
          <NativeSelect {...register("gender")} id="client-gender">
            {Object.entries(gymContent.genders).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <FormField id="client-email" label={copy.form.email} error={errors.email?.message}>
        <Input
          {...register("email")}
          {...fieldA11y("client-email", errors.email?.message)}
          type="email"
        />
      </FormField>
      <FormField id="client-trainer" label={copy.form.trainer}>
        <NativeSelect {...register("trainerId")} id="client-trainer">
          <option value="">{common.noTrainer}</option>
          {data.trainers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      <FormActions submit={copy.form.submit} onCancel={done} />
    </form>
  );
}

const columns: Column<ClientRow>[] = [
  {
    id: "client",
    header: copy.columns.client,
    cell: (c) => <Person name={c.name} subtitle={c.email || undefined} />,
  },
  {
    id: "phone",
    header: copy.columns.phone,
    cell: (c) => <span className="font-mono">{c.phone}</span>,
  },
  { id: "plan", header: copy.columns.plan, cell: (c) => c.plan?.name ?? common.noPlan },
  {
    id: "expires",
    header: copy.columns.expires,
    cell: (c) => (
      <span className="font-mono">{c.membership ? formatDate(c.membership.endDate) : "—"}</span>
    ),
  },
  {
    id: "trainer",
    header: copy.columns.trainer,
    cell: (c) => <span className="text-muted">{c.trainer?.name ?? common.noTrainer}</span>,
  },
  { id: "status", header: copy.columns.status, cell: (c) => <StatusPill status={c.status} /> },
];

export function ClientsView() {
  const { ready, data } = useGym();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ClientStatus | "all">("all");
  const [trainerId, setTrainerId] = useState("all");

  const rows = useMemo(() => buildClientRows(data, todayISO()), [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (trainerId === "all" ||
          (trainerId === "none" ? !r.trainerId : r.trainerId === trainerId)) &&
        (!q || [r.name, r.phone, r.email].some((v) => v.toLowerCase().includes(q))),
    );
  }, [rows, query, status, trainerId]);

  if (!ready) return <LoadingState />;

  const count = (s: ClientStatus) => rows.filter((r) => r.status === s).length;

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          <FormDialog label={copy.add} title={copy.form.title} description={copy.form.description}>
            {(done) => <ClientForm done={done} />}
          </FormDialog>
        }
      />
      <DemoBanner />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={copy.stats.total} value={formatNumber(rows.length)} />
        <StatTile label={copy.stats.active} value={formatNumber(count("active"))} />
        <StatTile label={copy.stats.due} value={formatNumber(count("due"))} />
        <StatTile label={copy.stats.expired} value={formatNumber(count("expired"))} />
      </div>

      <Panel title={copy.title}>
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <SearchField value={query} onChange={setQuery} placeholder={copy.searchPlaceholder} />
          <FilterField label={copy.statusFilter}>
            <NativeSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as ClientStatus | "all")}
              className="h-11"
            >
              <option value="all">{common.all}</option>
              {(["active", "due", "expired", "none"] as const).map((s) => (
                <option key={s} value={s}>
                  {gymContent.statusLabels[s]}
                </option>
              ))}
            </NativeSelect>
          </FilterField>
          <FilterField label={copy.trainerFilter}>
            <NativeSelect
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              className="h-11"
            >
              <option value="all">{common.all}</option>
              <option value="none">{common.noTrainer}</option>
              {data.trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </NativeSelect>
          </FilterField>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          getKey={(c) => c.id}
          empty={rows.length === 0 ? copy.empty : common.noResults}
        />
      </Panel>
    </div>
  );
}
