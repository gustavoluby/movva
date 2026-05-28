-- ============================================================
-- going_count: contar por RESERVA confirmada, não por pagamento
-- ============================================================
-- Decisão de produto (2026-05-28): a vaga é segurada assim que a
-- pessoa confirma a reserva, mesmo com pagamento pendente — afinal
-- o pagamento (Pix) ainda é confirmado manualmente. Antes a trigger
-- só contava quando payment_status virava 'paid', então going_count
-- nunca refletia as reservas reais e a "turma" aparecia travada.
--
-- Agora going_count segue o `status` da reserva ('confirmed' = vaga
-- ocupada; 'cancelled'/'no-show' liberam a vaga). Sem backfill: os
-- valores de seed continuam como base social e as reservas reais
-- somam/subtraem em cima.

create or replace function update_event_going_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.status = 'confirmed' then
      update events set going_count = going_count + 1 where id = NEW.event_id;
    end if;
  elsif TG_OP = 'UPDATE' then
    if OLD.status != 'confirmed' and NEW.status = 'confirmed' then
      update events set going_count = going_count + 1 where id = NEW.event_id;
    elsif OLD.status = 'confirmed' and NEW.status != 'confirmed' then
      update events set going_count = going_count - 1 where id = NEW.event_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.status = 'confirmed' then
      update events set going_count = going_count - 1 where id = OLD.event_id;
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

-- A trigger trg_bookings_update_event_count já existe e aponta pra
-- esta função; recriar a função basta.
