-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.alumni_agri (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  alumni_id bigint UNIQUE,
  keahlian_agri text,
  komoditas_utama text,
  tergabung_kelompok boolean,
  skala_usaha_agri text,
  nilai_tambah_diterapkan text,
  kendala_dihadapi_agri text,
  CONSTRAINT alumni_agri_pkey PRIMARY KEY (id),
  CONSTRAINT alumni_agri_alumni_id_fkey FOREIGN KEY (alumni_id) REFERENCES public.alumni_db(id)
);
CREATE TABLE public.alumni_bisnis (
  id bigint NOT NULL DEFAULT nextval('alumni_bisnis_id_seq'::regclass),
  alumni_id bigint UNIQUE,
  nama_usaha text,
  skala_usaha text,
  keahlian_wirausahaan text,
  produk_layanan_utama text,
  kendala_bisnis text,
  target_pasar text,
  relevant_skills text,
  CONSTRAINT alumni_bisnis_pkey PRIMARY KEY (id),
  CONSTRAINT alumni_bisnis_freelance_alumni_id_fkey FOREIGN KEY (alumni_id) REFERENCES public.alumni_db(id)
);
CREATE TABLE public.alumni_db (
  id bigint NOT NULL,
  email character varying,
  nama_lengkap character varying,
  nama_panggilan character varying,
  tempat_lahir character varying,
  tahun_lahir text,
  kota_domisili character varying,
  alamat_ktp character varying,
  nomor_handphone bigint,
  angkatan bigint,
  jurusan_studi character varying,
  tahun_kelulusan bigint,
  pendidikan_terakhir character varying,
  instagram_link character varying,
  linkedin_link character varying,
  aktivitas character varying,
  skill_gabungan character varying,
  gabungan_data character varying,
  aktivitas_status_durasi jsonb,
  nama_institusi_pendidikan_terakhir text,
  CONSTRAINT alumni_db_pkey PRIMARY KEY (id),
  CONSTRAINT alumni_db_id_fkey FOREIGN KEY (id) REFERENCES public.user(id)
);
CREATE TABLE public.alumni_informal (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  alumni_id bigint UNIQUE,
  keahlian_informal text,
  pengalaman_tim_informal boolean,
  pernah_rekrut_memimpin boolean,
  CONSTRAINT alumni_informal_pkey PRIMARY KEY (id),
  CONSTRAINT alumni_informal_alumni_id_fkey FOREIGN KEY (alumni_id) REFERENCES public.alumni_db(id)
);
CREATE TABLE public.alumni_kreatif (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  alumni_id bigint UNIQUE,
  keahlian_kreatif text,
  platform_digital_utama text,
  jenis_konten text,
  total_jangkauan text,
  kisaran_rate_card text,
  demografi_followers text,
  CONSTRAINT alumni_kreatif_pkey PRIMARY KEY (id),
  CONSTRAINT alumni_kreatif_alumni_id_fkey FOREIGN KEY (alumni_id) REFERENCES public.alumni_db(id)
);
CREATE TABLE public.alumni_mahasiswa (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  alumni_id bigint UNIQUE,
  keahlian_mahasiswa text,
  kegiatan_organisasi_mahasiswa text,
  pengalaman_tim_mahasiswa boolean,
  mencari_pekerjaan_kolaborasi_mahasiswa boolean,
  pengalaman_magang text,
  CONSTRAINT alumni_mahasiswa_pkey PRIMARY KEY (id),
  CONSTRAINT alumni_mahasiswa_alumni_id_fkey FOREIGN KEY (alumni_id) REFERENCES public.alumni_db(id)
);
CREATE TABLE public.alumni_pekerja (
  id bigint NOT NULL DEFAULT nextval('alumni_pekerja_id_seq'::regclass),
  alumni_id bigint UNIQUE,
  nama_instansi text,
  posisi text,
  pengalaman_proyek text,
  akses_jejaring boolean,
  pengalaman_bermitra boolean,
  relevant_skills text,
  CONSTRAINT alumni_pekerja_pkey PRIMARY KEY (id),
  CONSTRAINT alumni_pekerja_alumni_id_fkey FOREIGN KEY (alumni_id) REFERENCES public.alumni_db(id)
);
CREATE TABLE public.alumni_pendidik (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  alumni_id bigint UNIQUE,
  keahlian_pendidik text,
  jenjang_pendidikan text,
  mata_pelajaran text,
  inovasi_pembelajaran text,
  mengajar_bimbel boolean,
  CONSTRAINT alumni_pendidik_pkey PRIMARY KEY (id),
  CONSTRAINT alumni_pendidik_alumni_id_fkey FOREIGN KEY (alumni_id) REFERENCES public.alumni_db(id)
);
CREATE TABLE public.alumni_rumah_tangga (
  id bigint NOT NULL DEFAULT nextval('alumni_rumah_tangga_id_seq'::regclass),
  alumni_id bigint,
  keahlian_irt text,
  kegiatan_organisasi_irt text,
  pengalaman_tim_irt boolean,
  mencari_pekerjaan_kolaborasi_irt boolean,
  relevant_skills text,
  CONSTRAINT alumni_rumah_tangga_pkey PRIMARY KEY (id),
  CONSTRAINT alumni_rumah_tangga_alumni_id_fkey FOREIGN KEY (alumni_id) REFERENCES public.alumni_db(id)
);
CREATE TABLE public.alumni_sosial (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  alumni_id bigint UNIQUE,
  nama_organisasi text,
  isu_fokus text,
  keahlian_sosial text,
  pengalaman_proyek_sosial text,
  pengalaman_bermitra_sosial boolean,
  CONSTRAINT alumni_sosial_pkey PRIMARY KEY (id),
  CONSTRAINT alumni_sosial_alumni_id_fkey FOREIGN KEY (alumni_id) REFERENCES public.alumni_db(id)
);
CREATE TABLE public.project_applications (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  CONSTRAINT project_applications_pkey PRIMARY KEY (id),
  CONSTRAINT project_applications_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text NOT NULL,
  required_skills ARRAY,
  status text NOT NULL DEFAULT 'open'::text,
  owner_id bigint NOT NULL,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.alumni_db(id)
);
CREATE TABLE public.user (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  email text UNIQUE,
  password_hash character varying,
  username text UNIQUE,
  role text NOT NULL DEFAULT 'alumni'::text,
  last_login timestamp with time zone,
  CONSTRAINT user_pkey PRIMARY KEY (id)
);