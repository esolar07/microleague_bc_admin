import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Gift, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Referrals = () => {
  const [copied, setCopied] = useState(false);
  const referralLink = "https://microleaguecoin.com/ref/0x742d3f4a";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout userType="user">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Referral Program</h1>
          <p className="text-muted-foreground">Earn rewards by inviting others to participate</p>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-3xl font-bold text-foreground">8</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rewards Earned</p>
                <p className="text-3xl font-bold text-success">2,400</p>
                <p className="text-xs text-muted-foreground">MLC tokens</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reward Rate</p>
                <p className="text-3xl font-bold text-accent">5%</p>
                <p className="text-xs text-muted-foreground">of purchase</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Referral Link */}
        <Card className="p-6 border-border bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Your Referral Link</h3>
          <p className="text-muted-foreground mb-4">
            Share this link with your friends and earn 5% of their token purchases as rewards!
          </p>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="bg-background border-border font-mono"
            />
            <Button
              onClick={copyToClipboard}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </Card>

        {/* How It Works */}
        <Card className="p-6 border-border bg-card">
          <h3 className="text-xl font-semibold mb-6 text-foreground">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Share Your Link</h4>
              <p className="text-sm text-muted-foreground">
                Copy and share your unique referral link with friends and community
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">They Purchase</h4>
              <p className="text-sm text-muted-foreground">
                When someone uses your link to buy tokens, it's tracked automatically
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Earn Rewards</h4>
              <p className="text-sm text-muted-foreground">
                Receive 5% of their purchase amount as bonus MLC tokens
              </p>
            </div>
          </div>
        </Card>

        {/* Referral History */}
        <Card className="p-6 border-border bg-card">
          <h3 className="text-xl font-semibold mb-6 text-foreground">Referral History</h3>
          <div className="space-y-3">
            {[
              { wallet: "0x8a3b...9c2d", purchase: "50,000", reward: "2,500", date: "2 days ago", status: "Credited" },
              { wallet: "0x5e7f...1a8b", purchase: "30,000", reward: "1,500", date: "5 days ago", status: "Credited" },
              { wallet: "0x9d4c...6e3a", purchase: "25,000", reward: "1,250", date: "1 week ago", status: "Credited" },
              { wallet: "0x3f2a...8d5c", purchase: "20,000", reward: "1,000", date: "1 week ago", status: "Credited" },
              { wallet: "0x7b5e...4f9a", purchase: "15,000", reward: "750", date: "2 weeks ago", status: "Credited" },
            ].map((ref, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-foreground">{ref.wallet}</p>
                    <p className="text-sm text-muted-foreground">{ref.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-success">+{ref.reward} MLC</p>
                  <p className="text-sm text-muted-foreground">from {ref.purchase} purchase</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Referrals;
