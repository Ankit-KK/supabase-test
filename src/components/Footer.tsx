
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-background">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="col-span-1">
            <div className="text-xl font-bold bg-clip-text text-transparent bg-hero-gradient mb-4">
              🎉 HyperChat
            </div>
            <p className="text-sm text-muted-foreground">
              The ultimate fan-to-streamer engagement tool that lets you stand out during live streams.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-hyperchat-purple transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-hyperchat-purple transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-hyperchat-purple transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-hyperchat-purple transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} HyperChat. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-muted-foreground hover:text-hyperchat-purple transition-colors">
              <span className="sr-only">Twitter</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-1-4.8 4-8 8-6 1.6.8 2.7 2.4 3 4z"></path>
              </svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-hyperchat-purple transition-colors">
              <span className="sr-only">Instagram</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
              </svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-hyperchat-purple transition-colors">
              <span className="sr-only">Discord</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="9" cy="12" r="1"></circle>
                <circle cx="15" cy="12" r="1"></circle>
                <path d="M7.5 7.2C5.4 8.3 4 10 4 12c0 2 1.4 3.7 3.5 4.8"></path>
                <path d="M16.5 7.2C18.6 8.3 20 10 20 12c0 2-1.4 3.7-3.5 4.8"></path>
                <path d="M8 17h8a4 4 0 0 0 4-4v-2a4 4 0 0 0-4-4h-2L12.5 3.5a.8.8 0 0 0-1 0L10 7H8a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4Z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
