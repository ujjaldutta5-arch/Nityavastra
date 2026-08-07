import Link from "next/link";
import { getPage } from "@/lib/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPage(slug).catch(() => null);
  return { title: page?.title || "Page" };
}

export default async function CmsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center" data-testid="page-404">
        <h1 className="font-serif text-3xl md:text-4xl text-[#2A1508] mb-3">Page not found</h1>
        <p className="text-[#78716C]">The page you&apos;re looking for doesn&apos;t exist yet.</p>
        <Link href="/" className="inline-block mt-6 text-[#7C1F30] hover:underline">
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <div
      className="container mx-auto max-w-3xl px-4 py-8 md:py-12"
      data-testid={`page-${slug}`}
    >
      <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#2A1508] mb-6">
        {page.title}
      </h1>
      <div
        className="prose-cms max-w-none"
        data-testid="page-content"
        dangerouslySetInnerHTML={{ __html: page.html_content || "" }}
      />
    </div>
  );
}
