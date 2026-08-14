-- ============================================================================
-- HABANA MIX — Datos iniciales (mismos que se muestran hoy en la web)
-- Ejecutar DESPUÉS de 001_habana_mix_schema.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- EVENTOS
-- ----------------------------------------------------------------------------
insert into public.events
  (slug, title, subtitle, description, image_url, starts_at, location,
   price_label, cta_label, theme, layout, tags, featured, overlay_opacity, sort_order)
values
  ('noche-cubana-timba-en-vivo',
   'Noche Cubana',
   'Timba en vivo + DJ hasta la madrugada',
   'La fiesta más caliente del mes. Orquesta en vivo, clase gratuita de rueda de casino a las 21:00 y DJ hasta las 3 AM. Ambiente 100% habanero.',
   '/images/event-noche-cubana.png',
   now() + interval '9 days', 'Salón principal — Habana Mix',
   'Entrada $20 · Alumnos gratis', 'Reservar lugar',
   'amber', 'overlay', array['Timba en vivo','Clase gratis 21:00','Cupos limitados'],
   true, 62, 1),

  ('bachata-sensual-social',
   'Bachata Social',
   'Noche sensual con los mejores DJs',
   'Tres horas de bachata dominicana y sensual. Piso amplio, luces cálidas y una comunidad increíble para bailar toda la noche.',
   '/images/event-bachata-social.png',
   now() + interval '17 days', 'Sala Malecón — Habana Mix',
   'Entrada $15', 'Quiero ir',
   'coral', 'split', array['Bachata','Social','+18'],
   false, 55, 2),

  ('workshop-internacional-rueda',
   'Workshop Internacional',
   'Rueda de Casino con maestros de La Habana',
   'Fin de semana intensivo con instructores invitados directamente desde Cuba. Dos días, cuatro módulos, certificado de participación.',
   '/images/event-workshop.png',
   now() + interval '31 days', 'Habana Mix — Todas las salas',
   'Pack 2 días $60', 'Ver programa',
   'teal', 'split', array['2 días','Maestros invitados','Certificado'],
   false, 50, 3)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- CLASES
-- ----------------------------------------------------------------------------
insert into public.classes
  (slug, title, style, level, description, image_url, instructor, schedule,
   duration_min, price_amount, price_currency, price_period, capacity, spots_left,
   theme, layout, tags, featured, overlay_opacity, sort_order)
values
  ('salsa-cubana-principiantes',
   'Salsa Cubana',
   'Salsa cubana / Casino', 'principiante',
   'Desde cero: paso básico, dile que no, vacílala y tu primera rueda. En un mes ya bailás en cualquier fiesta.',
   '/images/class-salsa.png', 'Yoandri & Camila',
   array['Lunes 19:00','Jueves 20:30'], 60, 45, 'USD', 'mes', 24, 7,
   'amber', 'split', array['Sin pareja necesaria','Desde cero'], true, 55, 1),

  ('bachata-sensual-intermedio',
   'Bachata Sensual',
   'Bachata', 'intermedio',
   'Musicalidad, ondas corporales y conexión en pareja. Para quienes ya dominan el básico y quieren fluir.',
   '/images/class-bachata.png', 'Dayana Pérez',
   array['Martes 20:00','Sábado 12:00'], 75, 50, 'USD', 'mes', 20, 4,
   'coral', 'split', array['Musicalidad','Trabajo en pareja'], false, 55, 2),

  ('timba-ladies-style',
   'Timba & Ladies Style',
   'Timba', 'todos',
   'Sabor, actitud y despelote cubano. Técnica de cuerpo, giros y presencia en la pista.',
   '/images/event-noche-cubana.png', 'Camila Rojas',
   array['Miércoles 19:30'], 60, 35, 'USD', 'mes', 18, 9,
   'teal', 'split', array['Ladies style','Técnica corporal'], false, 55, 3),

  ('rueda-de-casino-avanzado',
   'Rueda de Casino',
   'Rueda de Casino', 'avanzado',
   'Más de 40 figuras cantadas, cambios rápidos y coreografía grupal. El sello de Habana Mix.',
   '/images/event-workshop.png', 'Yoandri Suárez',
   array['Viernes 20:00'], 90, 40, 'USD', 'mes', 30, 12,
   'noche', 'split', array['Grupal','Nivel alto'], false, 55, 4)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- CONTENIDO EDITABLE DEL SITIO
-- ----------------------------------------------------------------------------
insert into public.site_content (key, value) values
('hero', jsonb_build_object(
  'eyebrow', 'Academia de baile cubano',
  'title', 'Habana Mix',
  'tagline', 'Donde el sabor de La Habana se aprende bailando',
  'video_url', '',
  'poster_url', '/images/hero-habana.png',
  'primary_cta', jsonb_build_object('label', 'Ver clases', 'href', '#clases'),
  'secondary_cta', jsonb_build_object('label', 'Próximos eventos', 'href', '#eventos')
)),
('about', jsonb_build_object(
  'eyebrow', 'Quiénes somos',
  'title', 'Un pedacito de Cuba en tu ciudad',
  'image_url', '/images/about-academia.png',
  'paragraphs', jsonb_build_array(
    'Habana Mix nació de una idea simple: que cualquiera pueda sentir el sabor cubano sin importar de dónde venga ni cuánto haya bailado antes.',
    'Nuestros instructores se formaron en La Habana y llevan más de diez años enseñando salsa cubana, timba, bachata y rueda de casino. Acá no se copian pasos: se aprende a escuchar la música.',
    'Más que una academia, somos una comunidad. Se entra por una clase y se queda por la gente.'
  ),
  'stats', jsonb_build_array(
    jsonb_build_object('value', '10+', 'label', 'Años enseñando'),
    jsonb_build_object('value', '1.200', 'label', 'Alumnos felices'),
    jsonb_build_object('value', '4', 'label', 'Estilos cubanos'),
    jsonb_build_object('value', '2', 'label', 'Fiestas al mes')
  )
)),
('location', jsonb_build_object(
  'title', 'Cómo llegar',
  'address', 'Av. del Malecón 1245, Local 3',
  'city', 'Palermo, Buenos Aires',
  'directions_note', 'A dos cuadras de la estación Plaza Italia. Entrada por el pasaje interno, portón amarillo con el mural de la trompeta.',
  'map_embed_url', 'https://www.openstreetmap.org/export/embed.html?bbox=-58.4300%2C-34.5860%2C-58.4130%2C-34.5740&layer=mapnik&marker=-34.5800%2C-58.4215',
  'map_link_url', 'https://www.openstreetmap.org/?mlat=-34.5800&mlon=-58.4215#map=16/-34.5800/-58.4215',
  'phone', '+54 11 5555 1234',
  'whatsapp', '5491155551234',
  'hours', jsonb_build_array(
    jsonb_build_object('label', 'Lunes a viernes', 'value', '17:00 – 23:00'),
    jsonb_build_object('label', 'Sábados', 'value', '11:00 – 20:00'),
    jsonb_build_object('label', 'Domingos', 'value', 'Solo eventos')
  )
)),
('footer', jsonb_build_object(
  'tagline', 'Salsa cubana, timba y bachata con el sabor de La Habana.',
  'instagram', 'https://instagram.com',
  'facebook', 'https://facebook.com',
  'youtube', 'https://youtube.com',
  'email', 'hola@habanamix.com'
))
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ----------------------------------------------------------------------------
-- Convertir tu usuario en admin (reemplazá el email y descomentá)
-- ----------------------------------------------------------------------------
-- update public.profiles set is_admin = true
-- where email = 'tu-email@ejemplo.com';
