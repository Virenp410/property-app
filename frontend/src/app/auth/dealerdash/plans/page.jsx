import SectionPlaceholder from "../_components/SectionPlaceholder";

export default function PlansPage() {
  return (
    <SectionPlaceholder
      eyebrow="Plans"
      title="Plan usage and renewals"
      description="Monitor quota usage, renewal dates, and add-on performance for your current dealer subscription."
      cards={[
        { title: "Current plan", value: "Premium", note: "180 days remaining on your main subscription." },
        { title: "Cars used", value: "40 / 80", note: "Half of the available listing quota is active." },
        { title: "Boosts left", value: "12", note: "Featured visibility credits still available." },
      ]}
    />
  );
}
