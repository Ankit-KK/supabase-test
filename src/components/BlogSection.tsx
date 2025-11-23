import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";
const BlogSection = () => {
  const blogPosts = [{
    title: "UPI Security Best Practices for Online Payments",
    excerpt: "Essential security guidelines and best practices for using UPI payments safely in your digital transactions.",
    readTime: "5 min read",
    author: "Security Team",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=250&fit=crop",
    slug: "upi-security-best-practices",
    tags: ["UPI Security", "Payment Safety", "Digital Finance"]
  }];
  return <section id="blog" className="py-16 md:py-24 bg-secondary/10">
      
    </section>;
};
export default BlogSection;