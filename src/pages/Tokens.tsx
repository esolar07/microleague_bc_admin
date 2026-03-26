import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Lock, Unlock } from "lucide-react";

const Tokens = () => {
  return (
    <DashboardLayout userType="user">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">My Tokens</h1>
          <p className="text-muted-foreground">View and manage your MLC token holdings</p>
        </div>

        {/* Token Balance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 border-border bg-card col-span-2">
            <h3 className="text-xl font-semibold mb-6 text-foreground">Token Balance</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Purchased</p>
                  <p className="text-3xl font-bold text-foreground">50,000 MLC</p>
                </div>
                <Unlock className="w-12 h-12 text-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-sm text-muted-foreground mb-2">Claimed</p>
                  <p className="text-2xl font-bold text-success">15,000</p>
                  <p className="text-xs text-muted-foreground mt-1">30% of total</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-sm text-muted-foreground mb-2">Locked</p>
                  <p className="text-2xl font-bold text-accent">35,000</p>
                  <p className="text-xs text-muted-foreground mt-1">70% of total</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Vesting Progress</span>
                  <span className="font-semibold text-foreground">30%</span>
                </div>
                <Progress value={30} className="h-3" />
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Claim Available Tokens (5,000 MLC)
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card">
            <h3 className="text-xl font-semibold mb-6 text-foreground">Quick Stats</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Average Purchase Price</p>
                <p className="text-xl font-bold text-foreground">$0.045</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Total Invested</p>
                <p className="text-xl font-bold text-foreground">$2,250</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Current Value</p>
                <p className="text-xl font-bold text-success">$2,500</p>
                <p className="text-xs text-success mt-1">+$250 (11.1%)</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Vesting Schedule */}
        <Card className="p-6 border-border bg-card">
          <h3 className="text-xl font-semibold mb-6 text-foreground">Vesting Schedule</h3>
          <div className="space-y-4">
            {[
              { date: "Nov 25, 2025", amount: "5,000", status: "claimed", unlock: 10 },
              { date: "Dec 25, 2025", amount: "5,000", status: "available", unlock: 20 },
              { date: "Jan 25, 2026", amount: "10,000", status: "locked", unlock: 40 },
              { date: "Feb 25, 2026", amount: "10,000", status: "locked", unlock: 60 },
              { date: "Mar 25, 2026", amount: "10,000", status: "locked", unlock: 80 },
              { date: "Apr 25, 2026", amount: "10,000", status: "locked", unlock: 100 },
            ].map((schedule, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  schedule.status === "claimed"
                    ? "border-success/20 bg-success/5"
                    : schedule.status === "available"
                    ? "border-primary/20 bg-primary/5"
                    : "border-border bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      schedule.status === "claimed"
                        ? "bg-success/20"
                        : schedule.status === "available"
                        ? "bg-primary/20"
                        : "bg-muted"
                    }`}
                  >
                    {schedule.status === "locked" ? (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Unlock className={`w-5 h-5 ${schedule.status === "claimed" ? "text-success" : "text-primary"}`} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="font-semibold text-foreground">{schedule.date}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{schedule.amount} MLC ({schedule.unlock}% unlock)</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    schedule.status === "claimed"
                      ? "bg-success/20 text-success"
                      : schedule.status === "available"
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {schedule.status === "claimed" ? "Claimed" : schedule.status === "available" ? "Available" : "Locked"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Purchase History */}
        <Card className="p-6 border-border bg-card">
          <h3 className="text-xl font-semibold mb-6 text-foreground">Purchase History</h3>
          <div className="space-y-3">
            {[
              { stage: "Stage 2", tokens: "30,000", price: "$0.05", total: "$1,500", date: "Nov 20, 2025" },
              { stage: "Stage 1", tokens: "20,000", price: "$0.03", total: "$600", date: "Nov 10, 2025" },
            ].map((purchase, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div>
                  <p className="font-semibold text-foreground">{purchase.tokens} MLC</p>
                  <p className="text-sm text-muted-foreground">{purchase.stage} • {purchase.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{purchase.total}</p>
                  <p className="text-sm text-muted-foreground">{purchase.price} per token</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Tokens;
