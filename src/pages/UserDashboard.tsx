import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Coins, Users, Trophy, Clock } from "lucide-react";

const UserDashboard = () => {
  return (
    <DashboardLayout userType="user">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome Back!</h1>
          <p className="text-muted-foreground">Manage your MLC holdings and track your investments</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Purchased"
            value="50,000"
            icon={Coins}
            trend={{ value: "12.5%", isPositive: true }}
          />
          <StatsCard
            title="Tokens Claimed"
            value="15,000"
            icon={Trophy}
          />
          <StatsCard
            title="Referrals"
            value="8"
            icon={Users}
            trend={{ value: "2 new", isPositive: true }}
          />
          <StatsCard
            title="Next Unlock"
            value="7 days"
            icon={Clock}
          />
        </div>

        {/* Token Summary & Claim */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 border-border bg-card">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Token Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Purchased</span>
                <span className="font-semibold text-foreground">50,000 MLC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Claimed</span>
                <span className="font-semibold text-success">15,000 MLC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-semibold text-primary">35,000 MLC</span>
              </div>
              <Progress value={30} className="h-2" />
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Claim Available Tokens
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Vesting Schedule</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cliff Period</span>
                  <span className="text-sm font-semibold text-foreground">30 days</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Vesting Duration</span>
                  <span className="text-sm font-semibold text-foreground">180 days</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Release Frequency</span>
                  <span className="text-sm font-semibold text-foreground">Monthly</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Next Unlock Date</span>
                  <span className="text-sm font-semibold text-primary">Dec 25, 2025</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Current Presale Stage */}
        <Card className="p-6 border-border bg-card">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Current Presale Stage</h3>
              <p className="text-muted-foreground">Stage 2 of 5</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">$0.05</p>
              <p className="text-sm text-muted-foreground">per token</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-foreground">2,500,000 / 5,000,000 MLC</span>
            </div>
            <Progress value={50} className="h-3" />
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Soft Cap</p>
                <p className="text-lg font-semibold text-foreground">$100,000</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Hard Cap</p>
                <p className="text-lg font-semibold text-foreground">$250,000</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-accent/10 border border-accent/20 mt-6">
              <div>
                <p className="text-sm text-muted-foreground">Next Stage In</p>
                <p className="text-xl font-bold text-accent">3d 14h 22m</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Buy Tokens
              </Button>
            </div>
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="p-6 border-border bg-card">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Recent Transactions</h3>
          <div className="space-y-3">
            {[
              { type: "Purchase", amount: "10,000 MLC", date: "2 days ago", status: "Completed" },
              { type: "Claim", amount: "5,000 MLC", date: "5 days ago", status: "Completed" },
              { type: "Referral Reward", amount: "500 MLC", date: "1 week ago", status: "Completed" },
            ].map((tx, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tx.type}</p>
                    <p className="text-sm text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{tx.amount}</p>
                  <p className="text-sm text-success">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
