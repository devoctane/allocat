import CategoryDetailPage from "@/components/budget/CategoryDetailPage";

export default async function CategoryDetail({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  return <CategoryDetailPage categoryId={categoryId} />;
}
