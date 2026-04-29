import { useEffect, useMemo, useState } from "react";
import {
  usePrivateSaleSubmissions,
  usePrivateSaleSubmissionStats,
  useVerifyPrivateSaleSubmission,
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
  const [selectedStageId, setSelectedStageId] = useState<string>("");
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

  useEffect(() => {
    if (tokenAmountManuallyEdited || !selectedSubmission || !selectedStageId) return;

    const stage = stages.find((item: any) => item.id.toString() === selectedStageId);
    if (!stage || stage.price <= 0) return;

    setTokenAmount((selectedSubmission.amount / stage.price).toFixed(4));
  }, [selectedStageId, selectedSubmission, stages, tokenAmountManuallyEdited]);

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

  const resetStates = () => {
    setSelectedSubmission(null);
    setVerificationNote("");
    setSelectedStageId("");
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

  const stats = statsData?.data || {
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
  };

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
        <div>
          <h1 className="text-[22px] font-bold text-foreground mb-1">
            Private Sale Submissions
          </h1>
          <p className="text-muted-foreground text-sm">
            Review private sale proof uploads and allocate tokens after approval.
          </p>
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
                    <TableCell>{submission.paymentMethod}</TableCell>
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
                        <DialogContent className="max-w-3xl bg-card border-border">
                          <DialogHeader>
                            <DialogTitle>Review Private Sale Submission</DialogTitle>
                            <DialogDescription>
                              Verify the proof and investor details before approving allocation.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedSubmission && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <Detail label="Investor" value={selectedSubmission.fullName} />
                                <Detail label="Email" value={selectedSubmission.email} />
                                <Detail label="Contact" value={selectedSubmission.contact} />
                                <Detail label="Country" value={selectedSubmission.country} />
                                <Detail label="Amount" value={`$${selectedSubmission.amount.toLocaleString()}`} />
                                <Detail label="Payment Method" value={selectedSubmission.paymentMethod} />
                                <Detail label="Reference" value={selectedSubmission.transactionRef} />
                                <Detail label="Wallet" value={selectedSubmission.walletAddress} mono />
                              </div>

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
          <DialogContent className="max-w-md bg-card border-border">
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
                        {stage.name} - {formatNumber(stage.price, 4)} per token
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  disabled={isProcessing}
                />
                {selectedStageId && selectedSubmission ? (
                  <p className="text-xs text-muted-foreground">
                    ${selectedSubmission.amount.toLocaleString()} translated at the selected stage price.
                  </p>
                ) : null}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAllocationDialogOpen(false)} disabled={isProcessing} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAllocateTokens} disabled={!selectedStageId || !tokenAmount || isProcessing} className="flex-1">
                  {isProcessing ? "Processing..." : "Allocate Tokens"}
                </Button>
              </div>
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

export default AdminPrivateSaleSubmissions;
