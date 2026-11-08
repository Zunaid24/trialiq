import HubPage from "@/components/HubPage";

export default function StudyPage() {
  return <HubPage title="Study" intro="What the protocol asks for, and patterns across all participants." entries={[
    { title: "Protocol requirements", text: "TrialIQ pulls criteria, visits, labs and endpoints out of the protocol PDF.", href: "/dashboard/workspace/protocol" },
    { title: "Visit plan", text: "Visit schedule, windows and checks built from the protocol.", href: "/dashboard/workspace/visit-assistant" },
    { title: "Safety signals", text: "Repeated adverse events or lab patterns across participants, for medical review.", href: "/dashboard/workspace/safety" },
  ]} />;
}
