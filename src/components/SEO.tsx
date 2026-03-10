import React from "react";
import { Helmet } from "react-helmet-async";
import {
    buildDefaultBreadcrumbs,
    DEFAULT_META_DESCRIPTION,
    DEFAULT_OG_IMAGE,
    DEFAULT_OG_IMAGE_ALT,
    DEFAULT_ROBOTS,
    normalizeSiteUrl,
    SITE_NAME,
    SITE_URL,
    stripSiteName,
    withSiteName,
} from "@/seo/siteConfig";

interface SEOProps {
    title?: string;
    description?: string;
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogType?: string;
    twitterHandle?: string;
    structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
    noindex?: boolean;
    publishedTime?: string;
    modifiedTime?: string;
    ogImageAlt?: string;
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    ogType = "website",
    twitterHandle = "@ExpectedEstate",
    structuredData,
    noindex = false,
    publishedTime,
    modifiedTime,
    ogImageAlt = DEFAULT_OG_IMAGE_ALT,
}) => {
    const inferredCanonical = typeof window !== "undefined"
        ? `${SITE_URL}${window.location.pathname}`
        : undefined;
    const fullTitle = withSiteName(title);
    const pageName = stripSiteName(fullTitle);
    const finalDescription = description || DEFAULT_META_DESCRIPTION;
    const finalCanonical = normalizeSiteUrl(canonical || inferredCanonical || SITE_URL) || SITE_URL;
    const finalOgImage = normalizeSiteUrl(ogImage) || DEFAULT_OG_IMAGE;
    const robots = noindex ? "noindex,nofollow" : DEFAULT_ROBOTS;

    const extractStructuredDataNodes = (
        data?: SEOProps["structuredData"],
    ): Array<Record<string, unknown>> => {
        if (!data) return [];
        if (Array.isArray(data)) return data;

        const maybeGraph = (data as { "@graph"?: unknown })["@graph"];
        if (Array.isArray(maybeGraph)) {
            return maybeGraph as Array<Record<string, unknown>>;
        }

        return [data];
    };

    const breadcrumbNodes = buildDefaultBreadcrumbs(finalCanonical, pageName);
    const breadcrumbStructuredData = breadcrumbNodes.length > 0
        ? {
            "@type": "BreadcrumbList",
            itemListElement: breadcrumbNodes.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: item.name,
                item: item.item,
            })),
        }
        : null;

    const finalStructuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                name: SITE_NAME,
                url: SITE_URL,
                logo: {
                    "@type": "ImageObject",
                    "@id": `${SITE_URL}/#logo`,
                    url: `${SITE_URL}/apple-touch-icon.svg`,
                },
            },
            {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                url: SITE_URL,
                name: SITE_NAME,
                publisher: { "@id": `${SITE_URL}/#organization` },
                inLanguage: "en-US",
            },
            {
                "@type": "WebPage",
                "@id": `${finalCanonical}#webpage`,
                url: finalCanonical,
                name: pageName,
                description: finalDescription,
                isPartOf: { "@id": `${SITE_URL}/#website` },
                about: { "@id": `${SITE_URL}/#organization` },
                primaryImageOfPage: {
                    "@type": "ImageObject",
                    url: finalOgImage,
                },
            },
            ...(breadcrumbStructuredData ? [breadcrumbStructuredData] : []),
            ...extractStructuredDataNodes(structuredData),
        ],
    };

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={finalDescription} />
            <meta name="robots" content={robots} />
            <meta name="googlebot" content={robots} />
            <link rel="canonical" href={finalCanonical} />

            <meta property="og:type" content={ogType} />
            <meta property="og:title" content={ogTitle || fullTitle} />
            <meta property="og:description" content={ogDescription || finalDescription} />
            <meta property="og:image" content={finalOgImage} />
            <meta property="og:image:alt" content={ogImageAlt} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:url" content={finalCanonical} />
            <meta property="og:locale" content="en_US" />
            {publishedTime && <meta property="article:published_time" content={publishedTime} />}
            {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={ogTitle || fullTitle} />
            <meta name="twitter:description" content={ogDescription || finalDescription} />
            <meta name="twitter:image" content={finalOgImage} />
            <meta name="twitter:image:alt" content={ogImageAlt} />
            <meta name="twitter:site" content={twitterHandle} />
            <meta name="twitter:creator" content={twitterHandle} />

            <script type="application/ld+json">
                {JSON.stringify(finalStructuredData)}
            </script>
        </Helmet>
    );
};

