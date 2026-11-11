import RecordDetailClient from "@/components/RecordDetailClient";

// This route reads the id from params at request time, so it cannot be
// prerendered as a static page.
export const instant = false;

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecordDetailClient id={id} />;
}
