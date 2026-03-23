import SectionPlaceholder from "../_components/SectionPlaceholder";

export default function EnquiriesPage() {
  return (
    <SectionPlaceholder
      eyebrow="Enquiries"
      title="Buyer enquiries"
      description="Review new buyer conversations, prioritize hot leads, and keep response time low for better conversion."
      cards={[
        { title: "New today", value: "11", note: "Fresh leads waiting for a first reply." },
        { title: "Responded", value: "24", note: "Conversations already handled by your team." },
        { title: "Closed", value: "07", note: "Completed or archived buyer interactions." },
      ]}
    />
  );
}
