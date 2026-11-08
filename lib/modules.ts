// One registry for every TrialIQ check. Pages, navigation, search and the participant tabs all read from here,
// so a module looks and behaves the same wherever it is opened.

export type ModuleInput = { key: string; label: string; demo: string; demoName: string; kind?: "pdf" | "json" };
export type ModuleDef = {
  id: string;
  title: string;
  area: "participant" | "study" | "data";
  tab?: "eligibility" | "sources" | "visits" | "safety";
  // What the person is trying to get done, in their words.
  job: string;
  // The manual work this check takes off their plate.
  replaces: string;
  // Who signs off on the output.
  signOff: string;
  endpoint: string;
  persistName: string;
  serverPersists?: boolean;
  inputs: ModuleInput[];
  body: (texts: Record<string, string>, names: Record<string, string>) => Record<string, unknown>;
};

const protocol: ModuleInput = { key: "protocol", label: "Protocol", demo: "/demo/protocol-demo.pdf", demoName: "protocol-demo.pdf" };
const participant: ModuleInput = { key: "participant", label: "Participant record", demo: "/demo/participant-demo.pdf", demoName: "participant-demo.pdf" };
const doc = (key: string, label: string, file: string): ModuleInput => ({ key, label, demo: `/demo/${file}`, demoName: file });

export const MODULES: ModuleDef[] = [
  {
    id: "eligibility", title: "Eligibility", area: "participant", tab: "eligibility",
    job: "Decide whether this participant can be enrolled.",
    replaces: "Reading the protocol and the chart side by side, criterion by criterion.",
    signOff: "PI or subinvestigator",
    endpoint: "/api/analyze", persistName: "Eligibility Screening", serverPersists: true,
    inputs: [protocol, participant],
    body: (t) => ({ protocol: t.protocol, participant: t.participant, participantCode: "PT-1042" }),
  },
  {
    id: "patient-matching", title: "Trial fit", area: "participant", tab: "eligibility",
    job: "See which trial characteristics fit this patient before formal screening.",
    replaces: "Pulling diagnosis, stage, biomarkers and prior treatment out of notes by hand.",
    signOff: "Study coordinator",
    endpoint: "/api/patient-matching", persistName: "Patient Matching",
    inputs: [participant],
    body: (t) => ({ patient: t.participant }),
  },
  {
    id: "source-review", title: "Source documents", area: "participant", tab: "sources",
    job: "Know what a source document says and what is missing from it.",
    replaces: "Abstracting facts from scanned notes into the CRF by hand.",
    signOff: "Study coordinator",
    endpoint: "/api/document-review", persistName: "Source Document Review",
    inputs: [participant],
    body: (t, n) => ({ document: t.participant, fileName: n.participant }),
  },
  {
    id: "lab-intelligence", title: "Lab results", area: "participant", tab: "sources",
    job: "Spot lab values outside the reference range.",
    replaces: "Copying each value and range from the lab report and comparing them one by one.",
    signOff: "Investigator",
    endpoint: "/api/lab-intelligence", persistName: "Laboratory Intelligence",
    inputs: [doc("lab", "Lab report", "lab-demo.pdf")],
    body: (t) => ({ document: t.lab }),
  },
  {
    id: "medications", title: "Medications", area: "participant", tab: "sources",
    job: "Check current and recent medicines for protocol concerns.",
    replaces: "Reconciling the medication list against prohibited medicine and washout rules.",
    signOff: "Investigator",
    endpoint: "/api/medications", persistName: "Concomitant Medication Review",
    inputs: [doc("meds", "Medication list", "medication-demo.pdf")],
    body: (t, n) => ({ document: t.meds, fileName: n.meds }),
  },
  {
    id: "visit-assistant", title: "Visit plan", area: "study", tab: "visits",
    job: "Know which assessments are due at each visit and in which window.",
    replaces: "Building the schedule of assessments from the protocol table by hand.",
    signOff: "Study coordinator",
    endpoint: "/api/visit-intelligence", persistName: "Visit Intelligence",
    inputs: [protocol],
    body: (t) => ({ protocol: t.protocol }),
  },
  {
    id: "deviations", title: "Protocol deviations", area: "participant", tab: "visits",
    job: "Catch deviations and document them correctly.",
    replaces: "Checking each visit against the protocol and drafting the deviation log entry.",
    signOff: "CRA or monitor",
    endpoint: "/api/deviations", persistName: "Protocol Deviation Analysis",
    inputs: [protocol, doc("deviation", "Visit record", "deviation-demo.pdf")],
    body: (t) => ({ protocol: t.protocol, participantRecord: t.deviation }),
  },
  {
    id: "adverse-events", title: "Adverse events", area: "participant", tab: "safety",
    job: "Capture an adverse event completely and know what is still missing.",
    replaces: "Filling AE forms from narrative notes and chasing onset, grade and outcome.",
    signOff: "Investigator for causality",
    endpoint: "/api/adverse-events", persistName: "Adverse Event Assessment",
    inputs: [doc("ae", "AE report", "adverse-event-demo.pdf")],
    body: (t, n) => ({ document: t.ae, fileName: n.ae }),
  },
  {
    id: "clinical-intelligence", title: "Participant brief", area: "participant", tab: "safety",
    job: "Get one summary of this participant across every document, with the evidence for each point.",
    replaces: "Reading labs, medications, AE and deviation records together to see how they connect.",
    signOff: "Investigator",
    endpoint: "/api/clinical-intelligence", persistName: "Clinical Intelligence", serverPersists: true,
    inputs: [{ key: "evidence", label: "Evidence pack", demo: "/demo/clinical-intelligence-evidence.json", demoName: "clinical-intelligence-evidence.json", kind: "json" }],
    body: (t) => ({ evidencePack: JSON.parse(t.evidence) }),
  },
  {
    id: "protocol", title: "Protocol requirements", area: "study",
    job: "Turn the protocol into criteria, visits and rules the team can work from.",
    replaces: "Reading a long protocol again and its amendments to find each requirement.",
    signOff: "Study manager",
    endpoint: "/api/protocol", persistName: "Protocol Intelligence",
    inputs: [protocol],
    body: (t) => ({ protocol: t.protocol }),
  },
  {
    id: "safety", title: "Safety signals", area: "study",
    job: "See patterns in safety events before they become a problem.",
    replaces: "Lining up events across visits and participants in a spreadsheet.",
    signOff: "Safety physician",
    endpoint: "/api/safety", persistName: "Safety Signal Detection",
    inputs: [doc("safety", "Safety review", "safety-demo.pdf")],
    body: (t, n) => ({ document: t.safety, fileName: n.safety }),
  },
  {
    id: "reconciliation", title: "Reconciliation", area: "data",
    job: "Find where documents disagree before the monitor does.",
    replaces: "Checking dates and values across lab, medication, AE and deviation records.",
    signOff: "Data manager",
    endpoint: "/api/reconciliation", persistName: "Clinical Data Reconciliation",
    inputs: [doc("laboratory", "Lab report", "lab-demo.pdf"), doc("medications", "Medication list", "medication-demo.pdf"), doc("adverseEvent", "AE report", "adverse-event-demo.pdf"), doc("deviation", "Deviation record", "deviation-demo.pdf")],
    body: (t) => ({ documents: t }),
  },
  {
    id: "medical-coding", title: "Medical coding", area: "data",
    job: "Code verbatim terms consistently.",
    replaces: "Searching dictionaries for each verbatim term and keeping coding consistent.",
    signOff: "Qualified medical coder",
    endpoint: "/api/medical-coding", persistName: "Medical Coding",
    inputs: [doc("coding", "Verbatim terms", "medical-coding-demo.pdf")],
    body: (t, n) => ({ document: t.coding, fileName: n.coding }),
  },
];

export const moduleById = (id: string) => MODULES.find((m) => m.id === id);
export const modulesForTab = (tab: string) => MODULES.filter((m) => m.tab === tab);
export const modulesForArea = (area: ModuleDef["area"]) => MODULES.filter((m) => m.area === area);
