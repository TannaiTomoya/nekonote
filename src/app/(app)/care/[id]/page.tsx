import { CareDetail } from "@/components/care";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CareDetail id={id} />;
}
