-- 025_cleanup_unapproved_paid_attendances.sql
-- La versión anterior creaba attendances antes de confirmar el pago.
-- El flujo nuevo solo crea attendances aprobadas, por lo que se limpian
-- únicamente los registros pagos antiguos que nunca fueron aprobados.

DELETE FROM public.attendances
WHERE is_free IS FALSE
  AND payment_status IN ('pending', 'rejected', 'refunded');
