"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { salvarExperiencia, type ExperienciaState } from "./actions";

// Ícones aceitos pelo <ActivityIcon /> — o admin escolhe num select.
const ICON_OPTIONS = [
  "yoga",
  "spa",
  "makeup",
  "wine",
  "camera",
  "gift",
  "chat",
  "coffee",
  "heart",
  "basket",
] as const;

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "principal", label: "Anfitriã principal" },
  { value: "co-anfitria", label: "Co-anfitriã" },
  { value: "professora-yoga", label: "Professora de yoga" },
  { value: "palestrante", label: "Palestrante" },
];

export type EventFormData = {
  id?: string;
  slug?: string | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  category?: string | null;
  cat_tag?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  duration?: string | null;
  is_recurring?: boolean | null;
  recurrence_rule?: string | null;
  location_name?: string | null;
  location_short?: string | null;
  location_address?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  price_cents?: number | null;
  capacity?: number | null;
  image_url?: string | null;
  host_summary?: string | null;
  host_photo_url?: string | null;
  tag?: string | null;
  tag_style?: string | null;
  is_featured?: boolean | null;
  status?: string | null;
};

export type ActivityRow = {
  icon?: string | null;
  name?: string | null;
  duration?: string | null;
};

export type HostRow = {
  host_id?: string | null;
  name?: string | null;
  role?: string | null;
  bio?: string | null;
  instagram?: string | null;
  photo_url?: string | null;
};

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="admin-btn approve exp-submit" disabled={pending}>
      {pending
        ? "Salvando…"
        : editing
          ? "Salvar alterações"
          : "Criar experiência"}
    </button>
  );
}

export function EventForm({
  event,
  activities: initialActivities,
  hosts: initialHosts,
}: {
  event?: EventFormData;
  activities?: ActivityRow[];
  hosts?: HostRow[];
}) {
  const editing = !!event?.id;
  const [state, formAction] = useActionState<ExperienciaState, FormData>(
    salvarExperiencia,
    {},
  );

  const [activities, setActivities] = useState<ActivityRow[]>(
    initialActivities && initialActivities.length > 0 ? initialActivities : [],
  );
  const [hosts, setHosts] = useState<HostRow[]>(
    initialHosts && initialHosts.length > 0 ? initialHosts : [],
  );

  const priceDefault =
    event?.price_cents != null ? String(event.price_cents / 100) : "";

  return (
    <form action={formAction} className="exp-form">
      {editing && <input type="hidden" name="id" value={event!.id} />}

      {/* ---- Foto principal ---- */}
      <section className="admin-card">
        <div className="admin-card-title">Foto de capa</div>
        {event?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image_url} alt="capa atual" className="exp-preview" />
        )}
        <input type="hidden" name="image_url" defaultValue={event?.image_url ?? ""} />
        <label className="coupon-field coupon-field-wide">
          <span>{event?.image_url ? "Trocar foto" : "Enviar foto"}</span>
          <input type="file" name="image" accept="image/*" />
        </label>
      </section>

      {/* ---- Conteúdo ---- */}
      <section className="admin-card">
        <div className="admin-card-title">Conteúdo</div>
        <div className="coupon-form-grid">
          <label className="coupon-field coupon-field-wide">
            <span>Título *</span>
            <input name="title" defaultValue={event?.title ?? ""} required placeholder="Wellness Day" />
          </label>

          <label className="coupon-field coupon-field-wide">
            <span>Subtítulo</span>
            <input
              name="subtitle"
              defaultValue={event?.subtitle ?? ""}
              placeholder="Um dia de autocuidado no Batel"
            />
          </label>

          <label className="coupon-field coupon-field-wide">
            <span>Descrição</span>
            <textarea
              name="description"
              defaultValue={event?.description ?? ""}
              rows={5}
              placeholder="Detalhes da experiência, o que esperar, para quem é…"
            />
          </label>

          <label className="coupon-field">
            <span>Categoria</span>
            <input
              name="category"
              defaultValue={event?.category ?? ""}
              placeholder="Yoga · Premium"
            />
          </label>

          <label className="coupon-field">
            <span>Tag da categoria (card)</span>
            <input
              name="cat_tag"
              defaultValue={event?.cat_tag ?? ""}
              placeholder="Yoga Premium"
            />
          </label>

          <label className="coupon-field">
            <span>Slug (URL)</span>
            <input
              name="slug"
              defaultValue={event?.slug ?? ""}
              placeholder="gera do título"
              autoComplete="off"
            />
          </label>

          <label className="coupon-field">
            <span>Status</span>
            <select name="status" defaultValue={event?.status ?? "draft"}>
              <option value="draft">Rascunho (não aparece)</option>
              <option value="published">Publicado (à venda)</option>
              <option value="cancelled">Cancelado</option>
              <option value="completed">Concluído</option>
            </select>
          </label>
        </div>
      </section>

      {/* ---- Data e local ---- */}
      <section className="admin-card">
        <div className="admin-card-title">Quando e onde</div>
        <div className="coupon-form-grid">
          <label className="coupon-field">
            <span>Data *</span>
            <input
              type="date"
              name="event_date"
              defaultValue={event?.event_date ?? ""}
              required
            />
          </label>

          <label className="coupon-field">
            <span>Horário</span>
            <input
              name="event_time"
              defaultValue={event?.event_time ?? ""}
              placeholder="19h às 22h"
            />
          </label>

          <label className="coupon-field">
            <span>Duração</span>
            <input
              name="duration"
              defaultValue={event?.duration ?? ""}
              placeholder="3h"
            />
          </label>

          <label className="coupon-field">
            <span>Recorrência (regra)</span>
            <input
              name="recurrence_rule"
              defaultValue={event?.recurrence_rule ?? ""}
              placeholder="weekly:thursday"
            />
          </label>

          <label className="coupon-field exp-check coupon-field-wide">
            <input
              type="checkbox"
              name="is_recurring"
              defaultChecked={!!event?.is_recurring}
            />
            <span>Evento recorrente</span>
          </label>

          <label className="coupon-field coupon-field-wide">
            <span>Nome do local *</span>
            <input
              name="location_name"
              defaultValue={event?.location_name ?? ""}
              required
              placeholder="Studio ONCÈ"
            />
          </label>

          <label className="coupon-field">
            <span>Bairro (curto)</span>
            <input
              name="location_short"
              defaultValue={event?.location_short ?? ""}
              placeholder="Batel"
            />
          </label>

          <label className="coupon-field">
            <span>Endereço completo</span>
            <input
              name="location_address"
              defaultValue={event?.location_address ?? ""}
              placeholder="Rua X, 123 · 80000-000"
            />
          </label>

          <label className="coupon-field">
            <span>Latitude</span>
            <input
              name="location_lat"
              defaultValue={event?.location_lat ?? ""}
              placeholder="-25.4372"
            />
          </label>

          <label className="coupon-field">
            <span>Longitude</span>
            <input
              name="location_lng"
              defaultValue={event?.location_lng ?? ""}
              placeholder="-49.2712"
            />
          </label>
        </div>
      </section>

      {/* ---- Negócio ---- */}
      <section className="admin-card">
        <div className="admin-card-title">Vagas e preço</div>
        <div className="coupon-form-grid">
          <label className="coupon-field">
            <span>Preço (R$) *</span>
            <input
              name="price"
              type="number"
              min="0"
              step="any"
              defaultValue={priceDefault}
              required
              placeholder="179"
            />
          </label>

          <label className="coupon-field">
            <span>Vagas *</span>
            <input
              name="capacity"
              type="number"
              min="1"
              step="1"
              defaultValue={event?.capacity ?? ""}
              required
              placeholder="18"
            />
          </label>

          <label className="coupon-field">
            <span>Tag de destaque</span>
            <input
              name="tag"
              defaultValue={event?.tag ?? ""}
              placeholder="Destaque · Vagas limitadas"
            />
          </label>

          <label className="coupon-field">
            <span>Estilo da tag</span>
            <select name="tag_style" defaultValue={event?.tag_style ?? "accent"}>
              <option value="accent">Accent</option>
              <option value="primary">Primary</option>
            </select>
          </label>

          <label className="coupon-field exp-check coupon-field-wide">
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={!!event?.is_featured}
            />
            <span>Destaque na home</span>
          </label>
        </div>
      </section>

      {/* ---- O que tá incluso (atividades) ---- */}
      <section className="admin-card">
        <div className="admin-card-title">O que tá incluso</div>
        <input type="hidden" name="activities_count" value={activities.length} />
        {activities.length === 0 && (
          <p className="exp-empty">Nenhuma atividade adicionada.</p>
        )}
        <div className="exp-rows">
          {activities.map((a, i) => (
            <div key={i} className="exp-row">
              <div className="coupon-form-grid">
                <label className="coupon-field">
                  <span>Ícone</span>
                  <select name={`act_icon_${i}`} defaultValue={a.icon ?? "spa"}>
                    {ICON_OPTIONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="coupon-field">
                  <span>Duração</span>
                  <input
                    name={`act_duration_${i}`}
                    defaultValue={a.duration ?? ""}
                    placeholder="45min"
                  />
                </label>
                <label className="coupon-field coupon-field-wide">
                  <span>Nome *</span>
                  <input
                    name={`act_name_${i}`}
                    defaultValue={a.name ?? ""}
                    placeholder="Aula de yoga"
                  />
                </label>
              </div>
              <button
                type="button"
                className="exp-remove"
                onClick={() =>
                  setActivities((prev) => prev.filter((_, idx) => idx !== i))
                }
              >
                Remover
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="admin-btn exp-add"
          onClick={() =>
            setActivities((prev) => [...prev, { icon: "spa", name: "", duration: "" }])
          }
        >
          + Adicionar atividade
        </button>
      </section>

      {/* ---- Organizadores ---- */}
      <section className="admin-card">
        <div className="admin-card-title">Organizadores</div>

        <div className="coupon-form-grid exp-host-summary">
          <label className="coupon-field coupon-field-wide">
            <span>Resumo do grupo (opcional)</span>
            <input
              name="host_summary"
              defaultValue={event?.host_summary ?? ""}
              placeholder="Estética + makeup profissional"
            />
          </label>
          {event?.host_photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.host_photo_url}
              alt="foto do grupo"
              className="exp-preview exp-preview-sm"
            />
          )}
          <input
            type="hidden"
            name="host_photo_url"
            defaultValue={event?.host_photo_url ?? ""}
          />
          <label className="coupon-field coupon-field-wide">
            <span>Foto do grupo (opcional)</span>
            <input type="file" name="host_photo" accept="image/*" />
          </label>
        </div>

        <div className="exp-divider" />

        <input type="hidden" name="hosts_count" value={hosts.length} />
        {hosts.length === 0 && (
          <p className="exp-empty">Nenhum organizador individual adicionado.</p>
        )}
        <div className="exp-rows">
          {hosts.map((h, i) => (
            <div key={i} className="exp-row">
              {h.host_id && (
                <input type="hidden" name={`host_id_${i}`} value={h.host_id} />
              )}
              {h.photo_url && (
                <input
                  type="hidden"
                  name={`host_photo_url_${i}`}
                  defaultValue={h.photo_url}
                />
              )}
              <div className="coupon-form-grid">
                {h.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={h.photo_url}
                    alt={h.name ?? "organizador"}
                    className="exp-preview exp-preview-sm"
                  />
                )}
                <label className="coupon-field">
                  <span>Nome *</span>
                  <input
                    name={`host_name_${i}`}
                    defaultValue={h.name ?? ""}
                    placeholder="Nicole Benato"
                  />
                </label>
                <label className="coupon-field">
                  <span>Papel</span>
                  <select
                    name={`host_role_${i}`}
                    defaultValue={h.role ?? "principal"}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="coupon-field">
                  <span>Instagram</span>
                  <input
                    name={`host_instagram_${i}`}
                    defaultValue={h.instagram ?? ""}
                    placeholder="@nicolebenato"
                  />
                </label>
                <label className="coupon-field">
                  <span>{h.photo_url ? "Trocar foto" : "Foto"}</span>
                  <input type="file" name={`host_photo_${i}`} accept="image/*" />
                </label>
                <label className="coupon-field coupon-field-wide">
                  <span>Bio</span>
                  <textarea
                    name={`host_bio_${i}`}
                    defaultValue={h.bio ?? ""}
                    rows={2}
                    placeholder="Quem é, o que faz…"
                  />
                </label>
              </div>
              <button
                type="button"
                className="exp-remove"
                onClick={() =>
                  setHosts((prev) => prev.filter((_, idx) => idx !== i))
                }
              >
                Remover
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="admin-btn exp-add"
          onClick={() =>
            setHosts((prev) => [
              ...prev,
              { name: "", role: "principal", bio: "", instagram: "" },
            ])
          }
        >
          + Adicionar organizador
        </button>
      </section>

      {state.error && <p className="exp-error">{state.error}</p>}

      <SubmitButton editing={editing} />
      <div className="h-12" />
    </form>
  );
}
