
import { useEffect } from 'react';

const SitemapXml = () => {
  useEffect(() => {
    // Set the correct content type for XML
    document.querySelector('meta[name="content-type"]')?.setAttribute('content', 'application/xml');
  }, []);

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://hyperchat.space/</loc>
    <lastmod>2025-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://hyperchat.space/contact</loc>
    <lastmod>2025-06-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://hyperchat.space/privacy-policy</loc>
    <lastmod>2025-06-15</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://hyperchat.space/cancellation-refunds</loc>
    <lastmod>2025-06-15</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://hyperchat.space/shipping</loc>
    <lastmod>2025-06-15</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://hyperchat.space/blog</loc>
    <lastmod>2025-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://hyperchat.space/sitemap</loc>
    <lastmod>2025-06-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://hyperchat.space/blog/upi-security-best-practices</loc>
    <lastmod>2025-06-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

  return (
    <pre style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
      {sitemapContent}
    </pre>
  );
};

export default SitemapXml;
