import { notFound } from "next/navigation";
import { AdminBlogEditor } from "@/components/admin/admin-blog-editor";
import { getAdminBlogBySlug } from "@/lib/blog-service";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditBlogPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getAdminBlogBySlug(slug);
  if (!post) notFound();
  return <AdminBlogEditor initialPost={post} />;
}
