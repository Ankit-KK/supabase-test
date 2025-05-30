
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, User, Search } from "lucide-react";
import { Link } from "react-router-dom";

const Blog = () => {
  const featuredPost = {
    title: "Complete Guide: How to Monetize Content in India with UPI Payments",
    excerpt: "Learn everything about content monetization, UPI payment platforms for creators, and building a successful streaming career in India.",
    readTime: "12 min read",
    author: "HyperChat Team",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop",
    slug: "complete-guide-monetize-content-india",
    featured: true
  };

  const blogPosts = [
    {
      title: "How to Earn Money as a Streamer in India",
      excerpt: "Step-by-step guide to start earning through live streaming with UPI payments and virtual gifting.",
      readTime: "5 min read",
      author: "Creator Success Team",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop",
      slug: "earn-money-streaming-india",
      category: "Getting Started"
    },
    {
      title: "Best UPI-Based Tipping Platforms for Creators",
      excerpt: "Detailed comparison of UPI payment platforms and why HyperChat leads in Indian streaming monetization.",
      readTime: "7 min read", 
      author: "Platform Analysis Team",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=250&fit=crop",
      slug: "best-upi-tipping-platforms",
      category: "Platform Guides"
    },
    {
      title: "Fan Engagement Tools That Actually Work in 2025",
      excerpt: "Proven strategies for live chat tipping, virtual gifts, and building loyal fan communities.",
      readTime: "6 min read",
      author: "Engagement Experts",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
      slug: "fan-engagement-tools-2025",
      category: "Fan Engagement"
    },
    {
      title: "UPI for Content Creators: Security & Best Practices",
      excerpt: "Essential security tips and best practices for using UPI payments in content monetization.",
      readTime: "8 min read",
      author: "Security Team",
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop",
      slug: "upi-security-best-practices",
      category: "Security"
    },
    {
      title: "Virtual Gifts for Live Streamers: Maximizing Revenue",
      excerpt: "How to optimize virtual gifting strategies to increase earnings and fan engagement.",
      readTime: "6 min read",
      author: "Monetization Team",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop",
      slug: "virtual-gifts-maximize-revenue",
      category: "Monetization"
    },
    {
      title: "Building Your Streamer Donation App Strategy",
      excerpt: "Complete guide to setting up and optimizing your donation strategy for maximum income.",
      readTime: "9 min read",
      author: "Strategy Team",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=250&fit=crop",
      slug: "streamer-donation-app-strategy",
      category: "Strategy"
    }
  ];

  const categories = ["All", "Getting Started", "Platform Guides", "Fan Engagement", "Security", "Monetization", "Strategy"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              Creator Resources & Monetization Guides
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Learn how to monetize content in India, master UPI payments for creators, and build a successful streaming career with our comprehensive guides.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input 
                type="text" 
                placeholder="Search creator guides..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/20 bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-hyperchat-purple"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="pb-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Featured Guide</h2>
            <div className="bg-secondary/50 rounded-xl border border-white/10 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img 
                    src={featuredPost.image} 
                    alt={featuredPost.title}
                    className="w-full h-64 md:h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="inline-block bg-hyperchat-purple/20 text-hyperchat-purple px-3 py-1 rounded-full text-sm mb-4">
                    Featured Guide
                  </div>
                  <h3 className="text-2xl font-bold mb-4 hover:text-hyperchat-purple transition-colors">
                    <Link to={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>{featuredPost.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{featuredPost.readTime}</span>
                    </div>
                  </div>
                  <Button className="bg-hero-gradient hover:opacity-90" asChild>
                    <Link to={`/blog/${featuredPost.slug}`}>
                      Read Complete Guide
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="pb-8">
        <div className="container px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category, index) => (
                <Button 
                  key={index}
                  variant={index === 0 ? "default" : "outline"} 
                  size="sm"
                  className={index === 0 ? "bg-hyperchat-purple hover:bg-hyperchat-purple/90" : ""}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="pb-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Latest Creator Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post, index) => (
                <article key={index} className="bg-secondary/50 rounded-xl border border-white/10 overflow-hidden hover:shadow-lg transition-shadow">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs bg-hyperchat-purple/20 text-hyperchat-purple px-2 py-1 rounded-full">
                        {post.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 hover:text-hyperchat-purple transition-colors">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <User size={14} />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/blog/${post.slug}`}>
                        Read Article
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
