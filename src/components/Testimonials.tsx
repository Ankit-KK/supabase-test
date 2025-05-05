
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface TestimonialProps {
  content: string;
  author: string;
  role: string;
  image?: string;
  platform?: string;
}

const Testimonial: React.FC<TestimonialProps> = ({ content, author, role, image, platform }) => {
  return (
    <div className="flex flex-col h-full p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={16} className="fill-hyperchat-orange text-hyperchat-orange" />
        ))}
      </div>
      <p className="flex-1 text-muted-foreground">{content}</p>
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={image} />
          <AvatarFallback className="bg-hyperchat-purple text-white">
            {author.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{author}</p>
          <p className="text-xs text-muted-foreground">{role} {platform && `on ${platform}`}</p>
        </div>
      </div>
    </div>
  );
};

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      content: "HyperChat completely changed how I interact with my audience. I can actually notice important messages now, and my fans love the special recognition they receive.",
      author: "StreamerPro",
      role: "Streamer",
      platform: "Twitch",
    },
    {
      content: "Finally, a way to make sure my support gets noticed! The customization options let me express myself, and I love seeing my messages highlighted on stream.",
      author: "GameFan23",
      role: "Viewer",
    },
    {
      content: "As a small streamer, HyperChat has been a game-changer for monetization. The fan leaderboards create healthy competition and my community loves it!",
      author: "RisingCreator",
      role: "Content Creator",
      platform: "YouTube",
    },
    {
      content: "The real-time reactions feature is incredible. My viewers can see me respond to their messages immediately, creating genuine moments of connection.",
      author: "TechStreamer",
      role: "Tech Influencer",
      platform: "Twitch",
    },
    {
      content: "My favorite streamers actually respond to my messages now! Well worth it to stand out in busy chats - the custom styles are super fun too.",
      author: "StreamSupporter",
      role: "Super Fan",
    },
    {
      content: "We integrated HyperChat for our charity stream and it helped us raise 40% more than last year. The pinned messages are perfect for donation shoutouts.",
      author: "CharityOrg",
      role: "Nonprofit Organization",
    },
  ];

  return (
    <section id="testimonials" className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Loved by Creators and Fans Alike
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl">
            Don't just take our word for it — hear what our users have to say.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              content={testimonial.content}
              author={testimonial.author}
              role={testimonial.role}
              platform={testimonial.platform}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
