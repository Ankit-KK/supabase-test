import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Building2, Users, Shield } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              About HyperChat
            </h1>
            <p className="text-lg text-muted-foreground">
              A digital audience-interaction platform by STREAMHEART PRIVATE LIMITED
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Mission Section */}
            <div className="bg-card/50 backdrop-blur-sm p-8 rounded-lg border border-border/50 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
                  <p className="text-foreground/80 leading-relaxed">
                    HyperChat is a digital audience-interaction platform developed by STREAMHEART PRIVATE LIMITED. 
                    Our mission is to help creators build stronger audience engagement by enabling meaningful participation, 
                    expression, and real-time presence during live content.
                  </p>
                </div>
              </div>
            </div>

            {/* What We Do Section */}
            <div className="bg-card/50 backdrop-blur-sm p-8 rounded-lg border border-border/50 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-4">What We Do</h2>
                  <p className="text-foreground/80 leading-relaxed">
                    HyperChat provides tools that enhance visibility, amplify audience identity, and foster deeper 
                    community dynamics around creators and their content.
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notice Section */}
            <div className="bg-card/50 backdrop-blur-sm p-8 rounded-lg border border-primary/20 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Important Notice</h2>
                  <p className="text-foreground/80 leading-relaxed">
                    HyperChat does not manage, process, or store any financial transactions. Our platform is designed 
                    solely to facilitate interaction and engagement experiences between creators and their audiences.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>STREAMHEART PRIVATE LIMITED</p>
            <p className="mt-2">Enhancing presence and communication between creators and their audiences</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
