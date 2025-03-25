
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Shield, Award, Clock, Users, Star } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="container-game relative z-10 py-4 px-2 sm:px-4 mb-16">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2 p-2" 
          onClick={() => navigate('/')}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">About Trade Hue</h1>
      </div>

      <div className="glass-panel p-6 rounded-xl mb-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 mb-4">
            Trade Hue
          </h2>
          <p className="text-lg text-muted-foreground">
            A fun, secure and transparent trading experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="border border-border/40 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Secure Platform</h3>
                  <p className="text-muted-foreground">
                    Our platform employs advanced security measures to protect your data and transactions. We use industry-standard encryption for all operations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/40 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Fair Gaming</h3>
                  <p className="text-muted-foreground">
                    Our trading algorithms are provably fair and transparent. Every result is verifiable, ensuring a fair experience for all users.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/40 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">24/7 Trading</h3>
                  <p className="text-muted-foreground">
                    Our platform is available around the clock, allowing you to trade whenever it's convenient for you, from anywhere in the world.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/40 bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Growing Community</h3>
                  <p className="text-muted-foreground">
                    Join thousands of traders who trust our platform daily. Our community is rapidly growing with shared success stories.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="glass-panel p-6 rounded-xl mb-6">
        <h2 className="text-xl font-bold mb-6 text-center">What Our Users Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              name: "Rahul S.",
              role: "Active Trader",
              comment: "Trade Hue has revolutionized how I approach trading. The interface is intuitive and the results are transparent.",
              rating: 5
            },
            {
              name: "Priya M.",
              role: "New User",
              comment: "As someone new to trading, I found Trade Hue to be incredibly user-friendly. The referral program is great too!",
              rating: 5
            },
            {
              name: "Amit K.",
              role: "Professional Trader",
              comment: "The best platform I've used so far. Quick withdrawals and excellent customer support.",
              rating: 4
            },
            {
              name: "Neha T.",
              role: "Regular User",
              comment: "I appreciate the different game modes that cater to various trading styles. Highly recommended!",
              rating: 5
            }
          ].map((testimonial, index) => (
            <Card key={index} className="border border-border/40 bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-center mb-2">
                  {Array(testimonial.rating).fill(0).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="italic text-muted-foreground mb-4">"{testimonial.comment}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="glass-panel p-6 rounded-xl mb-6">
        <h2 className="text-xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {[
            {
              question: "How do I get started with Trade Hue?",
              answer: "Simply create an account, make a deposit, and you're ready to start trading. We offer a signup bonus to help you get started."
            },
            {
              question: "Is Trade Hue secure?",
              answer: "Yes, we employ industry-standard security measures to protect your data and transactions. Your privacy and security are our top priorities."
            },
            {
              question: "How do withdrawals work?",
              answer: "Withdrawals are processed quickly through our secure system. Simply go to your wallet, enter the amount you want to withdraw, and follow the prompts."
            },
            {
              question: "What is the referral program?",
              answer: "Our referral program rewards you for inviting friends. When someone signs up using your referral code, both of you receive bonus coins."
            }
          ].map((faq, index) => (
            <div key={index} className="border border-border/40 rounded-lg p-4 bg-card/50">
              <h3 className="font-medium mb-2">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
