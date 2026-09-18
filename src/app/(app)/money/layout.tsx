import { MoneySummary } from "@/components/money";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MoneySummary />
      {children}
    </>
  );
}
