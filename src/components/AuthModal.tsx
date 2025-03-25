
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import useAuthStore from '@/store/authStore';

const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen, login, register } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleClose = () => {
    setAuthModalOpen(false);
    setUsername("");
    setPassword("");
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (activeTab === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
      handleClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={setAuthModalOpen}>
      <DialogContent className="glass-panel border-primary/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            {activeTab === "login" ? "Welcome Back" : "Join the Game"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-secondary/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-secondary/50 border-border/50"
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/80" 
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-username">Choose Username</Label>
                <Input
                  id="new-username"
                  placeholder="Create a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-secondary/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Create Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-secondary/50 border-border/50"
                />
              </div>
              <div className="bg-secondary/30 p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  You'll receive 1,000 coins to start playing!
                </p>
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/80" 
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
