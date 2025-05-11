
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">Support Your Favorite Creators</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Send a message and donation to your favorite content creators. 
          Your support means everything!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="bg-card rounded-lg p-8 shadow-md border border-border flex flex-col">
          <h2 className="text-2xl font-bold mb-3">Support Ankit</h2>
          <p className="text-muted-foreground mb-6 flex-grow">
            Show your appreciation for Ankit by sending a donation with a personal message.
          </p>
          <Button asChild className="w-full">
            <Link to="/ankit">Donate to Ankit</Link>
          </Button>
        </div>
        
        <div className="bg-card rounded-lg p-8 shadow-md border border-border flex flex-col">
          <h2 className="text-2xl font-bold mb-3">Support Harish</h2>
          <p className="text-muted-foreground mb-6 flex-grow">
            Help Harish continue creating amazing content with your support and message.
          </p>
          <Button asChild className="w-full">
            <Link to="/harish">Donate to Harish</Link>
          </Button>
        </div>
        
        <div className="bg-card rounded-lg p-8 shadow-md border border-border flex flex-col">
          <h2 className="text-2xl font-bold mb-3">Support MackleTv</h2>
          <p className="text-muted-foreground mb-6 flex-grow">
            Send GIFs to MackleTv's stream and show your support with fun animations.
          </p>
          <Button asChild className="w-full">
            <Link to="/mackletv">Support MackleTv</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
