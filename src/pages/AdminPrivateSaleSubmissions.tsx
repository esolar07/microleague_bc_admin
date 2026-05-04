import { useEffect, useMemo, useState } from "react";
import {
  usePrivateSaleSubmissions,
  usePrivateSaleSubmissionStats,
  useVerifyPrivateSaleSubmission,
  useCreatePrivateSaleSubmission,
} from "@/hooks/usePrivateSaleSubmissions";
import { PrivateSaleSubmissionStatus } from "@/types/private-sale-submission.interface";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  FileText,
  X,
  Plus,
  Upload,
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

const AdminPrivateSaleSubmissions = () => {
  const { address } = useAccount();
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [verificationNote, setVerificationNote] = useState("");
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    contact: "",
    country: "",
    walletAddress: "",
    amount: "",
    paymentMethod: "",
    transactionRef: "",
    paymentReference: "",
    proofUrl: "",
    notes: "",
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [presaleTokenPrice, setPresaleTokenPrice] = useState<string>("");
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [privateSalePrice, setPrivateSalePrice] = useState<string>("0.015");
  const [tokenAmount, setTokenAmount] = useState<string>("");
  const [tokenAmountManuallyEdited, setTokenAmountManuallyEdited] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>(undefined);
  const [filters, setFilters] = useState({
    search: "",
    status: PrivateSaleSubmissionStatus.ALL,
    page: 1,
    limit: 10,
    sort: "date-desc",
  });

  const { data: saleTokenDecimals } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "saleTokenDecimals",
  });

  const decimals = saleTokenDecimals ? Number(saleTokenDecimals) : 18;

  const { data: stagesCount } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "stagesCount",
  });

  const stageIndexes = useMemo(
    () => Array.from({ length: Number(stagesCount || 0) }, (_, index) => index),
    [stagesCount],
  );

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

  const { data: stageContracts } = useReadContracts({
    allowFailure: true,
    contracts: contracts as any,
    query: { enabled: stageIndexes.length > 0 },
  } as any);

  const stages = useMemo(() => {
    if (!stageContracts || stageContracts.length === 0) return [];

    return stageContracts
      .map((stageContract, index) => {
        const result = stageContract?.result as any;
        if (!result) return undefined;

        return {
          id: index,
          name: `Stage ${index + 1}`,
          price: parseFloat(formatUnits(result.price, 18)),
        };
      })
      .filter(Boolean);
  }, [stageContracts]);

  // Sync the declared private sale price into the allocation dialog price field
  useEffect(() => {
    if (!presaleTokenPrice || parseFloat(presaleTokenPrice) <= 0) return;
    setPrivateSalePrice(presaleTokenPrice);
    setTokenAmountManuallyEdited(false);
  }, [presaleTokenPrice]);

  // Recalculate token amount when private sale price changes
  useEffect(() => {
    if (tokenAmountManuallyEdited || !selectedSubmission || !privateSalePrice) return;
    const price = parseFloat(privateSalePrice);
    if (!price || price <= 0) return;
    setTokenAmount(String(parseFloat((selectedSubmission.amount / price).toFixed(4))));
  }, [privateSalePrice, selectedSubmission, tokenAmountManuallyEdited]);

  const tokenDollarValue = useMemo(() => {
    const price = parseFloat(privateSalePrice);
    const tokens = parseFloat(tokenAmount);
    if (!price || !tokens || isNaN(price) || isNaN(tokens)) return null;
    return tokens * price;
  }, [privateSalePrice, tokenAmount]);

  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const {
    data: transactionReceipt,
    error: waitError,
    isLoading: isWaitingForReceipt,
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
    confirmations: 1,
    query: { enabled: Boolean(transactionHash) },
  });

  const { data: submissionsData, isLoading, isError, refetch } =
    usePrivateSaleSubmissions(filters);
  const { data: statsData } = usePrivateSaleSubmissionStats();
  const verifyMutation = useVerifyPrivateSaleSubmission();
  const createMutation = useCreatePrivateSaleSubmission();

  const uploadProofFile = async (file: File): Promise<string> => {
    const CLOUDINARY_CLOUD_NAME = "dnyafkpqs";
    const CLOUDINARY_UPLOAD_PRESET = "microleague_bank_transfer";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "private-sale-proofs");
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData },
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).error?.message || "Failed to upload proof");
    }
    const result = (await response.json()) as any;
    return result.secure_url;
  };

  const handleProofFileChange = async (file: File | null) => {
    if (!file) {
      setProofFile(null);
      setCreateForm((p) => ({ ...p, proofUrl: "" }));
      return;
    }
    setProofFile(file);
    setIsUploadingProof(true);
    try {
      const url = await uploadProofFile(file);
      setCreateForm((p) => ({ ...p, proofUrl: url }));
    } catch {
      toast({ title: "Upload failed", description: "Could not upload proof file.", variant: "destructive" });
      setProofFile(null);
      setCreateForm((p) => ({ ...p, proofUrl: "" }));
    } finally {
      setIsUploadingProof(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      fullName: "",
      email: "",
      contact: "",
      country: "",
      walletAddress: "",
      amount: "",
      paymentMethod: "",
      transactionRef: "",
      paymentReference: "",
      proofUrl: "",
      notes: "",
    });
    setProofFile(null);
    setIsCreateDialogOpen(false);
  };

  const isValidEthAddress = (addr: string) => /^0x[0-9a-fA-F]{40}$/.test(addr);

  const handleCreate = () => {
    const { fullName, email, contact, country, walletAddress, amount } = createForm;
    if (!fullName || !email || !contact || !country || !walletAddress || !amount) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (!isValidEthAddress(walletAddress)) {
      toast({ title: "Invalid wallet address", description: "Please enter a valid Ethereum address (0x followed by 40 hex characters).", variant: "destructive" });
      return;
    }
    createMutation.mutate(
      {
        fullName,
        email,
        contact,
        country,
        walletAddress,
        amount: Number(amount),
        paymentMethod: createForm.paymentMethod || undefined,
        transactionRef: createForm.transactionRef || undefined,
        paymentReference: createForm.paymentReference || undefined,
        proofUrl: createForm.proofUrl || undefined,
        notes: createForm.notes || undefined,
      },
      { onSuccess: resetCreateForm },
    );
  };

  const resetStates = () => {
    setSelectedSubmission(null);
    setVerificationNote("");
    setSelectedStageId("");
    setPrivateSalePrice("");
    setTokenAmount("");
    setTokenAmountManuallyEdited(false);
    setTransactionHash(undefined);
    setIsReviewDialogOpen(false);
    setIsAllocationDialogOpen(false);
  };

  const handleAllocateTokens = async () => {
    if (!selectedSubmission || !selectedStageId || !tokenAmount) {
      toast({
        title: "Missing information",
        description: "Please select a stage and token amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: tokenPresaleAddress,
        abi: tokenPresaleAbi,
        functionName: "adminAddPurchase",
        args: [
          selectedSubmission.walletAddress as `0x${string}`,
          BigInt(selectedStageId),
          parseUnits(tokenAmount, decimals),
          parseUnits(selectedSubmission.amount.toFixed(6), 18),
        ],
        account: address,
        chain: undefined,
      });

      setTransactionHash(hash);
      toast({
        title: "Transaction submitted",
        description: "Waiting for blockchain confirmation...",
      });
    } catch (error) {
      toast({
        title: "Allocation failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!transactionReceipt || !selectedSubmission) return;

    verifyMutation.mutate({
      id: selectedSubmission.id,
      data: {
        status: PrivateSaleSubmissionStatus.APPROVED,
        verificationNote,
        transactionHash,
        allocatedTokens: tokenAmount,
        allocatedStageId: selectedStageId,
      },
    });

    toast({
      title: "Private sale approved",
      description: "Tokens were allocated and the submission was marked approved.",
    });
    resetStates();
  }, [
    selectedStageId,
    selectedSubmission,
    toast,
    tokenAmount,
    transactionHash,
    transactionReceipt,
    verificationNote,
    verifyMutation,
  ]);

  useEffect(() => {
    if (!waitError) return;

    toast({
      title: "Transaction failed",
      description: waitError instanceof Error ? waitError.message : "Please try again.",
      variant: "destructive",
    });
    setTransactionHash(undefined);
  }, [toast, waitError]);

  const handleReject = () => {
    if (!selectedSubmission) return;

    verifyMutation.mutate({
      id: selectedSubmission.id,
      data: {
        status: PrivateSaleSubmissionStatus.REJECTED,
        verificationNote,
      },
    });

    toast({
      title: "Submission rejected",
      description: "The private sale submission was rejected.",
    });
    resetStates();
  };

  const stats =
    submissionsData?.data?.data?.stats ||
    statsData?.data?.data ||
    statsData?.data ||
    { pending: 0, approved: 0, rejected: 0, totalAmount: 0 };

  const submissions = submissionsData?.data?.data?.data || [];
  const pagination = submissionsData?.data?.data?.pagination || {
    totalCount: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
  };
  const isProcessing = isWriting || isWaitingForReceipt || verifyMutation.isPending;

  if (isError) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Failed to load private sale submissions</p>
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-foreground mb-1">
              Private Sale Submissions
            </h1>
            <p className="text-muted-foreground text-sm">
              Review private sale proof uploads and allocate tokens after approval.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <Label htmlFor="presaleTokenPrice" className="text-sm text-muted-foreground whitespace-nowrap">
                Private Sale Price
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="presaleTokenPrice"
                  type="number"
                  step="0.000001"
                  min="0"
                  value={presaleTokenPrice}
                  onChange={(e) => setPresaleTokenPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-7 w-36"
                />
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">/ token</span>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Submission
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard label="Pending" value={stats.pending} icon={<Clock className="w-5 h-5 text-accent" />} />
          <StatsCard label="Approved" value={stats.approved} icon={<CheckCircle className="w-5 h-5 text-success" />} />
          <StatsCard label="Rejected" value={stats.rejected} icon={<XCircle className="w-5 h-5 text-destructive" />} />
          <StatsCard label="Total Value" value={formatNumber(stats.totalAmount)} icon={<FileText className="w-5 h-5 text-primary" />} />
        </div>

        <Card className="cardShadow bg-white p-5 rounded-[20px]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, wallet, name, email, or reference..."
                className="pl-9 bg-background border-border"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                }
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status: value as PrivateSaleSubmissionStatus,
                  page: 1,
                }))
              }
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value={PrivateSaleSubmissionStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={PrivateSaleSubmissionStatus.APPROVED}>Approved</SelectItem>
                <SelectItem value={PrivateSaleSubmissionStatus.REJECTED}>Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.sort}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, sort: value }))}
            >
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
        </Card>

        <Card className="cardShadow bg-white p-5 rounded-[20px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Submission ID</TableHead>
                <TableHead>Investor</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading private sale submissions...
                  </TableCell>
                </TableRow>
              ) : submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No submissions found
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((submission) => (
                  <TableRow key={submission.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-mono text-sm font-semibold text-foreground">
                      {submission.submissionId}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{submission.fullName}</p>
                        <p className="text-xs text-muted-foreground">{submission.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {submission.walletAddress.slice(0, 10)}...{submission.walletAddress.slice(-8)}
                    </TableCell>
                    <TableCell className="font-semibold text-success">
                      ${submission.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{submission.paymentMethod ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(submission.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          submission.status === PrivateSaleSubmissionStatus.PENDING
                            ? "border-yellow-600 text-yellow-600 bg-yellow-100"
                            : submission.status === PrivateSaleSubmissionStatus.APPROVED
                              ? "border-success text-success bg-success/10"
                              : "border-destructive text-destructive bg-destructive/10"
                        }
                      >
                        {submission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog
                        open={isReviewDialogOpen && selectedSubmission?.id === submission.id}
                        onOpenChange={(open) => {
                          setIsReviewDialogOpen(open);
                          if (!open) resetStates();
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-border hover:border-primary/50"
                            disabled={submission.status !== PrivateSaleSubmissionStatus.PENDING}
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setIsReviewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[calc(100%-2rem)] max-w-3xl bg-card border-border max-h-[90vh] flex flex-col">
                          <DialogHeader className="shrink-0">
                            <DialogTitle>Review Private Sale Submission</DialogTitle>
                            <DialogDescription>
                              Verify the proof and investor details before approving allocation.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedSubmission && (
                            <div className="overflow-y-auto flex-1 min-h-0 p-1 space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Detail label="Investor" value={selectedSubmission.fullName} />
                                <Detail label="Email" value={selectedSubmission.email} />
                                <Detail label="Contact" value={selectedSubmission.contact} />
                                <Detail label="Country" value={selectedSubmission.country} />
                                <Detail label="Amount" value={`$${selectedSubmission.amount.toLocaleString()}`} />
                                <Detail label="Payment Method" value={selectedSubmission.paymentMethod ?? '—'} />
                                <Detail label="Reference" value={selectedSubmission.transactionRef ?? '—'} />
                                <Detail label="Wallet" value={selectedSubmission.walletAddress} mono />
                              </div>

                              {selectedSubmission.proofUrl ? (
                                <div className="space-y-2">
                                  <Label className="text-muted-foreground">Proof</Label>
                                  {selectedSubmission.proofUrl.toLowerCase().includes(".pdf") ? (
                                    <a
                                      href={selectedSubmission.proofUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-primary underline"
                                    >
                                      Open uploaded PDF proof
                                    </a>
                                  ) : (
                                    <div className="border border-border rounded-lg overflow-hidden">
                                      <img
                                        src={selectedSubmission.proofUrl}
                                        alt="Private sale proof"
                                        className="w-full h-64 object-cover"
                                      />
                                    </div>
                                  )}
                                </div>
                              ) : null}

                              {selectedSubmission.notes ? (
                                <div className="space-y-2">
                                  <Label className="text-muted-foreground">Submission Notes</Label>
                                  <pre className="text-xs whitespace-pre-wrap bg-muted/40 p-3 rounded-lg border border-border">
                                    {selectedSubmission.notes}
                                  </pre>
                                </div>
                              ) : null}

                              <div className="space-y-2">
                                <Label htmlFor="verificationNote">Verification Notes</Label>
                                <Textarea
                                  id="verificationNote"
                                  value={verificationNote}
                                  onChange={(e) => setVerificationNote(e.target.value)}
                                  placeholder="Add notes about this review..."
                                  disabled={isProcessing}
                                />
                              </div>

                              <div className="flex gap-3">
                                <Button
                                  onClick={() => setIsAllocationDialogOpen(true)}
                                  disabled={isProcessing}
                                  className="flex-1 bg-success hover:bg-success/90 text-white"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve & Allocate
                                </Button>
                                <Button
                                  onClick={handleReject}
                                  disabled={isProcessing}
                                  variant="outline"
                                  className="flex-1 border-destructive hover:bg-destructive/10"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Dialog
          open={isAllocationDialogOpen}
          onOpenChange={(open) => {
            if (!isProcessing) setIsAllocationDialogOpen(open);
          }}
        >
          <DialogContent className="w-[calc(100%-2rem)] max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle>Allocate Tokens</DialogTitle>
              <DialogDescription>
                Pick a stage and confirm the token amount for this private sale buyer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Select Presale Stage</Label>
                <Select value={selectedStageId} onValueChange={setSelectedStageId} disabled={isProcessing}>
                  <SelectTrigger id="stage">
                    <SelectValue placeholder="Choose a stage..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id.toString()}>
                        {stage.name} {"(Private Sale)"}{/* — {formatNumber(stage.price, 6)} per token */}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="privateSalePrice">
                  Private Sale Price ($ per token)
                </Label>
                <Input
                  id="privateSalePrice"
                  type="number"
                  step="0.000001"
                  min="0"
                  value={privateSalePrice}
                  onChange={(e) => {
                    setPrivateSalePrice(e.target.value);
                    setTokenAmountManuallyEdited(false);
                  }}
                  placeholder="Enter custom price..."
                  disabled={isProcessing || !selectedStageId}
                />
                {selectedStageId && privateSalePrice && (() => {
                  const stage = stages.find((s: any) => s.id.toString() === selectedStageId);
                  const price = parseFloat(privateSalePrice);
                  if (!stage || !price) return null;
                  const discount = ((stage.price - price) / stage.price) * 100;
                  if (discount > 0) {
                    return (
                      <p className="text-xs text-success">
                        {discount.toFixed(1)}% discount off the {formatNumber(stage.price, 2)} stage price
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokenAmount">Token Amount</Label>
                <Input
                  id="tokenAmount"
                  type="number"
                  step="0.0001"
                  min="0"
                  value={tokenAmount}
                  onChange={(e) => {
                    setTokenAmountManuallyEdited(true);
                    setTokenAmount(e.target.value);
                  }}
                  disabled={isProcessing || !privateSalePrice}
                />
                {selectedSubmission && privateSalePrice && parseFloat(privateSalePrice) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    <span className="text-foreground font-medium">${selectedSubmission.amount.toLocaleString()}</span> paid
                    {" "}÷{" "}
                    <span className="text-foreground font-medium">{formatNumber(parseFloat(privateSalePrice), 2)}</span>/token
                    {tokenAmount && parseFloat(tokenAmount) > 0 && (
                      <> = <span className="text-foreground font-medium">{parseFloat(tokenAmount).toLocaleString()} MLC</span></>
                    )}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAllocationDialogOpen(false)} disabled={isProcessing} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAllocateTokens} disabled={!selectedStageId || !privateSalePrice || !tokenAmount || isProcessing} className="flex-1">
                  {isProcessing ? "Processing..." : "Allocate Tokens"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Submission Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { if (!createMutation.isPending) { setIsCreateDialogOpen(open); if (!open) resetCreateForm(); } }}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-2xl bg-card border-border max-h-[90vh] flex flex-col">
            <DialogHeader className="shrink-0">
              <DialogTitle>New Private Sale Submission</DialogTitle>
              <DialogDescription>Manually create a private sale record on behalf of an investor.</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 min-h-0 p-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Full Name *">
                  <Input value={createForm.fullName} onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="John Doe" disabled={createMutation.isPending} />
                </FormField>
                <FormField label="Email *">
                  <Input type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} placeholder="john@example.com" disabled={createMutation.isPending} />
                </FormField>
                <FormField label="Contact *">
                  <Input value={createForm.contact} onChange={(e) => setCreateForm((p) => ({ ...p, contact: e.target.value }))} placeholder="+1 555 000 0000" disabled={createMutation.isPending} />
                </FormField>
                <FormField label="Country *">
                  <Input value={createForm.country} onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value }))} placeholder="United States" disabled={createMutation.isPending} />
                </FormField>
                <FormField label="Wallet Address *" className="sm:col-span-2">
                  <Input
                    value={createForm.walletAddress}
                    onChange={(e) => setCreateForm((p) => ({ ...p, walletAddress: e.target.value }))}
                    placeholder="0x..."
                    disabled={createMutation.isPending}
                    className={`font-mono text-sm ${createForm.walletAddress && !isValidEthAddress(createForm.walletAddress) ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {createForm.walletAddress && !isValidEthAddress(createForm.walletAddress) && (
                    <p className="text-xs text-destructive mt-1">Must be a valid Ethereum address (0x + 40 hex chars)</p>
                  )}
                </FormField>
                <FormField label="Amount (USD) *">
                  <Input type="number" min="0" value={createForm.amount} onChange={(e) => setCreateForm((p) => ({ ...p, amount: e.target.value }))} placeholder="5000" disabled={createMutation.isPending} />
                </FormField>
                <FormField label="Payment Method">
                  <Input value={createForm.paymentMethod} onChange={(e) => setCreateForm((p) => ({ ...p, paymentMethod: e.target.value }))} placeholder="Wire Transfer, USDT, etc." disabled={createMutation.isPending} />
                </FormField>
                <FormField label="Transaction Reference">
                  <Input value={createForm.transactionRef} onChange={(e) => setCreateForm((p) => ({ ...p, transactionRef: e.target.value }))} placeholder="TXN-000001" disabled={createMutation.isPending} />
                </FormField>
                <FormField label="Payment Reference">
                  <Input value={createForm.paymentReference} onChange={(e) => setCreateForm((p) => ({ ...p, paymentReference: e.target.value }))} placeholder="Optional" disabled={createMutation.isPending} />
                </FormField>
                <FormField label="Proof" className="sm:col-span-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="createProofFile"
                      className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors ${createMutation.isPending || isUploadingProof ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload proof image or PDF</span>
                      <input
                        id="createProofFile"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleProofFileChange(e.target.files?.[0] || null)}
                        disabled={createMutation.isPending || isUploadingProof}
                      />
                    </label>
                    {isUploadingProof && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 animate-spin" />
                        Uploading...
                      </div>
                    )}
                    {proofFile && createForm.proofUrl && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-success/10 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-success shrink-0" />
                          <p className="text-sm font-medium text-success truncate">{proofFile.name}</p>
                        </div>
                        {proofFile.type.startsWith("image/") ? (
                          <div className="border border-border rounded-lg overflow-hidden">
                            <img src={createForm.proofUrl} alt="Proof preview" className="w-full h-48 object-cover" />
                          </div>
                        ) : (
                          <a href={createForm.proofUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                            View uploaded PDF
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </FormField>
                <FormField label="Notes" className="sm:col-span-2">
                  <Textarea value={createForm.notes} onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any additional notes..." disabled={createMutation.isPending} rows={3} />
                </FormField>
              </div>
            </div>
            <div className="flex gap-3 pt-2 shrink-0 border-t border-border">
              <Button variant="outline" onClick={resetCreateForm} disabled={createMutation.isPending} className="flex-1">Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1">
                {createMutation.isPending ? "Creating..." : "Create Submission"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Paginate
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          limit={pagination.limit}
          onPageChange={(newPage) => setFilters((prev) => ({ ...prev, page: newPage }))}
          showInfo={true}
          disabled={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

const StatsCard = ({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) => (
  <Card className="cardShadow bg-white p-5 rounded-[20px] hover:border-primary/30 transition-all flex items-center justify-between gap-1">
    <div className="flex items-center gap-3 justify-between w-full">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-primary">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">{icon}</div>
    </div>
  </Card>
);

const Detail = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
  <div className="space-y-1">
    <Label className="text-muted-foreground">{label}</Label>
    <p className={`${mono ? "font-mono text-xs" : "text-sm"} text-foreground break-all`}>{value}</p>
  </div>
);

const FormField = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={`space-y-1.5 ${className}`}>
    <Label className="text-sm text-muted-foreground">{label}</Label>
    {children}
  </div>
);

export default AdminPrivateSaleSubmissions;
