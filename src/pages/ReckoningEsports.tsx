
import React from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import VideoBackground from "@/components/VideoBackground";

const ReckoningEsports = () => {
  return (
    <div className="min-h-screen bg-transparent">
      <VideoBackground videoSrc="https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/sign/ankit/website%20background.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhbmtpdC93ZWJzaXRlIGJhY2tncm91bmQubXA0IiwiaWF0IjoxNzQ3NDExNjAwLCJleHAiOjE4NzM1NTU2MDB9.D5dXg6_fRzUh8B5veK0_ZSo8IvP4wb2k6Y_IAn7W-VY" />
      <div className="content-overlay">
        <Navbar />
        
        <section className="py-20 md:py-32 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Hero Section */}
            <div className="flex flex-col items-center text-center mb-16">
              <div className="mb-8">
                <img 
                  src="/lovable-uploads/2cccfc7a-1365-48dd-9e04-f41ccbc17575.png" 
                  alt="Reckoning Esports Team" 
                  className="w-full max-w-4xl rounded-lg shadow-2xl" 
                />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-hyperchat-blue to-hyperchat-purple mb-6">
                Reckoning Esports
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-8">
                India's premier professional esports organization, competing at the highest level across multiple titles.
              </p>
            </div>

            {/* Team Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <Card className="bg-black/40 border-hyperchat-purple/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-hyperchat-purple">Team Achievements</CardTitle>
                  <CardDescription>Our competitive milestones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-hyperchat-purple flex items-center justify-center">
                      <span className="text-white font-bold">1st</span>
                    </div>
                    <div>
                      <h3 className="font-bold">National Championship 2023</h3>
                      <p className="text-sm text-muted-foreground">BGMI Pro Series</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-hyperchat-blue flex items-center justify-center">
                      <span className="text-white font-bold">2nd</span>
                    </div>
                    <div>
                      <h3 className="font-bold">Asian Invitational 2023</h3>
                      <p className="text-sm text-muted-foreground">Valorant Elite Tournament</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-hyperchat-orange flex items-center justify-center">
                      <span className="text-white font-bold">Top 5</span>
                    </div>
                    <div>
                      <h3 className="font-bold">World Championship Qualifiers</h3>
                      <p className="text-sm text-muted-foreground">PUBG Mobile Global Tournament</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-black/40 border-hyperchat-blue/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-hyperchat-blue">Our Partners</CardTitle>
                  <CardDescription>Proud collaborations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center p-4 bg-white/5 rounded-lg">
                      <h3 className="text-xl font-bold text-white">iQOO</h3>
                      <p className="text-sm text-muted-foreground">Official Smartphone Partner</p>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-white/5 rounded-lg">
                      <h3 className="text-xl font-bold text-white">Kaspersky</h3>
                      <p className="text-sm text-muted-foreground">Security Solutions Partner</p>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-white/5 rounded-lg">
                      <h3 className="text-xl font-bold text-white">HyperX</h3>
                      <p className="text-sm text-muted-foreground">Gaming Peripherals</p>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-white/5 rounded-lg">
                      <h3 className="text-xl font-bold text-white">RedBull</h3>
                      <p className="text-sm text-muted-foreground">Energy Drink Sponsor</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Support Section */}
            <div className="bg-gradient-to-r from-black/70 to-hyperchat-purple/20 p-8 md:p-12 rounded-2xl backdrop-blur-sm">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Support Reckoning Esports</h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Join us on our journey to represent India on the global stage. Your support helps our team compete at the highest level.
                  </p>
                </div>
                <div className="w-full md:w-auto flex flex-col gap-4">
                  <Button size="lg" className="bg-gradient-to-r from-hyperchat-purple to-hyperchat-pink hover:opacity-90 transition-opacity px-8">
                    Become a Supporter
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10">
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReckoningEsports;
