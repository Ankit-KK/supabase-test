
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, FileText, Users, MessageSquare, ExternalLink, Scale } from "lucide-react";

const Sitemap = () => {
  const mainPages = [
    { path: "/", title: "Home", description: "Main landing page with features and services" },
    { path: "/about", title: "About", description: "Learn about HyperChat and our mission" },
    { path: "/feature-showcase", title: "Features", description: "Explore all platform features" },
    { path: "/contact", title: "Contact", description: "Get in touch with our team" },
    { path: "/blog", title: "Blog", description: "Latest articles and insights" },
  ];

  const creatorPages = [
    { path: "/ankit", title: "Ankit", description: "Support Ankit" },
    { path: "/chiaa_gaming", title: "Chiaa Gaming", description: "Support Chiaa Gaming" },
    { path: "/looteriya_gaming", title: "Looteriya Gaming", description: "Support Looteriya Gaming" },
    { path: "/sizzors", title: "Sizzors", description: "Support Sizzors" },
    { path: "/damask_plays", title: "Damask Plays", description: "Support Damask Plays" },
    { path: "/neko_xenpai", title: "Neko Xenpai", description: "Support Neko Xenpai" },
    { path: "/thunderx", title: "ThunderX", description: "Support ThunderX" },
    { path: "/vipbhai", title: "VIP Bhai", description: "Support VIP Bhai" },
    { path: "/sagarujjwalgaming", title: "Sagar Ujjwal Gaming", description: "Support Sagar Ujjwal Gaming" },
    { path: "/notyourkween", title: "Not Your Kween", description: "Support Not Your Kween" },
    { path: "/bongflick", title: "BongFlick", description: "Support BongFlick" },
    { path: "/mriqmaster", title: "Mr Iqmaster", description: "Support Mr Iqmaster" },
    { path: "/abdevil", title: "ABdevil", description: "Support ABdevil" },
    { path: "/jhanvoo", title: "Jhanvoo", description: "Support Jhanvoo" },
    { path: "/clumsygod", title: "ClumsyGod", description: "Support ClumsyGod" },
  ];

  const legalPages = [
    { path: "/privacy-policy", title: "Privacy Policy", description: "Our privacy and data protection policy" },
    { path: "/cancellation-refunds", title: "Cancellation & Refunds", description: "Refund and cancellation terms" },
    { path: "/shipping", title: "Shipping", description: "Shipping information and policies" },
    { path: "/terms-and-conditions", title: "Terms & Conditions", description: "Terms of service and usage" },
  ];

  const blogPosts = [
    { path: "/blog/earn-money-streaming-india", title: "Earn Money Streaming in India", description: "Guide to monetizing your streams" },
    { path: "/blog/best-upi-tipping-platforms", title: "Best UPI Tipping Platforms", description: "Compare top tipping platforms" },
    { path: "/blog/complete-guide-monetize-content-india", title: "Monetize Content in India", description: "Complete monetization guide" },
    { path: "/blog/fan-engagement-tools-2025", title: "Fan Engagement Tools 2025", description: "Latest engagement tools" },
    { path: "/blog/streamer-donation-app-strategy", title: "Streamer Donation Strategy", description: "Maximize your donations" },
    { path: "/blog/upi-security-best-practices", title: "UPI Security Best Practices", description: "Keep your transactions safe" },
    { path: "/blog/virtual-gifts-maximize-revenue", title: "Virtual Gifts Revenue", description: "Maximize virtual gift income" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Site Map
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Explore all pages and content available on our website. Find exactly what you're looking for.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Main Pages */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Home className="h-5 w-5" />
                Main Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mainPages.map((page) => (
                  <Link
                    key={page.path}
                    to={page.path}
                    className="block p-4 border rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200 group"
                  >
                    <h3 className="font-semibold text-purple-700 group-hover:text-purple-800 mb-1">
                      {page.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{page.description}</p>
                    <ExternalLink className="h-4 w-4 text-gray-400 mt-2 group-hover:text-purple-600" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Creator Pages */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5" />
                Creator Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
                {creatorPages.map((page) => (
                  <Link
                    key={page.path}
                    to={page.path}
                    className="block p-3 border rounded-lg hover:border-pink-300 hover:shadow-md transition-all duration-200 group"
                  >
                    <h3 className="font-semibold text-pink-700 group-hover:text-pink-800 text-sm">
                      {page.title}
                    </h3>
                    <ExternalLink className="h-3 w-3 text-gray-400 mt-1 group-hover:text-pink-600" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Blog Posts */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5" />
                Blog Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {blogPosts.map((post) => (
                  <Link
                    key={post.path}
                    to={post.path}
                    className="block p-4 border rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                  >
                    <h3 className="font-semibold text-blue-700 group-hover:text-blue-800 mb-1 text-sm">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-xs">{post.description}</p>
                    <ExternalLink className="h-3 w-3 text-gray-400 mt-2 group-hover:text-blue-600" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Legal Pages */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Scale className="h-5 w-5" />
                Legal & Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {legalPages.map((page) => (
                  <Link
                    key={page.path}
                    to={page.path}
                    className="block p-4 border rounded-lg hover:border-gray-400 hover:shadow-md transition-all duration-200 group"
                  >
                    <h3 className="font-semibold text-gray-700 group-hover:text-gray-800 mb-1">
                      {page.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{page.description}</p>
                    <ExternalLink className="h-4 w-4 text-gray-400 mt-2 group-hover:text-gray-600" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Link to="/">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Home className="h-4 w-4 mr-2" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;
