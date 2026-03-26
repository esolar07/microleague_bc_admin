import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Upload, FileText, CheckCircle, Copy } from "lucide-react";
import { toast } from "sonner";

const BankTransfer = () => {
  const [formData, setFormData] = useState({
    amount: "",
    transactionRef: "",
    senderName: "",
    bankName: "",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      toast.success(`${e.target.files[0].name} ready to upload`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error("Please upload a transaction proof");
      return;
    }

    // Simulate submission
    setIsSubmitted(true);
    toast.success("Your bank transfer proof has been submitted for verification");
  };

  const bankDetails = {
    accountName: "Microleague Coin Ltd.",
    accountNumber: "1234567890",
    bankName: "Global Crypto Bank",
    swiftCode: "GCBKUS33XXX",
    reference: "MLC-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (isSubmitted) {
    return (
      <DashboardLayout userType="user">
        <div className="max-w-2xl mx-auto space-y-8">
          <Card className="p-8 border-border bg-card text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Submission Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Your bank transfer proof has been submitted and is awaiting verification by our team.
              You will be notified once your transaction is confirmed.
            </p>
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Reference Number</p>
              <p className="font-mono text-lg font-semibold text-foreground">{bankDetails.reference}</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="flex-1 border-border hover:border-primary/50"
              >
                Submit Another
              </Button>
              <Button 
                onClick={() => window.location.href = '/dashboard/transactions'}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                View Transactions
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="user">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Bank Transfer Purchase</h1>
          <p className="text-muted-foreground">Transfer funds and upload your transaction proof</p>
        </div>

        {/* Bank Details */}
        <Card className="p-6 border-border bg-card">
          <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Bank Account Details
          </h3>
          <div className="space-y-3">
            {[
              { label: "Account Name", value: bankDetails.accountName },
              { label: "Account Number", value: bankDetails.accountNumber },
              { label: "Bank Name", value: bankDetails.bankName },
              { label: "SWIFT Code", value: bankDetails.swiftCode },
              { label: "Payment Reference", value: bankDetails.reference },
            ].map((detail) => (
              <div key={detail.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div>
                  <p className="text-sm text-muted-foreground">{detail.label}</p>
                  <p className="font-semibold text-foreground">{detail.value}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(detail.value, detail.label)}
                  className="border-border hover:border-primary/50"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-sm text-accent font-medium">
              ⚠️ Important: Please include the payment reference in your bank transfer to ensure quick processing
            </p>
          </div>
        </Card>

        {/* Typeform Alternative - Custom Form */}
        <Card className="p-6 border-border bg-card">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Submit Transaction Proof</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Transfer Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="1000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionRef">Transaction Reference Number</Label>
              <Input
                id="transactionRef"
                type="text"
                placeholder="Enter your bank's transaction reference"
                value={formData.transactionRef}
                onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                required
                className="bg-background border-border"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senderName">Sender Name</Label>
                <Input
                  id="senderName"
                  type="text"
                  placeholder="Your name as per bank account"
                  value={formData.senderName}
                  onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                  required
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">Your Bank Name</Label>
                <Input
                  id="bankName"
                  type="text"
                  placeholder="Bank name"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  required
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-background border-border min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof">Upload Transaction Proof</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  id="proof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="proof" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  {selectedFile ? (
                    <div>
                      <p className="text-foreground font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-success mt-1">Click to change file</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-foreground font-medium">Click to upload transaction proof</p>
                      <p className="text-sm text-muted-foreground mt-1">PNG, JPG, or PDF (max 5MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Submit for Verification
            </Button>
          </form>
        </Card>

        {/* Typeform Embed Option */}
        <Card className="p-6 border-border bg-card">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Alternative: Use Typeform</h3>
          <p className="text-muted-foreground mb-4">
            Prefer to submit via Typeform? Click the button below to open our submission form.
          </p>
          <Button
            variant="outline"
            className="w-full border-border hover:border-primary/50"
            onClick={() => window.open('https://form.typeform.com/to/your-form-id', '_blank')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Open Typeform Submission
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BankTransfer;
