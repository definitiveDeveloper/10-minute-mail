
import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import EmailBox from "@/components/EmailBox";
import InboxContainer from "@/components/InboxContainer";
import StopwatchLogo from "@/components/StopwatchLogo";
import axios from "axios";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const testimonials = [
  {
    name: "Alex Thompson",
    role: "Digital Marketer",
    content: "This temporary email service has saved me countless times from spam. Simple and effective!",
  },
  {
    name: "Lisa Chen",
    role: "Software Developer",
    content: "Perfect for testing applications. Clean interface and instant access.",
  },
  {
    name: "James Wilson",
    role: "Content Creator",
    content: "The best temporary email service I've used. No ads, no hassle, just works.",
  }
];

function generateRandomEmail() {
  // const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  // const length = 10;
  // const randomString = Array.from({ length }, () => 
  //   chars.charAt(Math.floor(Math.random() * chars.length))
  // ).join('');
  // return `${randomString}@10minutemail.com`;
  
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/email/new");
        setEmail(res.data.email);
      } catch (err) {
        console.error("Error fetching email:", err);
      }
    };
  
    fetchEmail();
  }, []);
}

export default function App() {
  const [email, setEmail] = useState(generateRandomEmail());

  const handleRefresh = useCallback(() => {
    setEmail(generateRandomEmail());
  }, []);

  return (
    <div className="min-h-screen">
      <div className="hero-gradient">
        <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
          <StopwatchLogo className="text-2xl" />
        </nav>

        <motion.div 
          className="container mx-auto px-6 py-24 text-center"
          initial="initial"
          animate="animate"
          variants={fadeIn}
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Your <span className="gradient-text">10 Minute</span> Email
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Instant temporary email for secure, spam-free sign-ups. No registration required.
          </p>
          
          <EmailBox email={email} onRefresh={handleRefresh} />
          
          <div className="mt-12">
            <InboxContainer />
          </div>
        </motion.div>
      </div>

      {/* Testimonials Section */}
      <section className="py-24 container mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Trusted by thousands
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what our users have to say
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="card-gradient p-6 rounded-lg border border-border"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-4">{testimonial.content}</p>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Service</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">How it Works</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Features</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Terms</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Cookie Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Help Center</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Contact</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground">
            <p>&copy; 2025 10 Minute Mail. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
