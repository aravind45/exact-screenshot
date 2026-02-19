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
    const siteUrl = "https://www.expectedestate.com";
    const defaultOgImage = `${siteUrl}/og-image-v2.png`;

    // Ensure image is absolute
    const finalOgImage = ogImage
        ? (ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`)
        : defaultOgImage;

    // Default Structured Data for SoftwareApplication
    const defaultStructuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": siteName,
        "operatingSystem": "Web",
        "applicationCategory": "LegalApplication",
        "description": defaultDescription,
        "offers": {
            "@type": "Offer",
            "price": "149.00",
            "priceCurrency": "USD"
        }
    };

    const finalStructuredData = structuredData || defaultStructuredData;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description || defaultDescription} />
            <meta name="keywords" content="estate settlement, probate software, executor tools, trust administration, asset tracking, legal tech, compassionate probate" />
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:title" content={ogTitle || fullTitle} />
            <meta property="og:description" content={ogDescription || description || defaultDescription} />
            <meta property="og:image" content={finalOgImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:url" content={canonical || siteUrl} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={ogTitle || fullTitle} />
            <meta name="twitter:description" content={ogDescription || description || defaultDescription} />
            <meta name="twitter:image" content={finalOgImage} />
            <meta name="twitter:site" content={twitterHandle} />
            <meta name="twitter:creator" content={twitterHandle} />

            {/* JSON-LD Structured Data */}
            <script type="application/ld+json">
                {JSON.stringify(finalStructuredData)}
            </script>
        </Helmet>
    );
};
