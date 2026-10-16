"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { FormField, fieldA11y } from "@/components/auth/form-field";
import { EmptyState } from "@/components/dashboard/panel";
import { DemoBanner } from "@/components/gym/demo-banner";
import {
  Avatar,
  FormActions,
  FormDialog,
  LoadingState,
  PageHeader,
  SearchField,
} from "@/components/gym/shared";
import { Input } from "@/components/ui/input";
import { gymContent } from "@/content/gym";
import { dateOf, lastDays, todayISO } from "@/lib/gym/dates";
import { formatDate } from "@/lib/gym/format";
import { useGym } from "@/lib/gym/store";
import { trainerSchema, type TrainerFormValues } from "@/lib/schemas/gym";
import { fill } from "@/lib/utils";

const copy = gymContent.trainers;

function TrainerForm({ done }: { done: () => void }) {
  const { addTrainer } = useGym();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrainerFormValues>({
    resolver: zodResolver(trainerSchema),
    defaultValues: { name: "", specialty: "", phone: "", email: "" },
  });

  const onSubmit = handleSubmit((values) => {
    addTrainer(values);
    done();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <FormField id="trainer-name" label={copy.form.name} error={errors.name?.message}>
        <Input
          {...register("name")}
          {...fieldA11y("trainer-name", errors.name?.message)}
          autoComplete="off"
        />
      </FormField>
      <FormField
        id="trainer-specialty"
        label={copy.form.specialty}
        error={errors.specialty?.message}
      >
        <Input
          {...register("specialty")}
          {...fieldA11y("trainer-specialty", errors.specialty?.message)}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="trainer-phone" label={copy.form.phone} error={errors.phone?.message}>
          <Input
            {...register("phone")}
            {...fieldA11y("trainer-phone", errors.phone?.message)}
            type="tel"
            inputMode="numeric"
            maxLength={10}
          />
        </FormField>
        <FormField id="trainer-email" label={copy.form.email} error={errors.email?.message}>
          <Input
            {...register("email")}
            {...fieldA11y("trainer-email", errors.email?.message)}
            type="email"
          />
        </FormField>
      </div>
      <FormActions submit={copy.form.submit} onCancel={done} />
    </form>
  );
}

export function TrainersView() {
  const { ready, data } = useGym();
  const [query, setQuery] = useState("");

  const cards = useMemo(() => {
    const today = todayISO();
    const week = new Set(lastDays(7, today));
    return data.trainers.map((trainer) => {
      const clients = data.clients.filter((c) => c.trainerId === trainer.id);
      const ids = new Set(clients.map((c) => c.id));
      const checkIns = data.attendance.filter(
        (a) => ids.has(a.clientId) && week.has(dateOf(a.checkedInAt)),
      ).length;
      return { trainer, clients, checkIns };
    });
  }, [data]);

  if (!ready) return <LoadingState />;

  const q = query.trim().toLowerCase();
  const visible = cards.filter(
    ({ trainer }) =>
      !q || [trainer.name, trainer.specialty].some((v) => v.toLowerCase().includes(q)),
  );

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          <FormDialog label={copy.add} title={copy.form.title} description={copy.form.description}>
            {(done) => <TrainerForm done={done} />}
          </FormDialog>
        }
      />
      <DemoBanner />

      <div className="flex">
        <SearchField value={query} onChange={setQuery} placeholder={copy.searchPlaceholder} />
      </div>

      {visible.length === 0 ? (
        <EmptyState>{cards.length === 0 ? copy.empty : gymContent.common.noResults}</EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ trainer, clients, checkIns }) => (
            <li key={trainer.id}>
              <article className="h-full rounded-3xl border border-border bg-surface p-5 md:p-6">
                <div className="flex items-center gap-4">
                  <Avatar name={trainer.name} className="size-12 bg-primary text-iron" />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold">{trainer.name}</h2>
                    <p className="truncate text-sm text-muted">{trainer.specialty}</p>
                  </div>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3">
                  <div className="flex flex-col-reverse rounded-2xl bg-bg/60 p-3">
                    <dt className="text-xs text-muted">{copy.clientsLabel}</dt>
                    <dd className="font-mono text-2xl font-bold">{clients.length}</dd>
                  </div>
                  <div className="flex flex-col-reverse rounded-2xl bg-bg/60 p-3">
                    <dt className="text-xs text-muted">{copy.checkInsLabel}</dt>
                    <dd className="font-mono text-2xl font-bold">{checkIns}</dd>
                  </div>
                </dl>

                <p className="mt-5 text-sm text-muted">
                  {clients.length === 0
                    ? copy.noClients
                    : clients
                        .slice(0, 3)
                        .map((c) => c.name)
                        .join(", ") + (clients.length > 3 ? ` +${clients.length - 3}` : "")}
                </p>

                <ul className="mt-5 grid gap-2 border-t border-border pt-4 text-sm">
                  <li className="flex items-center gap-2 font-mono text-xs">
                    <Phone className="size-4 text-muted" aria-hidden="true" />
                    {trainer.phone}
                  </li>
                  {trainer.email && (
                    <li className="flex min-w-0 items-center gap-2 text-xs">
                      <Mail className="size-4 shrink-0 text-muted" aria-hidden="true" />
                      <span className="truncate">{trainer.email}</span>
                    </li>
                  )}
                  <li className="text-xs text-muted">
                    {fill(copy.joined, { date: formatDate(trainer.joinedOn) })}
                  </li>
                </ul>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
