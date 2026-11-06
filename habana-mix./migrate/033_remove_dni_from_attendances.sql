-- 033_remove_dni_from_attendances.sql
-- Eliminar campo DNI de la tabla attendances (reemplazado por confirmación de email)

-- Verificar si la columna existe antes de eliminarla
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendances' 
    AND column_name = 'dni'
  ) THEN
    ALTER TABLE public.attendances DROP COLUMN IF EXISTS dni;
  END IF;
END$$;

-- Verificar si la columna existe en payment_attempts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_attempts' 
    AND column_name = 'dni'
  ) THEN
    ALTER TABLE public.payment_attempts DROP COLUMN IF EXISTS dni;
  END IF;
END$$;

-- Verificar si la columna existe en payment_orders
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_orders' 
    AND column_name = 'dni'
  ) THEN
    ALTER TABLE public.payment_orders DROP COLUMN IF EXISTS dni;
  END IF;
END$$;