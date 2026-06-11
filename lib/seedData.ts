import { Project, Proposal, Contact, Lead, ActivityEntry } from '../types';

// ---------------------------------------------------------------------------
// Demo workspace seed — a believable snapshot of a working AI consulting
// agency in June 2026. Everything resets to this via "Reset Demo".
// ---------------------------------------------------------------------------

export const SEED_CONTACTS: Contact[] = [
  {
    id: 'contact-1',
    name: 'Dana Whitfield',
    title: 'COO',
    company: 'Meridian Logistics',
    email: 'dana.whitfield@meridianlogistics.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=dana-whitfield',
    lastTouch: '2026-06-08',
    notes: 'Drowning in freight paperwork. Strong budget authority. Prefers concrete ROI numbers over tech talk.',
  },
  {
    id: 'contact-2',
    name: 'Marcus Bell',
    title: 'Founder & CEO',
    company: 'TechStart Inc',
    email: 'marcus@techstart.io',
    avatarUrl: 'https://i.pravatar.cc/150?u=marcus-bell',
    lastTouch: '2026-06-05',
    notes: 'Active mobile app engagement. Fast decision maker, responds best to short emails.',
  },
  {
    id: 'contact-3',
    name: 'Priya Raman',
    title: 'VP Customer Experience',
    company: 'Solace Health',
    email: 'p.raman@solacehealth.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=priya-raman',
    lastTouch: '2026-05-28',
    notes: 'Evaluating AI intake automation. HIPAA sensitivity is the key objection to pre-empt.',
  },
  {
    id: 'contact-4',
    name: 'Tom Okafor',
    title: 'Head of Ecommerce',
    company: 'RetailGiant',
    email: 'tom.okafor@retailgiant.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=tom-okafor',
    lastTouch: '2026-04-12',
    notes: 'Past client (SEO audit, paid). Warm relationship — good upsell candidate for product feed AI.',
  },
];

export const SEED_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'AI Support Copilot Rollout',
    client: 'Solace Health',
    status: 'In-Progress',
    completionPercentage: 45,
    value: 42000,
    breadcrumbs: [
      { label: 'Client Projects', href: '#' },
      { label: 'AI Support Copilot Rollout', href: '#' },
    ],
    assignees: [
      { name: 'Achmad Hakim', avatarUrl: 'https://i.pravatar.cc/150?u=achmad' },
      { name: 'Samantha Emanuel', avatarUrl: 'https://i.pravatar.cc/150?u=samantha' },
    ],
    dateRange: { start: 'May 12, 2026', end: 'Jul 24, 2026' },
    tags: [
      { label: 'AI/LLM', variant: 'destructive' },
      { label: 'Healthcare', variant: 'secondary' },
    ],
    description:
      'Deploy a HIPAA-conscious AI support copilot that drafts responses for Solace Health\'s patient-experience team. Phase 1 covers intake triage and FAQ deflection; Phase 2 adds EHR-aware context retrieval. Target: cut first-response time from 9 hours to under 30 minutes.',
    attachments: [
      { id: 'att-1', name: 'Solace_Discovery_Notes.pdf', size: '2.1 Mb', type: 'pdf', isUserUploaded: false, dateAdded: '2026-05-12' },
      { id: 'att-2', name: 'Intake_Flow_Architecture.fig', size: '8.7 Mb', type: 'figma', isUserUploaded: false, dateAdded: '2026-05-19' },
    ],
    subTasks: [
      { id: 1, task: 'Discovery workshop with CX leadership', category: 'Discovery', status: 'Completed', dueDate: 'May 14, 2026', dependsOn: [] },
      { id: 2, task: 'Audit historical ticket corpus (12k tickets)', category: 'Discovery', status: 'Completed', dueDate: 'May 21, 2026', dependsOn: [1] },
      { id: 3, task: 'Build retrieval index over policy docs', category: 'Engineering', status: 'In Progress', dueDate: 'Jun 12, 2026', dependsOn: [2] },
      { id: 4, task: 'Draft-response copilot UI in Zendesk sidebar', category: 'Engineering', status: 'In Progress', dueDate: 'Jun 19, 2026', dependsOn: [2] },
      { id: 5, task: 'PHI redaction + audit logging review', category: 'Compliance', status: 'Pending', dueDate: 'Jun 26, 2026', dependsOn: [3, 4] },
      { id: 6, task: 'Pilot with 5 agents, measure deflection rate', category: 'Rollout', status: 'Pending', dueDate: 'Jul 10, 2026', dependsOn: [5] },
    ],
  },
  {
    id: 'proj-2',
    title: 'Mobile App AI Features',
    client: 'TechStart Inc',
    status: 'Kickoff',
    completionPercentage: 0,
    value: 25000,
    breadcrumbs: [
      { label: 'Client Projects', href: '#' },
      { label: 'Mobile App AI Features', href: '#' },
    ],
    assignees: [{ name: 'Achmad Hakim', avatarUrl: 'https://i.pravatar.cc/150?u=achmad' }],
    dateRange: { start: 'Jun 15, 2026', end: 'Sep 4, 2026' },
    tags: [{ label: 'Mobile', variant: 'default' }, { label: 'AI/LLM', variant: 'destructive' }],
    description:
      'Add an in-app AI assistant and smart onboarding to TechStart\'s mobile product: conversational setup, semantic search over user content, and weekly AI-generated usage digests to drive retention.',
    attachments: [],
    subTasks: [
      { id: 1, task: 'Kickoff call + success metrics alignment', category: 'Discovery', status: 'Pending', dueDate: 'Jun 16, 2026', dependsOn: [] },
    ],
  },
  {
    id: 'proj-3',
    title: 'Product Feed Intelligence Audit',
    client: 'RetailGiant',
    status: 'Paid',
    completionPercentage: 100,
    value: 8500,
    breadcrumbs: [
      { label: 'Client Projects', href: '#' },
      { label: 'Product Feed Intelligence Audit', href: '#' },
    ],
    assignees: [{ name: 'Samantha Emanuel', avatarUrl: 'https://i.pravatar.cc/150?u=samantha' }],
    dateRange: { start: 'Mar 2, 2026', end: 'Mar 27, 2026' },
    tags: [{ label: 'Ecommerce', variant: 'secondary' }],
    description:
      'Audited RetailGiant\'s 40k-SKU product catalog for AI-readiness: enrichment gaps, embedding-based duplicate detection, and a roadmap for AI-generated product descriptions. Delivered and paid.',
    attachments: [
      { id: 'inv-1', name: 'Invoice_RG_Audit.pdf', size: '14 KB', type: 'invoice', isUserUploaded: false, dateAdded: '2026-03-27' },
    ],
    subTasks: [
      { id: 1, task: 'Catalog data quality analysis', category: 'Analysis', status: 'Completed', dueDate: 'Mar 10, 2026', dependsOn: [] },
      { id: 2, task: 'Duplicate detection POC', category: 'Engineering', status: 'Completed', dueDate: 'Mar 18, 2026', dependsOn: [1] },
      { id: 3, task: 'Deliver findings + roadmap deck', category: 'Delivery', status: 'Completed', dueDate: 'Mar 26, 2026', dependsOn: [2] },
    ],
  },
];

export const SEED_PROPOSALS: Proposal[] = [
  {
    id: 'prop-1',
    client: 'Solace Health',
    title: 'Phase 2: EHR-Aware Context Retrieval',
    status: 'In Review',
    value: 38000,
    dateRange: { start: '2026-08-03', end: 'TBD' },
    createdAt: '2026-06-02T16:20:00.000Z',
    notes: 'Expansion of the support copilot: surface relevant EHR context (appointments, care plans) inside agent drafts. Priya wants board sign-off; security review is the gating item.',
    description:
      'Extend the live support copilot with EHR-aware retrieval so agent drafts include appointment history and care-plan context — projected to lift full-resolution rate from 38% to 65%.',
    painPoints: [
      'Agents tab-switch between Zendesk and the EHR on every ticket',
      'Copilot drafts are generic without patient context',
      'Compliance team needs a full audit trail for any PHI access',
    ],
    solution:
      '## Executive Summary\nPhase 1 proved the copilot can deflect FAQ volume. Phase 2 connects it to the EHR (FHIR API) behind a strict consent and audit layer, so drafts arrive with real patient context.\n\n## Proposed Solution\n- FHIR-based retrieval service with per-request purpose-of-use logging\n- Context ranker that selects only minimally-necessary fields\n- Inline citation chips so agents see *why* the copilot suggested each fact\n\n## Strategic Value\nFewer escalations, faster resolution, and a defensible compliance posture that turns AI from a risk conversation into an audit advantage.',
    architectureMermaid: 'graph TD\n  A[Zendesk Sidebar] --> B[Copilot API]\n  B --> C[Context Ranker]\n  C --> D[FHIR Retrieval Service]\n  D --> E[(EHR)]\n  B --> F[Audit Log]\n  C --> G[Gemini Draft Engine]\n  G --> A',
    sowContent:
      '# Statement of Work — Phase 2: EHR-Aware Context Retrieval\n\n**Client:** Solace Health  \n**Fixed Bid:** $38,000 · **Duration:** 8 weeks from Aug 3, 2026\n\n## Milestones\n| Milestone | Week | Deliverable |\n| --- | --- | --- |\n| FHIR retrieval service | 1–3 | Read-only service w/ purpose-of-use logging |\n| Context ranking + redaction | 3–5 | Minimal-necessary field selection |\n| Sidebar integration | 5–7 | Citation chips in agent drafts |\n| Security review + pilot | 7–8 | Audit sign-off, 10-agent pilot |\n\n## Client Responsibilities\n- FHIR sandbox access by week 1\n- Security review scheduled by week 5\n- Pilot agent availability in week 8\n\n## Acceptance\nPilot shows ≥20% lift in full-resolution rate over Phase 1 baseline.',
    documents: [
      { id: 'doc-1', name: 'Proposal_Overview.md', size: '12 KB', type: 'other', dateAdded: '2026-06-02' },
      { id: 'doc-2', name: 'Statement_of_Work.md', size: '9 KB', type: 'other', dateAdded: '2026-06-02' },
    ],
    signed: false,
    paid: false,
    intel: {
      healthScore: 71,
      label: 'Healthy',
      risks: ['Security review not yet scheduled — single gating dependency', 'Board meets only monthly; missing the June window slips close by 4+ weeks'],
      nextAction: 'Email Priya today proposing two concrete security-review slots before the June 18 board meeting.',
      analyzedAt: '2026-06-08T09:00:00.000Z',
    },
  },
  {
    id: 'prop-2',
    client: 'Nordwind Travel',
    title: 'AI Itinerary Concierge MVP',
    status: 'Sent',
    value: 29500,
    dateRange: { start: '2026-07-06', end: 'TBD' },
    createdAt: '2026-05-18T11:00:00.000Z',
    notes: 'Boutique travel agency. Wants a concierge that turns a 20-minute intake call into a draft itinerary. Champion (ops lead) is enthusiastic but CEO has gone quiet since May 26.',
    description:
      'An AI concierge that converts intake-call transcripts into bookable draft itineraries with live pricing — cutting itinerary turnaround from 3 days to same-day.',
    painPoints: [
      'Senior planners spend 60% of their week on first-draft itineraries',
      'Slow turnaround loses ~1 in 5 prospects to faster competitors',
      'Institutional knowledge lives in two planners\' heads',
    ],
    solution:
      '## Executive Summary\nNordwind\'s differentiator is taste, not typing speed. The concierge drafts; planners curate.\n\n## Proposed Solution\n- Transcript → structured trip-brief extraction\n- Itinerary engine grounded on Nordwind\'s past 400 trips\n- Planner review UI with one-click amendments\n\n## Strategic Value\nSame-day proposals at boutique quality — the speed of an OTA with the taste of a human planner.',
    architectureMermaid: 'graph TD\n  A[Intake Call Recording] --> B[Transcript Extraction]\n  B --> C[Trip Brief]\n  C --> D[Itinerary Engine]\n  E[(Past Trips Index)] --> D\n  D --> F[Planner Review UI]\n  F --> G[Client-Ready Itinerary]',
    sowContent:
      '# Statement of Work — AI Itinerary Concierge MVP\n\n**Client:** Nordwind Travel  \n**Fixed Bid:** $29,500 · **Duration:** 6 weeks from Jul 6, 2026\n\n## Milestones\n| Milestone | Week | Deliverable |\n| --- | --- | --- |\n| Trip-brief extraction | 1–2 | Transcript → structured brief |\n| Itinerary engine | 2–4 | Grounded on 400 past trips |\n| Planner review UI | 4–6 | One-click amendment workflow |\n\n## Client Responsibilities\n- Historical trip data export by week 1\n- Two planners for weekly feedback sessions\n\n## Acceptance\nPlanners rate ≥70% of drafts as "usable with minor edits."',
    documents: [
      { id: 'doc-1', name: 'Proposal_Overview.md', size: '11 KB', type: 'other', dateAdded: '2026-05-18' },
      { id: 'doc-2', name: 'Statement_of_Work.md', size: '8 KB', type: 'other', dateAdded: '2026-05-18' },
    ],
    signed: false,
    paid: false,
    intel: {
      healthScore: 34,
      label: 'At Risk',
      risks: ['No response from decision-maker in 14 days', 'Champion is enthusiastic but lacks budget authority', 'Proposal sent before pricing was validated against their season'],
      nextAction: 'Send a low-pressure value-recap to the CEO with one concrete itinerary example from their own past-trip data.',
      analyzedAt: '2026-06-08T09:00:00.000Z',
    },
  },
];

export const SEED_LEADS: Lead[] = [
  {
    id: 'lead-1',
    fromName: 'Dana Whitfield',
    fromEmail: 'dana.whitfield@meridianlogistics.com',
    company: 'Meridian Logistics',
    subject: 'AI for freight document processing — referred by Tom Okafor',
    body: `Hi,

Tom Okafor at RetailGiant said you were the team that actually ships AI instead of slideware, so here I am.

We're a 200-truck regional freight carrier. Every shipment generates a pile of paper — bills of lading, rate confirmations, PODs, lumper receipts. My ops team manually keys data from roughly 1,400 documents a week into our TMS. It costs us about 3 FTEs and we still eat chargebacks from keying errors (last quarter: $38k).

I want to know if AI document extraction is actually reliable enough for this in 2026, what a realistic pilot looks like, and what it costs. We have budget allocated this quarter if the numbers work.

Can we set up a call this week?

Dana Whitfield
COO, Meridian Logistics`,
    receivedAt: '2026-06-09T13:05:00.000Z',
    status: 'new',
  },
  {
    id: 'lead-2',
    fromName: 'Elena Vasquez',
    fromEmail: 'elena@brightsmiledental.group',
    company: 'BrightSmile Dental Group',
    subject: 'Missed calls = missed patients. Can AI answer our phones?',
    body: `Hello,

I manage operations for a group of 6 dental practices. Our front desks miss about 30% of inbound calls during peak hours, and every missed call is potentially a $600+ new-patient appointment going to the practice down the street.

I keep reading about AI receptionists. Honestly I'm skeptical — our patients skew older and will hang up on anything that feels robotic. But the math on missed calls is painful enough that I have to look into it.

What would you recommend? Is this something you build?

Elena Vasquez
Director of Operations, BrightSmile Dental Group`,
    receivedAt: '2026-06-09T08:47:00.000Z',
    status: 'new',
  },
  {
    id: 'lead-3',
    fromName: 'Greg Tanner',
    fromEmail: 'gtanner@tannerlawfirm.com',
    company: 'Tanner & Associates',
    subject: 'Quick question about AI contract review',
    body: `Hi there,

Small law firm here (4 attorneys). We spend a lot of paralegal hours on first-pass review of commercial leases. A friend mentioned AI tools for this but the off-the-shelf ones we tried hallucinated clause references, which for us is disqualifying.

Is custom-built different? Not in a rush, just exploring. No budget approved yet — would need to make the case to the partners.

Greg`,
    receivedAt: '2026-06-08T19:22:00.000Z',
    status: 'new',
  },
  {
    id: 'lead-4',
    fromName: 'Ray Calloway',
    fromEmail: 'ray.calloway@synergyboost.biz',
    company: 'SynergyBoost Media',
    subject: 'Partnership opportunity 🚀 (guaranteed 10x leads)',
    body: `Hey!!

We help agencies EXPLODE their pipeline with our proprietary lead-gen system. Guaranteed 10x qualified leads in 90 days or you don't pay. We just need a quick 15 min call to show you the system.

When works for you? Slots are filling FAST.

Ray
Growth Partner, SynergyBoost Media`,
    receivedAt: '2026-06-08T15:10:00.000Z',
    status: 'new',
  },
];

export const SAMPLE_TRANSCRIPT = `Call: NATIVE <> Meridian Logistics — Discovery
Date: June 9, 2026 · Attendees: Dana Whitfield (COO), Jake Morrow (Ops Manager), NATIVE team

Dana: So like I said in my email, the document problem is the one keeping me up at night. 1,400 docs a week, three people keying them in, and we still got hit for $38k in chargebacks last quarter from errors.

NATIVE: What document types drive most of the volume?

Jake: Bills of lading are maybe 60%. Then rate cons, PODs, lumper receipts. The BOLs are the worst — every shipper formats them differently. Half are photos taken in a truck cab at night.

NATIVE: That's actually the typical case for modern vision models. We'd want a two-week data audit first — you give us 500 representative docs, we measure extraction accuracy before anyone commits to a build.

Dana: I like that. What accuracy is realistic?

NATIVE: On BOLs like you're describing, 95%+ field-level with a human-review queue for low-confidence fields. The win isn't removing humans, it's that your team reviews exceptions instead of keying everything.

Dana: Okay. Budget-wise we set aside $60k for this quarter. If the audit looks good I'd want the pilot running before peak season — that's mid-August for us.

Jake: One concern — our TMS is McLeod. Integration has burned us before.

NATIVE: Noted. We'd scope the McLeod API integration during the audit. Worst case we land structured data in a staging table your team already uses.

Dana: Fair. Next steps?

NATIVE: We'll send a proposal for the audit phase this week — fixed fee, two weeks. Then a go/no-go on the pilot with real accuracy numbers in hand.

Dana: Send it Thursday at the latest. If the numbers hold I want to move fast.`;

export const SEED_ACTIVITY: ActivityEntry[] = [
  {
    id: 'act-1',
    timestamp: '2026-06-08T09:00:00.000Z',
    actor: 'ai',
    kind: 'deal',
    message: 'Analyzed pipeline health: flagged "AI Itinerary Concierge MVP" (Nordwind Travel) as At Risk — 14 days of silence from decision-maker.',
  },
  {
    id: 'act-2',
    timestamp: '2026-06-05T14:30:00.000Z',
    actor: 'user',
    kind: 'project',
    message: 'Updated task "Build retrieval index over policy docs" to In Progress on AI Support Copilot Rollout.',
  },
  {
    id: 'act-3',
    timestamp: '2026-06-02T16:20:00.000Z',
    actor: 'ai',
    kind: 'proposal',
    message: 'Generated Phase 2 proposal for Solace Health: research, pitch, SOW (passed audit on 2nd revision), and architecture diagram.',
  },
];
