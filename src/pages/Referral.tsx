
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Share2, Download, Copy, Gift, Users, Coins } from "lucide-react";
import useAuthStore from '@/store/authStore';
import { toast } from "sonner";
import { useIsMobile } from '@/hooks/use-mobile';

const ReferralPage = () => {
  const navigate = useNavigate();
  const { user, getReferralCode, applyReferralCode } = useAuthStore();
  const [referralInput, setReferralInput] = useState<string>('');
  const isMobile = useIsMobile();
  
  if (!user) {
    navigate('/');
    return null;
  }
  
  const referralCode = getReferralCode();
  const referralLink = `${window.location.origin}?ref=${referralCode}`;
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied to clipboard');
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard');
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Trade Hue',
        text: 'Use my referral code and get 100 coins bonus!',
        url: referralLink,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      handleCopyLink();
    }
  };
  
  const handleApplyReferral = async () => {
    if (!referralInput) {
      toast.error('Please enter a referral code');
      return;
    }
    
    try {
      await applyReferralCode(referralInput);
      setReferralInput('');
    } catch (error) {
      // Error already handled in store
    }
  };

  return (
    <div className="container-game relative z-10 py-4 px-2 sm:px-4 pb-20 lg:pb-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2 p-2" 
          onClick={() => navigate('/')}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Refer & Earn</h1>
      </div>
      
      <div className="grid gap-4">
        <Card className="glass-panel border-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-primary/10 rounded-lg z-0" />
          <CardHeader className="relative z-10 p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <span>Invite Friends & Earn Coins</span>
            </CardTitle>
            <CardDescription>
              Share your referral code with friends and both of you will receive 100 coins
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="grid gap-4 sm:gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex flex-col items-center p-3 sm:p-4 bg-background/50 rounded-lg border border-border">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2" />
                  <h3 className="font-bold text-base sm:text-lg">Invite Friends</h3>
                  <p className="text-xs sm:text-sm text-center text-muted-foreground mt-1">
                    Share your referral code
                  </p>
                </div>
                <div className="flex flex-col items-center p-3 sm:p-4 bg-background/50 rounded-lg border border-border">
                  <Download className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2" />
                  <h3 className="font-bold text-base sm:text-lg">They Join</h3>
                  <p className="text-xs sm:text-sm text-center text-muted-foreground mt-1">
                    Friends register with code
                  </p>
                </div>
                <div className="flex flex-col items-center p-3 sm:p-4 bg-background/50 rounded-lg border border-border">
                  <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-game-gold mb-2" />
                  <h3 className="font-bold text-base sm:text-lg">You Both Earn</h3>
                  <p className="text-xs sm:text-sm text-center text-muted-foreground mt-1">
                    Get 100 coins bonus each
                  </p>
                </div>
              </div>
              
              <div className="bg-muted/30 p-4 sm:p-6 rounded-lg border border-border mt-2 sm:mt-4">
                <h3 className="font-bold mb-2">Your Referral Code</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background p-2 sm:p-3 rounded border text-center font-mono text-base sm:text-lg">
                    {referralCode}
                  </div>
                  <Button variant="outline" size={isMobile ? "sm" : "default"} className="shrink-0" onClick={handleCopyCode}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                
                <h3 className="font-bold mt-4 sm:mt-6 mb-2">Share Your Referral Link</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background p-2 sm:p-3 rounded border text-xs sm:text-sm overflow-hidden overflow-ellipsis whitespace-nowrap">
                    {referralLink}
                  </div>
                  <Button variant="outline" size={isMobile ? "sm" : "default"} className="shrink-0" onClick={handleCopyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="mt-4 sm:mt-6">
                  <Button className="w-full flex items-center gap-2" onClick={handleShare}>
                    <Share2 className="w-4 h-4" />
                    <span>Share Now</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-panel">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Apply Referral Code</CardTitle>
            <CardDescription>
              Enter a friend's referral code to get 100 coins bonus
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Input
                placeholder="Enter referral code"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value)}
                className="w-full"
              />
              <Button 
                onClick={handleApplyReferral}
                className={isMobile ? "w-full mt-2 sm:mt-0 sm:w-auto" : ""}
              >
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-panel bg-primary/5 border-primary/20">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Download App</CardTitle>
            <CardDescription>
              Get the best experience with our mobile app
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="flex flex-col items-center">
              <p className="text-center mb-4 text-sm sm:text-base">
                Download our mobile app for a better gaming experience, faster access, and exclusive features.
              </p>
              <Button className="w-full sm:w-auto flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>Download App</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReferralPage;
