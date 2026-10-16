"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
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
  type Column,
} from "@/components/gym/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { gymContent } from "@/content/gym";
import { formatNumber } from "@/lib/dashboard/format";
import { daysBetween, monthOf, todayISO } from "@/lib/gym/dates";
import { formatDate, formatMoney } from "@/lib/gym/format";
import { paidPayments, pendingPayments, sumAmount } from "@/lib/gym/selectors";
import { useGym } from "@/lib/gym/store";
import type { Payment, PaymentMethod, PaymentStatus } from "@/lib/gym/types";
import { paymentSchema, type PaymentFormValues } from "@/lib/schemas/gym";
import { cn, fill } from "@/lib/utils";

const copy = gymContent.payments;
const { common } = gymContent;

function PaymentForm({ done }: { done: () => void }) {
  const { data, addPayment } = useGym();
  const f = copy.form;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      clientId: "",
      amount: undefined,
      method: "upi",
      status: "paid",
      date: todayISO(),
      note: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    addPayment(values);
    done();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <FormField id="pay-client" label={f.client} error={errors.clientId?.message}>
        <NativeSelect
          {...register("clientId")}
          {...fieldA11y("pay-client", errors.clientId?.message)}
        >
          <option value="">{data.clients.length ? f.selectClient : f.noClients}</option>
          {data.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="pay-amount" label={f.amount} error={errors.amount?.message}>
          <Input
            {...register("amount", { valueAsNumber: true })}
            {...fieldA11y("pay-amount", errors.amount?.message)}
            type="number"
            inputMode="numeric"
            min={1}
          />
        </FormField>
        <FormField id="pay-date" label={f.date} error={errors.date?.message}>
          <Input
            {...register("date")}
            {...fieldA11y("pay-date", errors.date?.message)}
            type="date"
          />
        </FormField>
        <FormField id="pay-method" label={f.method}>
          <NativeSelect {...register("method")} id="pay-method">
            {Object.entries(gymContent.methods).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField id="pay-status" label={f.status}>
          <NativeSelect {...register("status")} id="pay-status">
            {Object.entries(gymContent.paymentStatuses).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <FormField id="pay-note" label={f.note} error={errors.note?.message}>
        <Input
          {...register("note")}
          {...fieldA11y("pay-note", errors.note?.message)}
          placeholder={f.notePlaceholder}
          autoComplete="off"
        />
      </FormField>
      <FormActions submit={f.submit} onCancel={done} />
    </form>
  );
}

type Row = Payment & { clientName: string };

export function PaymentsView() {
  const { ready, data, markPaymentPaid } = useGym();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [method, setMethod] = useState<PaymentMethod | "all">("all");

  const today = todayISO();

  const rows = useMemo<Row[]>(
    () =>
      data.payments
        .map((p) => ({
          ...p,
          clientName: data.clients.find((c) => c.id === p.clientId)?.name ?? "—",
        }))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data],
  );

  const columns: Column<Row>[] = useMemo(
    () => [
      {
        id: "date",
        header: copy.columns.date,
        cell: (r) => <span className="font-mono">{formatDate(r.date)}</span>,
      },
      { id: "client", header: copy.columns.client, cell: (r) => <Person name={r.clientName} /> },
      { id: "method", header: copy.columns.method, cell: (r) => gymContent.methods[r.method] },
      {
        id: "note",
        header: copy.columns.note,
        cell: (r) => <span className="text-muted">{r.note || "—"}</span>,
      },
      {
        id: "amount",
        header: copy.columns.amount,
        align: "right",
        cell: (r) => <span className="font-mono">{formatMoney(r.amount)}</span>,
      },
      {
        id: "status",
        header: copy.columns.status,
        cell: (r) => {
          const overdue = r.status === "pending" ? daysBetween(r.date, todayISO()) : 0;
          return (
            <span className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  r.status === "paid"
                    ? "bg-primary/15 text-primary-ink"
                    : "bg-accent/10 text-accent-ink",
                )}
              >
                {gymContent.paymentStatuses[r.status]}
              </span>
              {overdue > 0 && (
                <span className="font-mono text-xs text-muted">
                  {fill(copy.overdue, { days: overdue })}
                </span>
              )}
            </span>
          );
        },
      },
      {
        id: "action",
        header: copy.markPaid,
        align: "right",
        cell: (r) =>
          r.status === "pending" ? (
            <Button
              variant="outline"
              size="sm"
              aria-label={fill(copy.markPaidLabel, { name: r.clientName })}
              onClick={() => markPaymentPaid(r.id)}
            >
              <Check aria-hidden="true" />
              {copy.markPaid}
            </Button>
          ) : null,
      },
    ],
    [markPaymentPaid],
  );

  if (!ready) return <LoadingState />;

  const q = query.trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      (status === "all" || r.status === status) &&
      (method === "all" || r.method === method) &&
      (!q || r.clientName.toLowerCase().includes(q) || r.note.toLowerCase().includes(q)),
  );

  const paid = paidPayments(data.payments);
  const pending = pendingPayments(data.payments);
  const thisMonth = paid.filter((p) => monthOf(p.date) === monthOf(today));

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          <FormDialog label={copy.add} title={copy.form.title} description={copy.form.description}>
            {(done) => <PaymentForm done={done} />}
          </FormDialog>
        }
      />
      <DemoBanner />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={copy.stats.collected} value={formatMoney(sumAmount(thisMonth))} />
        <StatTile label={copy.stats.pending} value={formatMoney(sumAmount(pending))} />
        <StatTile label={copy.stats.pendingCount} value={formatNumber(pending.length)} />
        <StatTile
          label={copy.stats.average}
          value={formatMoney(paid.length ? Math.round(sumAmount(paid) / paid.length) : 0)}
        />
      </div>

      <Panel title={copy.title}>
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <SearchField value={query} onChange={setQuery} placeholder={copy.searchPlaceholder} />
          <FilterField label={copy.statusFilter}>
            <NativeSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentStatus | "all")}
              className="h-11"
            >
              <option value="all">{common.all}</option>
              {Object.entries(gymContent.paymentStatuses).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </NativeSelect>
          </FilterField>
          <FilterField label={copy.methodFilter}>
            <NativeSelect
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod | "all")}
              className="h-11"
            >
              <option value="all">{common.all}</option>
              {Object.entries(gymContent.methods).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
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
