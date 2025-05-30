
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";

const BlogSection = () => {
  const blogPosts = [
    {
      title: "How to Earn Money as a Streamer in India",
      excerpt: "Complete guide to monetize content in India using UPI payments, virtual gifting, and fan engagement strategies for maximum earning potential.",
      readTime: "5 min read",
      author: "HyperChat Team",
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop",
      slug: "earn-money-streaming-india",
      tags: ["Content Monetization", "UPI Payments", "Streaming Tips"]
    },
    {
      title: "Best UPI-Based Tipping Platforms for Creators",
      excerpt: "Comprehensive comparison of UPI payment platforms for creators. Learn why HyperChat is the top choice for Indian streaming monetization.",
      readTime: "7 min read", 
      author: "Creator Success Team",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop",
      slug: "best-upi-tipping-platforms",
      tags: ["UPI Payments", "Platform Comparison", "Creator Tools"]
    },
    {
      title: "Fan Engagement Tools That Actually Work in 2025",
      excerpt: "Discover the most effective fan engagement strategies including live chat tipping, virtual gifts for live streamers, and direct fan support via UPI.",
      readTime: "6 min read",
      author: "Engagement Experts",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=250&fit=crop",
      slug: "fan-engagement-tools-2025",
      tags: ["Fan Engagement", "Live Chat Tipping", "Virtual Gifts"]
    }
  ];

  return (
    <section id="blog" className="py-16 md:py-24 bg-secondary/10">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            Creator Resources & Monetization Guides
          </h2>
          <p className="text-muted-foreground md:text-xl max-w-3xl mx-auto">
            Learn how to monetize content in India, maximize your earnings with UPI payments, and build a successful streaming career.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {blogPosts.map((post, index) => (
            <article key={index} className="bg-background rounded-xl border border-white/10 overflow-hidden hover:shadow-lg transition-shadow">
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="text-xs bg-hyperchat-purple/20 text-hyperchat-purple px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
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

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" asChild>
            <Link to="/blog">
              View All Creator Resources
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
