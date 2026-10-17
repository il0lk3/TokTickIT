--
-- PostgreSQL database dump
--

\restrict GhipWB12xO8KOkBHgXcPjemPejafGgDHBhGivROmVpc3nyDVwH0nLfINb9Gqhd2

-- Dumped from database version 18.6 (Postgres.app)
-- Dumped by pg_dump version 18.6 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'REQUESTER',
    'IT_STAFF',
    'ADMINISTRATOR'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: TicketPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public."TicketPriority" OWNER TO postgres;

--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'New',
    'In Progress',
    'Resolved',
    'Open',
    'Waiting for Requester',
    'Closed',
    'Reopened',
    'Cancelled'
);


ALTER TYPE public."TicketStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Attachment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Attachment" (
    id integer NOT NULL,
    "originalName" text NOT NULL,
    filename text NOT NULL,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    "isRemoved" boolean DEFAULT false NOT NULL,
    "removedReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ticketId" integer NOT NULL
);


ALTER TABLE public."Attachment" OWNER TO postgres;

--
-- Name: Attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Attachment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Attachment_id_seq" OWNER TO postgres;

--
-- Name: Attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Attachment_id_seq" OWNED BY public."Attachment".id;


--
-- Name: Category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Category" (
    id integer NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Category" OWNER TO postgres;

--
-- Name: Category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Category_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Category_id_seq" OWNER TO postgres;

--
-- Name: Category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Category_id_seq" OWNED BY public."Category".id;


--
-- Name: InternalNote; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InternalNote" (
    id integer NOT NULL,
    content character varying(1000) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "authorId" integer NOT NULL,
    "ticketId" integer NOT NULL
);


ALTER TABLE public."InternalNote" OWNER TO postgres;

--
-- Name: InternalNote_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."InternalNote_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."InternalNote_id_seq" OWNER TO postgres;

--
-- Name: InternalNote_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."InternalNote_id_seq" OWNED BY public."InternalNote".id;


--
-- Name: PublicComment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PublicComment" (
    id integer NOT NULL,
    content character varying(1000) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "authorId" integer NOT NULL,
    "ticketId" integer NOT NULL
);


ALTER TABLE public."PublicComment" OWNER TO postgres;

--
-- Name: PublicComment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PublicComment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PublicComment_id_seq" OWNER TO postgres;

--
-- Name: PublicComment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PublicComment_id_seq" OWNED BY public."PublicComment".id;


--
-- Name: RelatedSystem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RelatedSystem" (
    id integer NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RelatedSystem" OWNER TO postgres;

--
-- Name: RelatedSystem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."RelatedSystem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RelatedSystem_id_seq" OWNER TO postgres;

--
-- Name: RelatedSystem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."RelatedSystem_id_seq" OWNED BY public."RelatedSystem".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id integer CONSTRAINT "RequesterUser_id_not_null" NOT NULL,
    name text CONSTRAINT "RequesterUser_name_not_null" NOT NULL,
    email text CONSTRAINT "RequesterUser_email_not_null" NOT NULL,
    "isActive" boolean DEFAULT true CONSTRAINT "RequesterUser_isActive_not_null" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT "RequesterUser_createdAt_not_null" NOT NULL,
    "passwordHash" text NOT NULL,
    role public."Role" DEFAULT 'REQUESTER'::public."Role" NOT NULL,
    "requiresPasswordChange" boolean DEFAULT true NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: RequesterUser_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."RequesterUser_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RequesterUser_id_seq" OWNER TO postgres;

--
-- Name: RequesterUser_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."RequesterUser_id_seq" OWNED BY public."User".id;


--
-- Name: Ticket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Ticket" (
    id integer NOT NULL,
    "ticketNumber" text NOT NULL,
    summary character varying(150) NOT NULL,
    description character varying(1000) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "requesterId" integer NOT NULL,
    "categoryId" integer NOT NULL,
    "relatedSystemId" integer NOT NULL,
    "requestedPriority" public."TicketPriority" NOT NULL,
    "currentStatus" public."TicketStatus" DEFAULT 'New'::public."TicketStatus" NOT NULL,
    "itPriority" public."TicketPriority" DEFAULT 'LOW'::public."TicketPriority" NOT NULL,
    "ownerId" integer,
    "appearsResolved" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Ticket" OWNER TO postgres;

--
-- Name: Ticket_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Ticket_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Ticket_id_seq" OWNER TO postgres;

--
-- Name: Ticket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Ticket_id_seq" OWNED BY public."Ticket".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: Attachment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attachment" ALTER COLUMN id SET DEFAULT nextval('public."Attachment_id_seq"'::regclass);


--
-- Name: Category id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category" ALTER COLUMN id SET DEFAULT nextval('public."Category_id_seq"'::regclass);


--
-- Name: InternalNote id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InternalNote" ALTER COLUMN id SET DEFAULT nextval('public."InternalNote_id_seq"'::regclass);


--
-- Name: PublicComment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PublicComment" ALTER COLUMN id SET DEFAULT nextval('public."PublicComment_id_seq"'::regclass);


--
-- Name: RelatedSystem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RelatedSystem" ALTER COLUMN id SET DEFAULT nextval('public."RelatedSystem_id_seq"'::regclass);


--
-- Name: Ticket id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket" ALTER COLUMN id SET DEFAULT nextval('public."Ticket_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."RequesterUser_id_seq"'::regclass);


--
-- Data for Name: Attachment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Attachment" (id, "originalName", filename, "mimeType", size, "isRemoved", "removedReason", "createdAt", "ticketId") FROM stdin;
1	test-evidence.png	1790974967607-753888243.png	image/png	64099	f	\N	2026-10-02 21:02:47.617	4
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Category" (id, name, "createdAt") FROM stdin;
1	Account and Access	2026-10-02 16:16:48.356
2	Hardware	2026-10-02 16:16:48.361
3	Software	2026-10-02 16:16:48.362
4	Network	2026-10-02 16:16:48.363
\.


--
-- Data for Name: InternalNote; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InternalNote" (id, content, "createdAt", "authorId", "ticketId") FROM stdin;
1	Needs new toner.	2026-10-02 16:16:48.453	11	1
2	Test Internal Notes	2026-10-02 22:36:36.596	14	4
\.


--
-- Data for Name: PublicComment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PublicComment" (id, content, "createdAt", "authorId", "ticketId") FROM stdin;
1	I am looking into this.	2026-10-02 16:16:48.451	11	1
2	Test Public Comments	2026-10-02 22:35:07.382	14	4
4	The problem appears to resolved.	2026-10-02 22:49:47.985	1	4
\.


--
-- Data for Name: RelatedSystem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RelatedSystem" (id, name, "createdAt") FROM stdin;
1	Email	2026-10-02 16:16:48.364
2	Campus Wi-Fi	2026-10-02 16:16:48.365
3	VPN	2026-10-02 16:16:48.366
4	LEB2 App	2026-10-02 16:16:48.366
5	Grade Submission App	2026-10-02 16:16:48.367
6	Printer	2026-10-02 16:16:48.367
7	Corporate Laptop	2026-10-02 16:16:48.368
8	Student Registration	2026-10-02 16:16:48.368
9	Library Portal	2026-10-02 16:16:48.369
\.


--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Ticket" (id, "ticketNumber", summary, description, "createdAt", "updatedAt", "requesterId", "categoryId", "relatedSystemId", "requestedPriority", "currentStatus", "itPriority", "ownerId", "appearsResolved") FROM stdin;
1	TKT-2026-000001	Printer not working	The printer in the main office is jammed.	2026-10-02 16:16:48.448	2026-10-02 16:16:48.448	1	2	6	MEDIUM	In Progress	MEDIUM	11	f
2	TKT-2026-000002	Email sync issue	Emails are not syncing on my phone.	2026-10-02 16:16:48.454	2026-10-02 16:16:48.454	10	3	1	HIGH	New	LOW	\N	f
4	TKT-2026-000058	E2E Screenshot Capture Ticket	Test description	2026-09-05 01:24:24.571	2026-10-02 22:45:06.457	1	1	1	MEDIUM	Open	HIGH	14	t
3	TKT-2026-000003	Need a new mouse	My mouse is broken.	2026-10-02 16:16:48.456	2026-10-02 23:45:25.749	1	2	6	LOW	Closed	LOW	11	f
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, "isActive", "createdAt", "passwordHash", role, "requiresPasswordChange", "updatedAt") FROM stdin;
4	Je Su	je.su@example.com	t	2026-10-02 16:16:48.441	$2b$10$XxamVb0/pAOld8fDzrmZ5Oft1tph3q43N01/Oja0KmdRO2lqWyLJ6	REQUESTER	t	2026-10-02 16:16:48.441
5	Bewnoi Su	bewnoi.su@example.com	t	2026-10-02 16:16:48.442	$2b$10$XxamVb0/pAOld8fDzrmZ5Oft1tph3q43N01/Oja0KmdRO2lqWyLJ6	REQUESTER	t	2026-10-02 16:16:48.442
6	Grace Su	grace.su@example.com	t	2026-10-02 16:16:48.442	$2b$10$XxamVb0/pAOld8fDzrmZ5Oft1tph3q43N01/Oja0KmdRO2lqWyLJ6	REQUESTER	t	2026-10-02 16:16:48.442
7	Phrao Su	phrao.su@example.com	t	2026-10-02 16:16:48.443	$2b$10$XxamVb0/pAOld8fDzrmZ5Oft1tph3q43N01/Oja0KmdRO2lqWyLJ6	REQUESTER	t	2026-10-02 16:16:48.443
9	Inactive TestUser	inactive.user@example.com	f	2026-10-02 16:16:48.444	$2b$10$XxamVb0/pAOld8fDzrmZ5Oft1tph3q43N01/Oja0KmdRO2lqWyLJ6	REQUESTER	t	2026-10-02 16:16:48.444
10	E2E Requester	e2e.requester@example.com	t	2026-10-02 16:16:48.444	$2b$10$XxamVb0/pAOld8fDzrmZ5Oft1tph3q43N01/Oja0KmdRO2lqWyLJ6	REQUESTER	f	2026-10-02 16:16:48.444
11	IT Staff 1	staff1@example.com	t	2026-10-02 16:16:48.444	$2b$10$XxamVb0/pAOld8fDzrmZ5Oft1tph3q43N01/Oja0KmdRO2lqWyLJ6	IT_STAFF	t	2026-10-02 16:16:48.444
12	IT Staff 2	staff2@example.com	t	2026-10-02 16:16:48.445	$2b$10$XxamVb0/pAOld8fDzrmZ5Oft1tph3q43N01/Oja0KmdRO2lqWyLJ6	IT_STAFF	t	2026-10-02 16:16:48.445
13	IT Staff 3	staff3@example.com	t	2026-10-02 16:16:48.445	$2b$10$XxamVb0/pAOld8fDzrmZ5Oft1tph3q43N01/Oja0KmdRO2lqWyLJ6	IT_STAFF	t	2026-10-02 16:16:48.445
14	E2E Staff	e2e.staff@example.com	t	2026-10-02 16:16:48.445	$2b$10$XxamVb0/pAOld8fDzrmZ5Oft1tph3q43N01/Oja0KmdRO2lqWyLJ6	IT_STAFF	f	2026-10-02 16:16:48.445
15	Inactive Staff	inactive.staff@example.com	f	2026-10-02 16:16:48.445	$2b$10$XxamVb0/pAOld8fDzrmZ5Oft1tph3q43N01/Oja0KmdRO2lqWyLJ6	IT_STAFF	t	2026-10-02 16:16:48.445
8	Pueng Su	pueng.su@example.com	t	2026-10-02 16:16:48.443	$2b$10$XxamVb0/pAOld8fDzrmZ5Oft1tph3q43N01/Oja0KmdRO2lqWyLJ6	REQUESTER	t	2026-10-04 12:35:59.012
3	Kanta Su	kanta.su@example.com	t	2026-10-02 16:16:48.438	$2b$10$XxamVb0/pAOld8fDzrmZ5Oft1tph3q43N01/Oja0KmdRO2lqWyLJ6	REQUESTER	f	2026-10-16 17:19:20.245
16	System Admin	admin@example.com	t	2026-10-02 16:16:48.446	$2b$10$81pLYB.jkbRdzfLNXGToSefnbvAQNvSWbpq1UgssJN7ASBqfsP32S	ADMINISTRATOR	f	2026-10-16 17:19:17.604
17	E2E Admin	e2e.admin@example.com	t	2026-10-02 16:16:48.446	$2b$10$XxamVb0/pAOld8fDzrmZ5Oft1tph3q43N01/Oja0KmdRO2lqWyLJ6	ADMINISTRATOR	f	2026-10-16 17:19:17.604
20	Karn Su	karn.su@example.com	f	2026-10-04 12:27:09.516	$2b$10$OWAjLUA9.oehhMB13gYcy.MqHGZBf/zjpE1cB4CtrM4fzdtMqjs5u	ADMINISTRATOR	f	2026-10-04 14:09:24.552
1	Cream Su	cream.su@example.com	t	2026-10-02 16:16:48.435	$2b$10$7s9ApWUiBximqwrGH0cfquSsY6HCu3rryidq3kq1cCKecogwFdm5G	REQUESTER	f	2026-10-16 17:19:19.176
2	Bew Su	bew.su@example.com	t	2026-10-02 16:16:48.437	$2b$10$RMyvtELc62eSAOdg5YTTOum.HnF3Yq3HDqCsWQFUIPaD3d73iUvDK	REQUESTER	f	2026-10-16 17:19:19.176
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
7422c03d-8377-4ec1-a1ff-bea03ad4248d	dc8643a639fc77f6a7faef34f12d6d4ab8370feecc7fb31aebb74f38c43c3608	2026-10-02 23:16:47.257944+07	20260812132528_init	\N	\N	2026-10-02 23:16:47.253889+07	1
2fba2c02-bfa1-420f-9057-77f1d55a7cc1	3257742ad666525d7ae99cfa9e0d1ff728535fd642f85e0a8d2720130e1c2199	2026-10-02 23:16:47.26723+07	20260901135637_init_lab2	\N	\N	2026-10-02 23:16:47.258328+07	1
b29983e9-c0bc-49d7-8af4-bc3b04b932dd	5376553f84311bc724d5e1bf371907e0a45e0a67673091c13eb34b6e1f8a0755	2026-10-02 23:16:47.271714+07	20260901141118_add_indexes_and_enums	\N	\N	2026-10-02 23:16:47.267586+07	1
e81a44aa-6b47-4687-bf57-c32e42798447	7d85e50c0ca65f43466ef698a52279ee1f0bbeabcbf0b70c8eb86bef6ce0c486	2026-10-02 23:16:47.279041+07	20260917204150_lab3_user_migration	\N	\N	2026-10-02 23:16:47.272065+07	1
098cc52f-8e13-4fa8-9e60-3574848956f7	bfc899f78f41f6ba66f2627d65f141dec992e696d1a4ded99b8fba8572b464b6	2026-10-02 23:16:47.280224+07	20260918063340_add_appears_resolved	\N	\N	2026-10-02 23:16:47.279423+07	1
\.


--
-- Name: Attachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Attachment_id_seq"', 3, true);


--
-- Name: Category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Category_id_seq"', 4, true);


--
-- Name: InternalNote_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."InternalNote_id_seq"', 3, true);


--
-- Name: PublicComment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PublicComment_id_seq"', 7, true);


--
-- Name: RelatedSystem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."RelatedSystem_id_seq"', 9, true);


--
-- Name: RequesterUser_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."RequesterUser_id_seq"', 47, true);


--
-- Name: Ticket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Ticket_id_seq"', 20, true);


--
-- Name: Attachment Attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attachment"
    ADD CONSTRAINT "Attachment_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: InternalNote InternalNote_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InternalNote"
    ADD CONSTRAINT "InternalNote_pkey" PRIMARY KEY (id);


--
-- Name: PublicComment PublicComment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PublicComment"
    ADD CONSTRAINT "PublicComment_pkey" PRIMARY KEY (id);


--
-- Name: RelatedSystem RelatedSystem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RelatedSystem"
    ADD CONSTRAINT "RelatedSystem_pkey" PRIMARY KEY (id);


--
-- Name: Ticket Ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Attachment_filename_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Attachment_filename_key" ON public."Attachment" USING btree (filename);


--
-- Name: Attachment_ticketId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attachment_ticketId_idx" ON public."Attachment" USING btree ("ticketId");


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: InternalNote_authorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "InternalNote_authorId_idx" ON public."InternalNote" USING btree ("authorId");


--
-- Name: InternalNote_ticketId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "InternalNote_ticketId_idx" ON public."InternalNote" USING btree ("ticketId");


--
-- Name: PublicComment_authorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PublicComment_authorId_idx" ON public."PublicComment" USING btree ("authorId");


--
-- Name: PublicComment_ticketId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PublicComment_ticketId_idx" ON public."PublicComment" USING btree ("ticketId");


--
-- Name: RelatedSystem_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RelatedSystem_name_key" ON public."RelatedSystem" USING btree (name);


--
-- Name: Ticket_categoryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_categoryId_idx" ON public."Ticket" USING btree ("categoryId");


--
-- Name: Ticket_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_createdAt_idx" ON public."Ticket" USING btree ("createdAt");


--
-- Name: Ticket_ownerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_ownerId_idx" ON public."Ticket" USING btree ("ownerId");


--
-- Name: Ticket_relatedSystemId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_relatedSystemId_idx" ON public."Ticket" USING btree ("relatedSystemId");


--
-- Name: Ticket_requesterId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_requesterId_idx" ON public."Ticket" USING btree ("requesterId");


--
-- Name: Ticket_ticketNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON public."Ticket" USING btree ("ticketNumber");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Attachment Attachment_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attachment"
    ADD CONSTRAINT "Attachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InternalNote InternalNote_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InternalNote"
    ADD CONSTRAINT "InternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InternalNote InternalNote_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InternalNote"
    ADD CONSTRAINT "InternalNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PublicComment PublicComment_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PublicComment"
    ADD CONSTRAINT "PublicComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PublicComment PublicComment_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PublicComment"
    ADD CONSTRAINT "PublicComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Ticket Ticket_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Ticket Ticket_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_relatedSystemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_relatedSystemId_fkey" FOREIGN KEY ("relatedSystemId") REFERENCES public."RelatedSystem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Ticket Ticket_requesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict GhipWB12xO8KOkBHgXcPjemPejafGgDHBhGivROmVpc3nyDVwH0nLfINb9Gqhd2

