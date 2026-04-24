import { useState, useEffect, useMemo } from "react";
import {
  useBankTransfers,
  useBankTransferStats,
  useVerifyBankTransfer,
} from "@/hooks/useBankTransfers";
import { BankTransferStatus } from "@/types/bank-transfer.interface";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCreateBankTransfer } from "@/hooks/useBankTransfers";
import { useToast } from "@/components/ui/use-toast";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import {
  tokenPresaleAddress,
  tokenPresaleAbi,
} from "@/lib/contracts/tokenPresale";

import {
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Download,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Paginate } from "@/components/ui/paginate";
import { formatNumber } from "@/lib/utils";

const AdminVerifications = () => {
  const { address } = useAccount();
  const { toast } = useToast();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [verificationNote, setVerificationNote] = useState("");
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [tokenAmount, setTokenAmount] = useState<string>("");
  const [tokenAmountManuallyEdited, setTokenAmountManuallyEdited] = useState(false);
  const [transactionHash, setTransactionHash] = useState<
    `0x${string}` | undefined
  >(undefined);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    walletAddress: "",
    amount: "",
    senderName: "",
    bankName: "",
    transactionRef: "",
    paymentRef: "",
    proofUrl: "",
    notes: "",
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  const initialFilters = {
    search: "",
    status: BankTransferStatus.ALL,
    page: 1,
    limit: 10,
    sort: "date-desc",
  };

  const [filters, setFilters] = useState(initialFilters);

  // Upload proof file directly to Cloudinary
  const uploadProofFile = async (file: File): Promise<string> => {
    const CLOUDINARY_CLOUD_NAME = "dnyafkpqs";
    const CLOUDINARY_UPLOAD_PRESET = "microleague_bank_transfer"; // You may need to create this in Cloudinary

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "bank-transfers"); // Organize uploads in a folder

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          (err as any).error?.message || "Failed to upload to Cloudinary",
        );
      }

      const result = (await response.json()) as any;
      return result.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };

  // Fetch sale token decimals
  const { data: saleTokenDecimals } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "saleTokenDecimals",
  });

  const decimals = saleTokenDecimals ? Number(saleTokenDecimals) : 18;

  // Fetch stages count
  const { data: stagesCount, refetch: refetchStageCount } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "stagesCount",
  });

  const totalStages = stagesCount ? Number(stagesCount) : 0;

  // Create array of stage indexes
  const stageIndexes = useMemo(
    () => Array.from({ length: totalStages }, (_, index) => index),
    [totalStages],
  );

  // Prepare contracts for batch reading
  const contracts = useMemo(
    () =>
      stageIndexes.map((index) => ({
        address: tokenPresaleAddress,
        abi: tokenPresaleAbi,
        functionName: "getStage",
        args: [BigInt(index)],
      })),
    [stageIndexes],
  );

  // Fetch all stages
  const { data: stageContracts, refetch: refetchStageContracts } =
    useReadContracts({
      allowFailure: true,
      contracts: contracts as any,
      query: { enabled: totalStages > 0 },
    } as any);

  // Parse stages data
  const stages = useMemo(() => {
    if (!stageContracts || stageContracts.length === 0) {
      return [];
    }

    return stageContracts
      .map((stageContract, index) => {
        const result = stageContract?.result as any;
        if (!result) {
          return undefined;
        }

        const priceUsd = parseFloat(formatUnits(result.price, 18));

        return {
          id: index,
          name: `Stage ${index + 1}`,
          price: priceUsd,
          startTime: result.startTime,
          endTime: result.endTime,
          raw: result,
        };
      })
      .filter(Boolean);
  }, [stageContracts]);

  // Auto-calculate token amount from transaction dollar amount and selected stage price
  useEffect(() => {
    if (tokenAmountManuallyEdited) return;
    if (!selectedTransaction || !selectedStageId) return;
    const stage = stages.find((s: any) => s.id.toString() === selectedStageId);
    if (!stage || stage.price <= 0) return;
    const dollars = parseFloat(selectedTransaction.amount);
    if (isNaN(dollars) || dollars <= 0) return;
    setTokenAmount((dollars / stage.price).toFixed(4));
  }, [selectedStageId, selectedTransaction, stages, tokenAmountManuallyEdited]);

  // Contract write hook
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  // Wait for transaction receipt
  const {
    data: transactionReceipt,
    error: waitError,
    isLoading: isWaitingForReceipt,
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
    confirmations: 1,
    query: {
      enabled: Boolean(transactionHash),
    },
  });

  // API calls using React Query
  const {
    data: bankTransfersData,
    isLoading,
    isError,
    refetch,
  } = useBankTransfers(filters);

  const { data: statsData } = useBankTransferStats();
  const verifyMutation = useVerifyBankTransfer();

  // Handle filter changes
  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value as BankTransferStatus,
      page: 1,
    }));
  };

  const handleSortChange = (value: string) => {
    setFilters((prev) => ({ ...prev, sort: value }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "All" ||
    filters.sort !== "date-desc";

  // Reset all states
  const resetStates = () => {
    setIsAllocationDialogOpen(false);
    setIsReviewDialogOpen(false);
    setSelectedStageId("");
    setTokenAmount("");
    setTokenAmountManuallyEdited(false);
    setTransactionHash(undefined);
    setVerificationNote("");
    setSelectedTransaction(null);
  };

  // Handle opening allocation dialog
  const handleOpenAllocationDialog = () => {
    setTokenAmountManuallyEdited(false);
    setIsAllocationDialogOpen(true);
  };

  // Handle token allocation
  const handleAllocateTokens = async () => {
    if (!selectedTransaction || !selectedStageId || !tokenAmount) {
      toast({
        title: "Missing Information",
        description: "Please select a stage and enter token amount",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert token amount to proper decimals
      const tokenAmountBigInt = parseUnits(tokenAmount, decimals);

      console.log("Allocating tokens:", {
        buyer: selectedTransaction.walletAddress,
        stageId: selectedStageId,
        tokenAmount: tokenAmountBigInt.toString(),
      });

      // Call adminAddPurchase contract function
      const hash = await writeContractAsync({
        address: tokenPresaleAddress,
        abi: tokenPresaleAbi,
        functionName: "adminAddPurchase",
        args: [
          selectedTransaction.walletAddress as `0x${string}`,
          BigInt(selectedStageId),
          tokenAmountBigInt,
        ],
        account: address,
        chain: undefined,
      });

      setTransactionHash(hash);

      toast({
        title: "Transaction Submitted",
        description: "Waiting for blockchain confirmation...",
      });
    } catch (error) {
      console.error("Allocation error:", error);
      const description =
        error instanceof Error
          ? error.message
          : "Failed to allocate tokens. Please try again.";

      toast({
        title: "Allocation Failed",
        description,
        variant: "destructive",
      });
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (transactionReceipt && selectedTransaction) {
      toast({
        title: "Tokens Allocated",
        description: "Tokens have been successfully allocated to the buyer.",
      });

      // Now verify the bank transfer with transaction hash
      verifyMutation.mutate(
        {
          id: selectedTransaction.id,
          data: {
            status: BankTransferStatus.VERIFIED,
            verificationNote,
            transactionHash: transactionHash,
            allocatedTokens: tokenAmount,
            // stageId: selectedStageId,
          },
        },
        {
          onSuccess: () => {
            toast({
              title: "Bank Transfer Verified",
              description:
                "The bank transfer has been approved and tokens allocated.",
            });
            // Reset all states and close dialogs
            resetStates();
          },
          onError: (error) => {
            toast({
              title: "Verification Failed",
              description:
                "Failed to update bank transfer status. Please try again.",
              variant: "destructive",
            });
            console.error("Verification error:", error);
          },
        },
      );
    }
  }, [transactionReceipt]);

  // Handle transaction error
  useEffect(() => {
    if (waitError) {
      const description =
        waitError instanceof Error
          ? waitError.message
          : "Transaction failed. Please try again.";

      toast({
        title: "Transaction Failed",
        description,
        variant: "destructive",
      });

      setTransactionHash(undefined);
    }
  }, [waitError]);

  // Handle reject (admin approval without blockchain transaction)
  const handleReject = () => {
    if (!selectedTransaction) return;

    verifyMutation.mutate(
      {
        id: selectedTransaction.id,
        data: {
          status: BankTransferStatus.REJECTED,
          verificationNote,
          // No transactionHash for rejections
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Transfer Rejected",
            description: "The bank transfer has been rejected.",
          });
          resetStates();
        },
        onError: (error) => {
          toast({
            title: "Rejection Failed",
            description: "Failed to reject bank transfer. Please try again.",
            variant: "destructive",
          });
          console.error("Rejection error:", error);
        },
      },
    );
  };

  // Stats with fallback
  const stats = statsData?.data?.data || {
    pending: 0,
    verified: 0,
    rejected: 0,
    totalAmount: 0,
  };

  const createMutation = useCreateBankTransfer();

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setProofFile(null);
      setFormData((prev) => ({ ...prev, proofUrl: "" }));
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setProofFile(file);
    setIsUploadingProof(true);

    try {
      const uploadedUrl = await uploadProofFile(file);

      setFormData((prev) => ({ ...prev, proofUrl: uploadedUrl }));

      toast({
        title: "Success",
        description: "Proof file uploaded successfully to Cloudinary",
      });
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "Upload Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload proof file",
        variant: "destructive",
      });
      setProofFile(null);
    } finally {
      setIsUploadingProof(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      walletAddress: "",
      amount: "",
      senderName: "",
      bankName: "",
      transactionRef: "",
      paymentRef: "",
      proofUrl: "",
      notes: "",
    });
    setProofFile(null);
  };

  const handleCreateTransfer = () => {
    // Validation
    if (
      !formData.walletAddress ||
      !formData.amount ||
      !formData.senderName ||
      !formData.bankName ||
      !formData.transactionRef ||
      !formData.paymentRef
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate proof file upload
    if (!formData.proofUrl) {
      toast({
        title: "Missing Proof File",
        description: "Please upload a transaction proof image",
        variant: "destructive",
      });
      return;
    }

    // Validate wallet address format
    if (!formData.walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast({
        title: "Invalid Wallet Address",
        description: "Please enter a valid Ethereum wallet address",
        variant: "destructive",
      });
      return;
    }

    // Validate amount
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    // Handle file upload - in a real app, you'd upload to Cloudinary
    const proofUrl = formData.proofUrl || "/uploads/proof.jpg";

    createMutation.mutate(
      {
        walletAddress: formData.walletAddress,
        amount: amount,
        senderName: formData.senderName,
        bankName: formData.bankName,
        transactionRef: formData.transactionRef,
        paymentRef: formData.paymentRef,
        submittedDate: new Date().toISOString(),
        proofUrl: proofUrl,
        notes: formData.notes,
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Bank transfer created successfully",
          });
          resetFormData();
          setIsCreateDialogOpen(false);
          refetch();
        },
        onError: (error) => {
          toast({
            title: "Error",
            description:
              error instanceof Error
                ? error.message
                : "Failed to create bank transfer",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleSubmit = (data: any) => {
    createMutation.mutate({
      walletAddress: "0x742d35f8a9b3c4e1d2f6a8e7c9b5d4a3f2e1d0c9",
      amount: 1000,
      senderName: "Saqib Javed",
      bankName: "Chase Bank",
      transactionRef: "CHB1234567898",
      paymentRef: "MLC-ABC123XY1Z",
      submittedDate: new Date().toISOString(),
      proofUrl: "/uploads/proof.jpg",
      notes: "Transfer completed on Nov 22",
    });
  };

  // Bank transfers with fallback
  const bankTransfers = bankTransfersData?.data?.data?.data || [];

  const pagination = bankTransfersData?.data?.data?.pagination || {
    totalCount: 0,
    totalPages: 0,
    page: 2,
    limit: 10,
  };

  const isProcessing =
    isWriting || isWaitingForReceipt || verifyMutation.isPending;

  if (isError) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Failed to load bank transfers</p>
          <Button onClick={() => refetch()} className="ml-4">
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8">
        <div className="flex justify-between">
          <div className="">
            <h1 className="text-[22px] font-bold text-foreground mb-1">
              Bank Transfer Verifications
            </h1>
            <p className="text-muted-foreground text-sm">
              Review and verify bank transfer transaction proofs
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>Create Bank Transfer</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Create Bank Transfer
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Fill in the details to create a new bank transfer record
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Wallet Address */}
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">
                    Wallet Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="walletAddress"
                    placeholder="0x..."
                    value={formData.walletAddress}
                    onChange={(e) =>
                      handleFormChange("walletAddress", e.target.value)
                    }
                    className="bg-background border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Valid Ethereum wallet address (0x...)
                  </p>
                </div>

                {/* Amount and Sender Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">
                      Amount (USD) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="1000"
                      value={formData.amount}
                      onChange={(e) =>
                        handleFormChange("amount", e.target.value)
                      }
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senderName">
                      Sender Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="senderName"
                      placeholder="John Doe"
                      value={formData.senderName}
                      onChange={(e) =>
                        handleFormChange("senderName", e.target.value)
                      }
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                {/* Bank Name and Transaction Ref */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">
                      Bank Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="bankName"
                      placeholder="Chase Bank"
                      value={formData.bankName}
                      onChange={(e) =>
                        handleFormChange("bankName", e.target.value)
                      }
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transactionRef">
                      Transaction Ref{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="transactionRef"
                      placeholder="CHB1234567898"
                      value={formData.transactionRef}
                      onChange={(e) =>
                        handleFormChange("transactionRef", e.target.value)
                      }
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                {/* Payment Ref */}
                <div className="space-y-2">
                  <Label htmlFor="paymentRef">
                    Payment Ref <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="paymentRef"
                    placeholder="MLC-ABC123XY1Z"
                    value={formData.paymentRef}
                    onChange={(e) =>
                      handleFormChange("paymentRef", e.target.value)
                    }
                    className="bg-background border-border"
                  />
                </div>

                {/* Proof File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="proofFile">Transaction Proof (Image)</Label>
                  <div className="space-y-2">
                    <Input
                      id="proofFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileChange(e.target.files?.[0] || null)
                      }
                      disabled={isUploadingProof}
                      className="bg-background border-border"
                    />
                    <p className="text-xs text-muted-foreground">
                      Accepted formats: JPG, PNG, GIF. Max size: 5MB
                    </p>
                    {isUploadingProof && (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin">
                          <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Uploading file...
                        </span>
                      </div>
                    )}
                    {proofFile && formData.proofUrl && (
                      <div className="flex items-center gap-2 p-2 bg-success/10 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <div>
                          <p className="text-sm font-medium text-success">
                            {proofFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Upload successful
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this transfer..."
                    value={formData.notes}
                    onChange={(e) => handleFormChange("notes", e.target.value)}
                    className="bg-background border-border"
                    rows={3}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetFormData();
                    }}
                    disabled={createMutation.isPending || isUploadingProof}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTransfer}
                    disabled={createMutation.isPending || isUploadingProof}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {createMutation.isPending
                      ? "Creating..."
                      : "Create Transfer"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="cardShadow bg-white p-5 rounded-[20px] hover:border-primary/30 transition-all flex items-center justify-between gap-1">
            <div className="flex items-center gap-3 justify-between w-full">
              <div>
                <p className="text-sm text-muted-foreground ">Pending</p>
                <p className="text-2xl font-semibold text-primary">
                  {stats.pending}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
            </div>
          </Card>
          <Card className="cardShadow bg-white p-5 rounded-[20px] hover:border-primary/30 transition-all flex items-center justify-between gap-1">
            <div className="flex items-center gap-3 justify-between w-full">
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-semibold text-success">
                  {stats.verified}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
            </div>
          </Card>
          <Card className="cardShadow bg-white p-5 rounded-[20px] hover:border-primary/30 transition-all flex items-center justify-between gap-1">
            <div className="flex items-center gap-3 justify-between w-full">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-semibold text-destructive">
                  {stats.rejected}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </Card>
          <Card className="cardShadow bg-white p-5 rounded-[20px] hover:border-primary/30 transition-all flex items-center justify-between gap-1">
            <div className="flex items-center gap-3 justify-between w-full">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-semibold text-primary">
                  {formatNumber(stats.totalAmount)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="cardShadow bg-white p-5 rounded-[20px]">
          <div className="space-y-2">
            <div className="flex items-center h-8 justify-between">
              <h3 className="text-lg font-medium text-foreground">Filters</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, wallet, or reference..."
                  className="pl-9 bg-background border-border"
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <Select value={filters.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value={BankTransferStatus.PENDING}>
                    Pending
                  </SelectItem>
                  <SelectItem value={BankTransferStatus.VERIFIED}>
                    Verified
                  </SelectItem>
                  <SelectItem value={BankTransferStatus.REJECTED}>
                    Rejected
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.sort} onValueChange={handleSortChange}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="amount-desc">Highest Amount</SelectItem>
                  <SelectItem value="amount-asc">Lowest Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Verifications Table */}
        <Card className="cardShadow bg-white p-5 rounded-[20px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  Transaction ID
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Wallet Address
                </TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">Sender</TableHead>
                <TableHead className="text-muted-foreground">Bank</TableHead>
                <TableHead className="text-muted-foreground">
                  Submitted
                </TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading bank transfers...
                  </TableCell>
                </TableRow>
              ) : bankTransfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No bank transfers found
                  </TableCell>
                </TableRow>
              ) : (
                bankTransfers?.map((transfer) => (
                  <TableRow
                    key={transfer.id}
                    className="border-border hover:bg-muted/50"
                  >
                    <TableCell className="font-mono text-sm font-semibold text-foreground">
                      {transfer.id}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {transfer.walletAddress.slice(0, 10)}...
                      {transfer.walletAddress.slice(-8)}
                    </TableCell>
                    <TableCell className="font-semibold text-success">
                      ${transfer.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {transfer.senderName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transfer.bankName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {transfer.transactionRef}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(transfer.submittedDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          transfer.status === BankTransferStatus.PENDING
                            ? "border-yellow-600 text-yellow-600 bg-yellow-100"
                            : transfer.status === BankTransferStatus.VERIFIED
                              ? "border-success text-success bg-success/10"
                              : "border-destructive text-destructive bg-destructive/10"
                        }
                      >
                        {transfer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog
                          open={
                            isReviewDialogOpen &&
                            selectedTransaction?.id === transfer.id
                          }
                          onOpenChange={(open) => {
                            setIsReviewDialogOpen(open);
                            if (!open) {
                              resetStates();
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border hover:border-primary/50"
                              onClick={() => {
                                setSelectedTransaction(transfer);
                                setIsReviewDialogOpen(true);
                              }}
                              disabled={
                                transfer.status !== BankTransferStatus.PENDING
                              }
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl bg-card border-border">
                            <DialogHeader>
                              <DialogTitle className="text-foreground">
                                Review Bank Transfer - {selectedTransaction?.id}
                              </DialogTitle>
                              <DialogDescription className="text-muted-foreground">
                                Verify the transaction details and proof before
                                approving
                              </DialogDescription>
                            </DialogHeader>
                            {selectedTransaction && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <Label className="text-muted-foreground">
                                      Amount
                                    </Label>
                                    <p className="text-lg font-semibold text-success">
                                      $
                                      {selectedTransaction.amount.toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-muted-foreground">
                                      Transaction Ref
                                    </Label>
                                    <p className="font-mono text-sm text-foreground">
                                      {selectedTransaction.transactionRef}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-muted-foreground">
                                      Sender Name
                                    </Label>
                                    <p className="text-foreground">
                                      {selectedTransaction.senderName}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-muted-foreground">
                                      Bank Name
                                    </Label>
                                    <p className="text-foreground">
                                      {selectedTransaction.bankName}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-muted-foreground">
                                      Wallet Address
                                    </Label>
                                    <p className="font-mono text-xs text-foreground break-all">
                                      {selectedTransaction.walletAddress}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-muted-foreground">
                                    Transaction Proof
                                  </Label>
                                  <div className="border border-border rounded-lg overflow-hidden">
                                    <img
                                      src={selectedTransaction.proofUrl}
                                      alt="Transaction proof"
                                      className="w-full h-64 object-cover"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="verificationNote">
                                    Verification Notes
                                  </Label>
                                  <Textarea
                                    id="verificationNote"
                                    placeholder="Add notes about this verification..."
                                    value={verificationNote}
                                    onChange={(e) =>
                                      setVerificationNote(e.target.value)
                                    }
                                    className="bg-background border-border"
                                    disabled={isProcessing}
                                  />
                                </div>

                                <div className="flex gap-3">
                                  <Button
                                    onClick={handleOpenAllocationDialog}
                                    disabled={isProcessing}
                                    className="flex-1 bg-success hover:bg-success/90 text-white"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {isProcessing
                                      ? "Processing..."
                                      : "Approve & Allocate Tokens"}
                                  </Button>
                                  <Button
                                    onClick={handleReject}
                                    disabled={isProcessing}
                                    variant="outline"
                                    className="flex-1 border-destructive hover:bg-destructive/10 hover:text-red-800"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    {isProcessing ? "Processing..." : "Reject"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Token Allocation Dialog */}
        <Dialog
          open={isAllocationDialogOpen}
          onOpenChange={(open) => {
            if (!isProcessing) {
              setIsAllocationDialogOpen(open);
            }
          }}
        >
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Allocate Tokens
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Select the stage and enter the number of tokens to allocate to
                this buyer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Select Presale Stage</Label>
                <Select
                  value={selectedStageId}
                  onValueChange={setSelectedStageId}
                  disabled={isProcessing}
                >
                  <SelectTrigger
                    id="stage"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Choose a stage..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No stages available
                      </div>
                    ) : (
                      stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{stage.name}</span>
                            <span className="ml-3">
                              {formatNumber(stage.price, 4)} per token
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose which presale stage to allocate tokens from
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokenAmount">Token Amount</Label>
                <Input
                  id="tokenAmount"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="Enter token amount..."
                  value={tokenAmount}
                  onChange={(e) => {
                    setTokenAmountManuallyEdited(true);
                    setTokenAmount(e.target.value);
                  }}
                  className="bg-background border-border"
                  disabled={isProcessing}
                />
                {selectedStageId && selectedTransaction && (() => {
                  const stage = stages.find((s: any) => s.id.toString() === selectedStageId);
                  return stage ? (
                    <p className="text-xs text-muted-foreground">
                      ${selectedTransaction.amount.toLocaleString()} ÷ ${parseFloat(stage.price.toFixed(6))}/token
                      {tokenAmountManuallyEdited && (
                        <button
                          type="button"
                          className="ml-2 text-primary underline"
                          onClick={() => setTokenAmountManuallyEdited(false)}
                        >
                          recalculate
                        </button>
                      )}
                    </p>
                  ) : null;
                })()}
                {!selectedStageId && (
                  <p className="text-xs text-muted-foreground">
                    Select a stage to auto-calculate tokens from the transfer amount
                  </p>
                )}
              </div>

              {selectedTransaction && (
                <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Allocating to:
                  </p>
                  <p className="font-mono text-xs text-foreground break-all">
                    {selectedTransaction.walletAddress}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAllocationDialogOpen(false)}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAllocateTokens}
                  disabled={!selectedStageId || !tokenAmount || isProcessing}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isProcessing ? "Processing..." : "Allocate Tokens"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pagination */}
        <Paginate
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          limit={pagination.limit}
          onPageChange={(newPage) =>
            setFilters((prev) => ({ ...prev, page: newPage }))
          }
          showInfo={true}
          disabled={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminVerifications;
