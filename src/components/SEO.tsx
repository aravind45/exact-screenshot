import React from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
    title?: string;
    description?: string;
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogType?: string;
    twitterHandle?: string;
    structuredData?: object;
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
}) => {
    const siteName = "ExpectedEstate";
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const defaultDescription = "Simplify estate settlement with clarity and peace of mind. ExpectedEstate helps executors navigate probate, track assets, and manage paperwork.";

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description || defaultDescription} />
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:title" content={ogTitle || fullTitle} />
            <meta property="og:description" content={ogDescription || description || defaultDescription} />
            {ogImage && <meta property="og:image" content={ogImage} />}
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={ogTitle || fullTitle} />
            <meta name="twitter:description" content={ogDescription || description || defaultDescription} />
            {ogImage && <meta name="twitter:image" content={ogImage} />}
            <meta name="twitter:site" content={twitterHandle} />

            {/* JSON-LD Structured Data */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
};
