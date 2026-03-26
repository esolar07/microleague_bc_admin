import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Shield, User, Wallet } from "lucide-react";

const UserSettings = () => {
  return (
    <DashboardLayout userType="user">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and security settings</p>
        </div>

        {/* Profile Settings */}
        <Card className="p-6 border-border bg-card">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">Profile Information</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="Enter username" 
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="your@email.com" 
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input 
                id="bio" 
                placeholder="Tell us about yourself" 
                className="bg-background border-border"
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Changes
            </Button>
          </div>
        </Card>

        {/* Wallet Settings */}
        <Card className="p-6 border-border bg-card">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">Wallet Connection</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
              <div>
                <p className="font-semibold text-foreground">Connected Wallet</p>
                <p className="text-sm font-mono text-muted-foreground mt-1">0x742d35f8a9b3c4e1d2f6a8e7c9b5d4a3f2e1d0c9</p>
              </div>
              <Button variant="outline" className="border-border hover:border-destructive/50 text-destructive">
                Disconnect
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Your wallet is used to receive tokens and participate in the presale. Disconnecting will require reconnection for future transactions.
            </p>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6 border-border bg-card">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">Notifications</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates about your transactions and claims</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Referral Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified when someone uses your referral link</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Stage Updates</p>
                <p className="text-sm text-muted-foreground">Alerts about presale stage changes and deadlines</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Vesting Reminders</p>
                <p className="text-sm text-muted-foreground">Reminders when tokens are available to claim</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6 border-border bg-card">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">Security</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline" className="border-border hover:border-primary/50">
                Enable
              </Button>
            </div>
            <Separator className="bg-border" />
            <div className="space-y-3">
              <p className="font-medium text-foreground">Change Password</p>
              <div className="space-y-3">
                <Input 
                  type="password" 
                  placeholder="Current password" 
                  className="bg-background border-border"
                />
                <Input 
                  type="password" 
                  placeholder="New password" 
                  className="bg-background border-border"
                />
                <Input 
                  type="password" 
                  placeholder="Confirm new password" 
                  className="bg-background border-border"
                />
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Update Password
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-destructive/50 bg-card">
          <h3 className="text-xl font-semibold text-destructive mb-4">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white">
              Delete Account
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserSettings;
