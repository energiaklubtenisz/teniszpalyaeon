import { site } from "@/content/site";

export function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsClub",
    name: site.name,
    alternateName: "Energia Teniszklub Nagykanizsa",
    sport: "Tennis",
    description: site.description,
    url: site.url,
    logo: `${site.url}/brand/energia_tennis_club_logo.png`,
    image: `${site.url}/images/landing/landing-hero.jpg`,
    telephone: "+36304748185",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Vár utca 2.",
      addressLocality: "Nagykanizsa",
      postalCode: "8800",
      addressCountry: "HU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 46.4533381,
      longitude: 16.9812365,
    },
    hasMap: "https://maps.app.goo.gl/jSHF7y5pYhbG2s697",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "08:00",
        closes: "20:00",
      },
    ],
    priceRange: "5 000 HUF",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
