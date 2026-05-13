import Index from "@/home/Index";
import { getIndexPageData } from "@/home/index-data";
import { getIndexPageSchema, indexPageMetadata } from "@/home/index-metadata";

export const metadata = indexPageMetadata;

export default async function HomePage() {
  const { highlightedJobs } = await getIndexPageData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getIndexPageSchema()),
        }}
      />

      <Index initialHighlightedJobs={highlightedJobs} />
    </>
  );
}
