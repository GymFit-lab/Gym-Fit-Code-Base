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
  StatusPill,
  type Column,
} from "@/components/gym/shared";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { gymContent } from "@/content/gym";
import { addDays, addMonths, todayISO } from "@/lib/gym/dates";
import { formatDate, formatMoney } from "@/lib/gym/format";
import { membershipStatus } from "@/lib/gym/selectors";
import { useGym } from "@/lib/gym/store";
import type { ClientStatus, Membership } from "@/lib/gym/types";
import {
  membershipSchema,
  planSchema,
  type MembershipFormValues,
  type PlanFormValues,
} from "@/lib/schemas/gym";
import { fill } from "@/lib/utils";

const copy = gymContent.memberships;
const { common } = gymContent;

function AssignForm({ done }: { done: () => void }) {
  const { data, addMembership } = useGym();
  const f = copy.assignForm;
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MembershipFormValues>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      clientId: "",
      planId: "",
      startDate: todayISO(),
      paymentStatus: "paid",
      method: "upi",
    },
  });

  const plan = data.plans.find((p) => p.id === watch("planId"));
  const start = watch("startDate");
  const endsOn =
    plan && /^\d{4}-\d{2}-\d{2}$/.test(start)
      ? formatDate(addDays(addMonths(start, plan.durationMonths), -1))
      : null;

  const onSubmit = handleSubmit((values) => {
    addMembership(values);
    done();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <FormField id="ms-client" label={f.client} error={errors.clientId?.message}>
        <NativeSelect
          {...register("clientId")}
          {...fieldA11y("ms-client", errors.clientId?.message)}
        >
          <option value="">{data.clients.length ? f.selectClient : f.noClients}</option>
          {data.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField id="ms-plan" label={f.plan} error={errors.planId?.message}>
        <NativeSelect {...register("planId")} {...fieldA11y("ms-plan", errors.planId?.message)}>
          <option value="">{f.selectPlan}</option>
          {data.plans.map((p) => (
            <option key={p.id} value={p.id}>
              {fill(f.planOption, { plan: p.name, price: formatMoney(p.price) })}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="ms-start" label={f.start} error={errors.startDate?.message}>
          <Input
            {...register("startDate")}
            {...fieldA11y("ms-start", errors.startDate?.message)}
            type="date"
          />
        </FormField>
        <div className="grid content-start gap-2">
          <span className="text-sm font-semibold">{f.ends}</span>
          <p className="flex h-12 items-center font-mono text-sm">{endsOn ?? "—"}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="ms-paystatus" label={f.paymentStatus}>
          <NativeSelect {...register("paymentStatus")} id="ms-paystatus">
            {Object.entries(gymContent.paymentStatuses).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField id="ms-method" label={f.method}>
          <NativeSelect {...register("method")} id="ms-method">
            {Object.entries(gymContent.methods).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <FormActions submit={f.submit} onCancel={done} />
    </form>
  );
}

function PlanForm({ done }: { done: () => void }) {
  const { addPlan } = useGym();
  const f = copy.planForm;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: "", durationMonths: 1, price: undefined },
  });

  const onSubmit = handleSubmit((values) => {
    addPlan(values);
    done();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <FormField id="plan-name" label={f.name} error={errors.name?.message}>
        <Input
          {...register("name")}
          {...fieldA11y("plan-name", errors.name?.message)}
          autoComplete="off"
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="plan-months" label={f.months} error={errors.durationMonths?.message}>
          <Input
            {...register("durationMonths", { valueAsNumber: true })}
            {...fieldA11y("plan-months", errors.durationMonths?.message)}
            type="number"
            inputMode="numeric"
            min={1}
            max={36}
          />
        </FormField>
        <FormField id="plan-price" label={f.price} error={errors.price?.message}>
          <Input
            {...register("price", { valueAsNumber: true })}
            {...fieldA11y("plan-price", errors.price?.message)}
            type="number"
            inputMode="numeric"
            min={1}
          />
        </FormField>
      </div>
      <FormActions submit={f.submit} onCancel={done} />
    </form>
  );
}

type Row = Membership & {
  clientName: string;
  planName: string;
  status: ClientStatus;
};

const columns: Column<Row>[] = [
  { id: "client", header: copy.columns.client, cell: (r) => <Person name={r.clientName} /> },
  { id: "plan", header: copy.columns.plan, cell: (r) => r.planName },
  {
    id: "start",
    header: copy.columns.start,
    cell: (r) => <span className="font-mono">{formatDate(r.startDate)}</span>,
  },
  {
    id: "end",
    header: copy.columns.end,
    cell: (r) => <span className="font-mono">{formatDate(r.endDate)}</span>,
  },
  {
    id: "amount",
    header: copy.columns.amount,
    align: "right",
    cell: (r) => <span className="font-mono">{formatMoney(r.amount)}</span>,
  },
  { id: "status", header: copy.columns.status, cell: (r) => <StatusPill status={r.status} /> },
];

export function MembershipsView() {
  const { ready, data } = useGym();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ClientStatus | "all">("all");
  const [planId, setPlanId] = useState("all");

  const today = todayISO();

  const rows = useMemo<Row[]>(() => {
    const t = todayISO();
    return data.memberships
      .map((m) => ({
        ...m,
        clientName: data.clients.find((c) => c.id === m.clientId)?.name ?? "—",
        planName: data.plans.find((p) => p.id === m.planId)?.name ?? "—",
        status: membershipStatus(m, t) as ClientStatus,
      }))
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [data]);

  if (!ready) return <LoadingState />;

  const q = query.trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      (status === "all" || r.status === status) &&
      (planId === "all" || r.planId === planId) &&
      (!q || r.clientName.toLowerCase().includes(q)),
  );

  const activeOn = (id: string) =>
    data.memberships.filter((m) => m.planId === id && m.startDate <= today && m.endDate >= today)
      .length;

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          <>
            <FormDialog
              label={copy.addPlan}
              variant="outline"
              title={copy.planForm.title}
              description={copy.planForm.description}
            >
              {(done) => <PlanForm done={done} />}
            </FormDialog>
            <FormDialog
              label={copy.assign}
              title={copy.assignForm.title}
              description={copy.assignForm.description}
            >
              {(done) => <AssignForm done={done} />}
            </FormDialog>
          </>
        }
      />
      <DemoBanner />

      <Panel title={copy.plansTitle} description={copy.plansDescription}>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.plans.map((plan) => (
            <li key={plan.id} className="rounded-2xl border border-border bg-bg/60 p-4">
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="mt-2 font-mono text-2xl font-bold">{formatMoney(plan.price)}</p>
              <p className="mt-2 flex justify-between text-xs text-muted">
                <span>{fill(copy.duration, { count: plan.durationMonths })}</span>
                <span>{fill(copy.members, { count: activeOn(plan.id) })}</span>
              </p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title={copy.listTitle} description={copy.listDescription}>
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <SearchField value={query} onChange={setQuery} placeholder={copy.searchPlaceholder} />
          <FilterField label={copy.statusFilter}>
            <NativeSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as ClientStatus | "all")}
              className="h-11"
            >
              <option value="all">{common.all}</option>
              {(["active", "due", "expired"] as const).map((s) => (
                <option key={s} value={s}>
                  {gymContent.statusLabels[s]}
                </option>
              ))}
            </NativeSelect>
          </FilterField>
          <FilterField label={copy.planFilter}>
            <NativeSelect
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="h-11"
            >
              <option value="all">{common.all}</option>
              {data.plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
          </FilterField>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          getKey={(r) => r.id}
          empty={rows.length === 0 ? copy.empty : common.noResults}
        />
      </Panel>
    </div>
  );
}
