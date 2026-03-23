import SectionPlaceholder from "../_components/SectionPlaceholder";

export default function CustomersPage() {
  return (
    <SectionPlaceholder
      eyebrow="Customers"
      title="Customer relationships"
      description="Keep track of engaged buyers, repeat conversations, and customer quality across your dealership pipeline."
      cards={[
        { title: "Active buyers", value: "63", note: "Customers with open interest in current listings." },
        { title: "Repeat buyers", value: "14", note: "Returning customers from earlier interactions." },
        { title: "Avg. satisfaction", value: "4.8", note: "Dealer rating across recent buyer feedback." },
      ]}
    />
  );
}
