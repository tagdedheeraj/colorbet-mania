
import React, { useState } from 'react';
import { MessageCircle, X, Send, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';

const SupportContactPopup = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const isMobile = useIsMobile();

  const openTelegram = () => {
    window.open('https://t.me/tradehueapp', '_blank');
  };

  return (
    <>
      {/* Support button for all devices */}
      <div className={`fixed ${isMobile ? 'bottom-16 right-4' : 'bottom-4 right-4'} z-40`}>
        <Sheet open={isPopupOpen} onOpenChange={setIsPopupOpen}>
          <SheetTrigger asChild>
            <Button
              className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 flex items-center justify-center"
              size="icon"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "rounded-t-xl pt-1 pb-6 px-4" : "pt-6 pb-6 px-4"}>
            {isMobile && <div className="mx-auto mt-1 h-1.5 w-16 rounded-full bg-muted mb-4" />}
            <SheetHeader className="text-left px-1">
              <SheetTitle className="text-xl font-bold">Need Help?</SheetTitle>
              <SheetDescription>
                Contact our support team or join our community
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-4">
              {/* Telegram Option */}
              <div 
                className="flex items-center p-4 bg-blue-50/10 border border-blue-200/20 rounded-lg cursor-pointer hover:bg-blue-50/20 transition-colors"
                onClick={openTelegram}
              >
                <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Join Telegram</h3>
                  <p className="text-sm text-muted-foreground">Our community channel for updates</p>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </div>
              
              {/* Support Email Option */}
              <a 
                href="mailto:support@tradehue.app" 
                className="flex items-center p-4 bg-purple-50/10 border border-purple-200/20 rounded-lg cursor-pointer hover:bg-purple-50/20 transition-colors"
              >
                <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center mr-4">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Email Support</h3>
                  <p className="text-sm text-muted-foreground">Get help with your account</p>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </a>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Our support team is available Mon-Fri, 9am-5pm
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default SupportContactPopup;
