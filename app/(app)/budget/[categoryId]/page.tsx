import CategoryDetailPage from "@/components/budget/CategoryDetailPage";
import { getCategoryData } from "@/lib/actions/budget";
import { redirect } from "next/navigation";

export default async function CategoryDetail({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  
  const categoryData = await getCategoryData(categoryId);

  if (!categoryData) {
    redirect("/budget");
  }

  return <CategoryDetailPage data={categoryData} />;
}
