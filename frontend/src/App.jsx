import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import EmailBox from '@/components/EmailBox';
import InboxContainer from '@/components/InboxContainer';
import StopwatchLogo from '@/components/StopwatchLogo';
import { getAvatarFallbackUrl } from "@/lib/utils";
import wadeImage from '@/images/WadeMercer.png'; // Using alias if configured
import lisaImage from '@/images/LisaChen.png'; // Using alias if configured
import jaydenImage from '@/images/JaydenMorales.png'; // Using alias if configured


// Replace Node.js `crypto.randomBytes` with browser-friendly approach
function generateRandomUsername(length = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  randomValues.forEach(value => {
    result += characters[value % characters.length];
  });
  return result;
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const tempEmailDomains = [
  'tempmail.com', '10minutemail.net', 'throwawaymail.com', 'maildrop.cc', 'guerrillamail.com'
];

// Main function to generate a random temporary email address
async function generateTempEmail() {
  const domain = tempEmailDomains[Math.floor(Math.random() * tempEmailDomains.length)];

  if (domain === 'guerrillamail.com') {
    try {
      // Simulate GuerrillaMail API call (mocking response here)
      const email = `${generateRandomUsername()}@guerrillamail.com`;
      return { email: email.toLowerCase(), domain };
    } catch (error) {
      console.error('Error generating GuerrillaMail email:', error);
    }
  }

  const username = generateRandomUsername();
  const email = `${username}@${domain}`;
  return { email: email.toLowerCase(), domain };
}

const testimonials = [
  {
    name: 'Wade Mercer',
    role: 'Digital Marketer',
    content: 'This service is perfect for quick sign-ups. The 10-minute timer is just enough for my needs.',
    image: wadeImage
  },
  {
    name: 'Lisa Chen',
    role: 'Software Developer',
    content: 'I use this all the time to avoid spam. Simple to use, and it gets the job done every time.',
    image: lisaImage
  },
  {
    name: 'Jayden Morales',
    role: 'Content Creator',
    content: 'Great for one-off uses. It’s fast, effective, and keeps my main inbox clean without any hassle.',
    image: jaydenImage
  },
];

export default function App() {
  const [email, setEmail] = useState('');

  // Set the email when the component is first loaded
  useEffect(() => {
    const fetchEmail = async () => {
      const generatedEmail = await generateTempEmail();  // Generate random email
      setEmail(generatedEmail.email);  // Set the email to state
    };

    fetchEmail();  // Generate and set the email on page load
  }, []);

  // Function to refresh the email
  const handleRefresh = useCallback(async () => {
    const generatedEmail = await generateTempEmail();  // Generate random email
    setEmail(generatedEmail.email);  // Update the state with the new email
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
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Your <span className="gradient-text">10 Minute</span> Email
          </h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Instant temporary email for secure, spam-free sign-ups.
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
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Trusted by thousands</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">See what our users have to say</p>
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
              <p className="mb-6">{testimonial.content}</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-primary/20 border-primaryPurple rounded-full overflow-hidden">
                  <AvatarImage 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="object-cover object-center w-full h-full"
                    style={{
                      imageRendering: 'crisp-edges',
                      WebkitImageSmoothing: 'antialiased',
                      MozImageSmoothing: 'antialiased'
                    }}
                  />
                  <AvatarFallback>
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
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
