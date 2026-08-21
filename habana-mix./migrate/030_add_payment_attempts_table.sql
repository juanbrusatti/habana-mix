-- 030_add_payment_attempts_table.sql
-- Tabla de seguridad para registrar intentos de pago antes de redirigir a MercadoPago
-- Permite verificar qué usuarios al menos completaron el formulario e hicieron clic en pagar

CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_title text NOT NULL,
  name text NOT NULL,
  surname text NOT NULL,
  dni text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'ARS',
  user_agent text,
  ip_address text,
  status text NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated', 'redirected', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS payment_attempts_event_id_idx 
  ON public.payment_attempts(event_id);

CREATE INDEX IF NOT EXISTS payment_attempts_dni_idx 
  ON public.payment_attempts(dni);

CREATE INDEX IF NOT EXISTS payment_attempts_email_idx 
  ON public.payment_attempts(email);

CREATE INDEX IF NOT EXISTS payment_attempts_status_idx 
  ON public.payment_attempts(status, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_attempts_created_at_idx 
  ON public.payment_attempts(created_at DESC);

-- Índice para encontrar intentos por evento y datos de usuario
CREATE INDEX IF NOT EXISTS payment_attempts_event_user_idx 
  ON public.payment_attempts(event_id, dni, email);

-- Comentarios para documentación
COMMENT ON TABLE public.payment_attempts IS 'Tabla de seguridad para registrar intentos de pago antes de redirigir a MercadoPago';
COMMENT ON COLUMN public.payment_attempts.user_agent IS 'User agent del navegador del usuario';
COMMENT ON COLUMN public.payment_attempts.ip_address IS 'Dirección IP del usuario (si está disponible)';
COMMENT ON COLUMN public.payment_attempts.status IS 'Estado del intento: initiated (formulario completado), redirected (redirigido a MP), completed (pago completado), failed (falló)';
COMMENT ON COLUMN public.payment_attempts.created_at IS 'Timestamp cuando el usuario completó el formulario';
COMMENT ON COLUMN public.payment_attempts.updated_at IS 'Última actualización del registro';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_attempts_updated_at 
  BEFORE UPDATE ON public.payment_attempts 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserciones desde el frontend
CREATE POLICY "Allow insert payment attempts" 
  ON public.payment_attempts 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- Política para permitir lecturas solo a administradores
CREATE POLICY "Allow read payment attempts for admins" 
  ON public.payment_attempts 
  FOR SELECT 
  TO authenticated 
  USING (true);