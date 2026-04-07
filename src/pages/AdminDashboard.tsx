import { useMemo, useState, FormEvent, useEffect } from "react";
import { formatUnits, parseUnits } from "viem";
import {
  useReadContract,
  useReadContracts,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Crown, Clock, Percent } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import CreateStageForm from "@/components/stages/CreateStageForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatterNumber, formatWallet } from "@/lib/utils";
import {
  tokenPresaleAddress,
  tokenPresaleAbi,
} from "@/lib/contracts/tokenPresale";
import { useTopBuyers } from "@/hooks/useBuyers";
import { Link } from "react-router-dom";
import { DollarIcon, InfoIcon, SoldIcon, UserIcon } from "@/components/icons";

const parseAmount = (value: bigint, decimals: number) => {
  const parsed = parseFloat(formatUnits(value, decimals));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});

const tokenFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const nowInSeconds = () => Math.floor(Date.now() / 1000);

const getStageStatus = ({
  startTime,
  endTime,
  soldTokens,
  offeredTokens,
}: {
  startTime: bigint;
  endTime: bigint;
  soldTokens: number;
  offeredTokens: number;
}): "Active" | "Completed" | "Upcoming" | "Paused" => {
  const now = nowInSeconds();
  const start = Number(startTime);
  const end = Number(endTime);

  if (soldTokens >= offeredTokens && offeredTokens > 0) {
    return "Completed";
  }

  if (now < start) {
    return "Upcoming";
  } else if (now >= start && now <= end) {
    return "Active";
  } else {
    return "Completed";
  }
};

const AdminDashboard = () => {
  const { address } = useAccount();
  const { status } = useAccount();
  const isConnected = status === "connected";
  const { toast } = useToast();

  const [isCreateStageDialogOpen, setIsCreateStageDialogOpen] = useState(false);
  const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
  const [transactionHash, setTransactionHash] = useState<
    `0x${string}` | undefined
  >(undefined);
  const [pauseTransactionHash, setPauseTransactionHash] = useState<
    `0x${string}` | undefined
  >(undefined);
  const [pendingAction, setPendingAction] = useState<"create" | null>(null);

  const [stageForm, setStageForm] = useState({
    price: "",
    offeredTokens: "",
    minBuyTokens: "",
    maxBuyTokens: "",
    // softCapTokens: "",
    // hardCapTokens: "",
    startDate: "",
    endDate: "",
    cliffDays: "",
    durationDays: "",
    whitelistOnly: false,
    releaseIntervalDays: "",
  });

  const [referralForm, setReferralForm] = useState({
    enableReferral: false,
    referralPercentage: "",
    instantCredits: false,
  });

  const {
    data: topBuyersResponse,
    isLoading: isTopBuyersLoading,
    isError: isTopBuyersError,
  } = useTopBuyers({ limit: 5 });

  const topBuyers = topBuyersResponse?.data?.data?.data || [];

  const { data: saleTokenDecimals } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "saleTokenDecimals",
  });

  const { data: stagesCount, isLoading: isLoadingStageCount } = useReadContract(
    {
      address: tokenPresaleAddress,
      abi: tokenPresaleAbi,
      functionName: "stagesCount",
    },
  );

  const { data: isPaused, refetch: refetchPausedState } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "paused",
  });

  const contractPaused = isPaused ?? false;

  const decimals = saleTokenDecimals ? Number(saleTokenDecimals) : 18;
  const totalStages = stagesCount ? Number(stagesCount) : 0;

  const parseDaysToSeconds = (value: string) => {
    const days = Number(value);
    if (!Number.isFinite(days) || days < 0) {
      throw new Error("Cliff and duration must be non-negative numbers.");
    }
    return BigInt(Math.floor(days)) * 86_400n;
  };

  const normalizeStageForm = (form: typeof stageForm) => {
    const requiredFields: Array<[keyof typeof stageForm, string]> = [
      ["price", "Token price"],
      ["offeredTokens", "Tokens offered"],
      ["minBuyTokens", "Minimum purchase"],
      ["maxBuyTokens", "Maximum purchase"],
      ["startDate", "Start time"],
      ["endDate", "End time"],
    ];

    for (const [key, label] of requiredFields) {
      if (!form[key]?.toString().trim()) {
        throw new Error(`${label} is required.`);
      }
    }

    const startTimestamp = new Date(form.startDate).getTime();
    const endTimestamp = new Date(form.endDate).getTime();

    if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp)) {
      throw new Error("Invalid start or end time.");
    }

    if (endTimestamp <= startTimestamp) {
      throw new Error("End time must be after start time.");
    }

    const price = parseUnits(form.price, 18);
    const offeredAmount = parseUnits(form.offeredTokens, decimals);
    const minBuyTokens = parseUnits(form.minBuyTokens, decimals);
    const maxBuyTokens = parseUnits(form.maxBuyTokens, decimals);

    if (maxBuyTokens <= minBuyTokens) {
      throw new Error(
        "Maximum purchase must be greater than minimum purchase.",
      );
    }

    // const hardCap =
    //   form.hardCapTokens?.trim().length > 0
    //     ? parseUnits(form.hardCapTokens, decimals)
    //     : offeredAmount;

    // const softCap =
    //   form.softCapTokens?.trim().length > 0
    //     ? parseUnits(form.softCapTokens, decimals)
    //     : offeredAmount / 2n;

    const cliff = form.cliffDays ? parseDaysToSeconds(form.cliffDays) : 0n;
    const releaseInterval = form.releaseIntervalDays
      ? parseDaysToSeconds(form.releaseIntervalDays)
      : 0n;
    const duration = form.durationDays
      ? parseDaysToSeconds(form.durationDays)
      : 0n;

    return {
      price,
      offeredAmount,
      minBuyTokens,
      maxBuyTokens,
      // hardCap,
      // softCap,
      startTime: BigInt(Math.floor(startTimestamp / 1000)),
      endTime: BigInt(Math.floor(endTimestamp / 1000)),
      cliff,
      releaseInterval,
      duration,
    };
  };

  const { writeContractAsync, isPending: isWriting } = useWriteContract();

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

  const {
    data: pauseTransactionReceipt,
    error: pauseWaitError,
    isLoading: isWaitingForPauseReceipt,
  } = useWaitForTransactionReceipt({
    hash: pauseTransactionHash,
    confirmations: 1,
    query: {
      enabled: Boolean(pauseTransactionHash),
    },
  });

  const isCreatingStage = isWriting || isWaitingForReceipt;
  const isPausingContract = isWriting || isWaitingForPauseReceipt;

  const handleCreateStage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isConnected) {
      toast({
        title: "Wallet disconnected",
        description: "Connect an admin wallet before creating a stage.",
        variant: "destructive",
      });
      return;
    }

    try {
      const normalized = normalizeStageForm(stageForm);

      setPendingAction("create");

      const hash = await writeContractAsync({
        address: tokenPresaleAddress,
        abi: tokenPresaleAbi,
        functionName: "addStage",
        args: [
          {
            ...normalized,
            soldAmount: 0n,
            whitelistOnly: stageForm.whitelistOnly,
          },
        ],
        chain: undefined,
        account: address,
      });

      setTransactionHash(hash);
      toast({
        title: "Transaction submitted",
        description: "Waiting for confirmation on-chain…",
      });
    } catch (error) {
      const description =
        error instanceof Error
          ? error.message
          : "Failed to create the stage. Please try again.";

      toast({
        title: "Create stage failed",
        description,
        variant: "destructive",
      });
      setPendingAction(null);
    }
  };

  const handleEmergencyStop = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet disconnected",
        description: "Connect an admin wallet before pausing the contract.",
        variant: "destructive",
      });
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: tokenPresaleAddress,
        abi: tokenPresaleAbi,
        functionName: "pause",
        chain: undefined,
        account: address,
      });

      setPauseTransactionHash(hash);
      toast({
        title: "Transaction submitted",
        description: "Pausing the presale contract...",
      });
    } catch (error) {
      const description =
        error instanceof Error
          ? error.message
          : "Failed to pause the contract. Please try again.";

      toast({
        title: "Emergency stop failed",
        description,
        variant: "destructive",
      });
    }
  };

  const handleUnpause = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet disconnected",
        description: "Connect an admin wallet before unpausing the contract.",
        variant: "destructive",
      });
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: tokenPresaleAddress,
        abi: tokenPresaleAbi,
        functionName: "unpause",
        chain: undefined,
        account: address,
      });

      setPauseTransactionHash(hash);
      toast({
        title: "Transaction submitted",
        description: "Unpausing the presale contract...",
      });
    } catch (error) {
      const description =
        error instanceof Error
          ? error.message
          : "Failed to unpause the contract. Please try again.";

      toast({
        title: "Unpause failed",
        description,
        variant: "destructive",
      });
    }
  };

  const stageIndexes = useMemo(
    () => Array.from({ length: totalStages }, (_, index) => index),
    [totalStages],
  );

  const {
    data: stageContracts,
    isLoading: isLoadingStages,
    isFetching: isFetchingStages,
  } = useReadContracts({
    allowFailure: true,
    contracts: stageIndexes.map((index) => ({
      address: tokenPresaleAddress,
      abi: tokenPresaleAbi,
      functionName: "getStage",
      args: [BigInt(index)],
    })),
    query: {
      enabled: totalStages > 0,
    },
  } as any);

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

        const offeredTokens = parseAmount(result.offeredAmount, decimals);
        const soldTokens = parseAmount(result.soldAmount, decimals);
        const priceUsd = parseAmount(result.price, 18);
        const raisedUsd = soldTokens * priceUsd;

        const progress =
          offeredTokens > 0
            ? Math.min((soldTokens / offeredTokens) * 100, 100)
            : 0;

        const status = getStageStatus({
          startTime: result.startTime,
          endTime: result.endTime,
          soldTokens,
          offeredTokens,
        });

        return {
          id: index,
          stage: index + 1,
          price: `$${priceFormatter.format(priceUsd)}`,
          sold: `${progress.toFixed(0)}%`,
          raised: formatNumber(raisedUsd),
          status,
          offeredTokens,
          soldTokens,
          raisedUsd,
          priceUsd,
          progress,
          raw: result,
        };
      })
      .filter(Boolean);
  }, [stageContracts, decimals]);

  const activeStage = useMemo(() => {
    return stages.find((s) => s?.status === "Active") || stages[0];
  }, [stages]);

  const totalStats = useMemo(() => {
    const totalRaised = stages.reduce(
      (sum, stage) => sum + (stage?.raisedUsd || 0),
      0,
    );

    const totalSold = stages.reduce(
      (sum, stage) => sum + (stage?.soldTokens || 0),
      0,
    );

    return {
      totalRaised: formatNumber(totalRaised),
      tokensSold: formatterNumber(totalSold),
      activeBuyers: topBuyers.length.toString(),
    };
  }, [stages, topBuyers]);

  const isLoading = isLoadingStageCount || isLoadingStages || isFetchingStages;

  useEffect(() => {
    if (!transactionReceipt) {
      return;
    }

    toast({
      title: "Stage created",
      description: "New presale stage confirmed on-chain.",
    });

    setStageForm({
      price: "",
      offeredTokens: "",
      minBuyTokens: "",
      maxBuyTokens: "",
      // softCapTokens: "",
      // hardCapTokens: "",
      startDate: "",
      endDate: "",
      cliffDays: "",
      durationDays: "",
      whitelistOnly: false,
      releaseIntervalDays: "",
    });
    setIsCreateStageDialogOpen(false);
    setPendingAction(null);
    setTransactionHash(undefined);
  }, [transactionReceipt, toast]);

  useEffect(() => {
    if (!waitError) {
      return;
    }

    const description =
      waitError instanceof Error
        ? waitError.message
        : "Transaction failed. Please try again.";

    toast({
      title: "Stage creation failed",
      description,
      variant: "destructive",
    });

    setTransactionHash(undefined);
    setPendingAction(null);
  }, [waitError, toast]);

  useEffect(() => {
    if (!pauseTransactionReceipt) {
      return;
    }

    toast({
      title: contractPaused ? "Contract unpaused" : "Contract paused",
      description: contractPaused
        ? "Presale has been resumed successfully."
        : "Presale has been paused successfully.",
    });

    setPauseTransactionHash(undefined);
    setIsPauseDialogOpen(false);
    refetchPausedState();
  }, [pauseTransactionReceipt, toast, contractPaused, refetchPausedState]);

  useEffect(() => {
    if (!pauseWaitError) {
      return;
    }

    const description =
      pauseWaitError instanceof Error
        ? pauseWaitError.message
        : "Transaction failed. Please try again.";

    toast({
      title: "Operation failed",
      description,
      variant: "destructive",
    });

    setPauseTransactionHash(undefined);
  }, [pauseWaitError, toast]);

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[22px] font-bold text-foreground mb-1">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              Monitor and manage your token presale
            </p>
          </div>
          <div className="flex gap-3">
            {contractPaused ? (
              <Button
                onClick={handleUnpause}
                disabled={isPausingContract || !isConnected}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Play className="w-4 h-4 mr-2" />
                {isPausingContract ? "Resuming..." : "Resume Presale"}
              </Button>
            ) : (
              <Button
                onClick={handleEmergencyStop}
                disabled={isPausingContract || !isConnected}
                variant="outline"
                className="border-warning text-warning hover:bg-warning/10 hover:text-warning"
              >
                <Pause className="w-4 h-4 mr-2" />
                {isPausingContract ? "Pausing..." : "Pause Presale"}
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total Raised"
            value={totalStats.totalRaised}
            icon={DollarIcon}
          />
          <StatsCard
            title="Tokens Sold"
            value={totalStats.tokensSold}
            icon={SoldIcon}
          />
          <StatsCard
            title="Active Buyers"
            value={totalStats.activeBuyers}
            icon={UserIcon}
          />
        </div>

        {/* Current Stage & Quick Actions */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card className="cardShadow bg-white p-5 rounded-[20px] w-full border-none">
              <h3 className="text-xl font-medium text-foreground mb-2">
                Current Stage Status
              </h3>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full " />
                  <Skeleton className="h-6 w-full " />
                  <Skeleton className="h-6 w-full " />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : stages.length > 0 && activeStage ? (
                <>
                  <div className="">
                    <div className="flex justify-between items-center border-b border-[#F1E7FF] py-3">
                      <p className="text-base text-muted-foreground">Stage</p>
                      <p className="text-primary text-base font-semibold">
                        Stage {activeStage.stage} of {totalStages}
                      </p>
                    </div>
                    <div className="flex justify-between items-center border-b border-[#F1E7FF] py-3">
                      <p className="text-base text-muted-foreground">
                        Token Price
                      </p>
                      <p className="text-primary text-base font-semibold">
                        {activeStage.price}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-3 pb-2">
                      <p className="text-base text-muted-foreground">
                        Tokens Sold
                      </p>
                      <p className="text-primary text-base font-semibold">
                        {tokenFormatter.format(activeStage.soldTokens)} /{" "}
                        {tokenFormatter.format(activeStage.offeredTokens)}
                      </p>
                    </div>
                    <Progress value={activeStage.progress} className="h-2" />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No stages configured</p>
                </div>
              )}
              <Link to="/presale/stages">
                <Button className="w-full mt-6 !py-5 font-medium bg-primary hover:bg-primary/90 rounded-full">
                  START STAGE SETTINGS
                </Button>
              </Link>
            </Card>

            {/* Top 5 Active Buyers */}
            <Card className="cardShadow bg-white p-5 rounded-[20px] w-full border-none mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center gap-2 text-xl font-medium text-foreground mb-2">
                  <Crown className="w-5 h-5 text-warning" />
                  Top Active Buyers
                </h3>
                <Link to="/presale/buyers">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border hover:border-primary/50"
                  >
                    View All Buyers
                  </Button>
                </Link>
              </div>
              {isTopBuyersError ? (
                <div className="text-center py-8">
                  <p className="text-destructive">
                    Failed to load top buyers data
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        Wallet Address
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Tokens Purchased
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Amount Spent
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Claimed
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isTopBuyersLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index} className="border-border">
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-20" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : topBuyers?.length === 0 ? (
                      <TableRow className="border-border">
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-8"
                        >
                          No active buyers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      topBuyers?.map((buyer: any, index: number) => (
                        <TableRow key={index} className="border-border">
                          <TableCell className="font-mono text-sm">
                            {formatWallet(buyer.walletAddress)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatterNumber(buyer.tokensPurchased)}
                          </TableCell>
                          <TableCell className="text-success font-semibold">
                            {formatNumber(buyer.amountSpent)}
                          </TableCell>
                          <TableCell>
                            {formatterNumber(buyer.claimed || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-primary text-primary bg-primary/10"
                            >
                              {buyer.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>

          <div className="">
            {/* Stage Performance */}
            <Card className="cardShadow bg-white p-5 rounded-[20px] w-full border-none">
              <h3 className="text-xl font-medium text-foreground mb-5">
                Stage Performance
              </h3>

              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-border bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                          <Skeleton className="h-1.5 w-full mb-2" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <div className="text-right">
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : stages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No stages found. Create a new stage to get started.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {stages.map((stage) => (
                    <div
                      key={stage?.id}
                      className={`p-4 rounded-lg border transition-all ${
                        stage?.status === "Active"
                          ? "border-primary bg-white hover:shadow-sm"
                          : stage?.status === "Completed"
                            ? "border-success bg-white hover:shadow-sm"
                            : "border-border bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="w-1/3 flex flex-col">
                          <p className="text-sm text-muted-foreground">
                            Stage {stage?.stage}
                          </p>
                          <p className="text-xl font-bold text-primary mt-1">
                            {stage?.price}
                          </p>
                        </div>

                        <div className="w-1/3 flex flex-col items-center text-center">
                          <div className="mb-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                                stage?.status === "Active"
                                  ? "bg-primary/20 text-primary"
                                  : stage?.status === "Completed"
                                    ? "bg-success/20 text-success"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {stage?.status}
                            </span>
                          </div>

                          <div className="w-full">
                            <Progress
                              value={stage?.progress || 0}
                              className="h-1.5 w-full"
                            />
                          </div>

                          <p className="text-xs text-muted-foreground mt-2">
                            {stage?.sold} Sold
                          </p>
                        </div>

                        <div className="w-1/3 flex flex-col items-end">
                          <p className="text-nase text-[#7529ED] font-semibold">
                            {stage?.raised}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="cardShadow bg-white p-5 rounded-[20px] w-full border-none mt-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Create Stage Dialog */}
                <Dialog
                  open={isCreateStageDialogOpen}
                  onOpenChange={setIsCreateStageDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="w-full rounded-full py-3 font-medium text-white bg-gradient-to-r from-primary to-[#8b5cf6] shadow-sm"
                      disabled={!isConnected}
                    >
                      CREATE NEW STAGE
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">
                        Create New Stage
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Configure the parameters for a new presale stage. Values
                        are submitted directly to the TokenPresale contract.
                      </DialogDescription>
                    </DialogHeader>
                    <CreateStageForm
                      form={stageForm}
                      setForm={setStageForm}
                      onSubmit={handleCreateStage}
                      isCreating={isCreatingStage}
                      isConnected={isConnected}
                      onCancel={() => setIsCreateStageDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>

                {/* Referral Program Dialog */}
                <Dialog
                  open={isReferralDialogOpen}
                  onOpenChange={setIsReferralDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full rounded-full py-3 font-medium border-primary text-primary"
                    >
                      REFERRAL PROGRAM
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-foreground flex items-center gap-2">
                        <Percent className="w-5 h-5 text-primary" />
                        Referral Program
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Configure referral rewards and settings
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">
                            Enable Referral System
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Allow users to earn rewards through referrals
                          </p>
                        </div>
                        <Switch
                          checked={referralForm.enableReferral}
                          onCheckedChange={(checked) =>
                            setReferralForm({
                              ...referralForm,
                              enableReferral: checked,
                            })
                          }
                        />
                      </div>
                      <Separator className="bg-border" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-x-1">
                          <Label htmlFor="referralPercentage">
                            Referral Reward (%)
                          </Label>
                          <div className="relative cursor-pointer group">
                            <InfoIcon />
                            <div className="absolute bottom-full hidden group-hover:block cardShadow left-0 bg-white rounded-[20px] p-5 w-[350px] text-center text-muted-foreground text-xs">
                              The percentage of the purchase amount given to the
                              referrer as a reward.
                            </div>
                          </div>
                        </div>
                        <Input
                          id="referralPercentage"
                          type="number"
                          step="0.1"
                          value={referralForm.referralPercentage}
                          onChange={(e) =>
                            setReferralForm({
                              ...referralForm,
                              referralPercentage: e.target.value,
                            })
                          }
                          className="bg-background border-border"
                          placeholder="Configure via contract write"
                        />
                        <p className="text-xs text-muted-foreground">
                          Percentage of purchase amount given as reward to
                          referrer
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">
                            Instant Referral Credits
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Credit referral rewards immediately upon purchase
                          </p>
                        </div>
                        <Switch
                          checked={referralForm.instantCredits}
                          onCheckedChange={(checked) =>
                            setReferralForm({
                              ...referralForm,
                              instantCredits: checked,
                            })
                          }
                        />
                      </div>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        Save Referral Settings
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Emergency Stop Dialog */}
                <Dialog
                  open={isPauseDialogOpen}
                  onOpenChange={setIsPauseDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full rounded-full py-3 font-medium border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={!isConnected}
                    >
                      EMERGENCY STOP
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-foreground flex items-center gap-2">
                        <Pause className="w-5 h-5 text-destructive" />
                        Emergency Stop
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        {contractPaused
                          ? "Resume the presale to allow purchases again."
                          : "This will pause all presale operations immediately. No purchases can be made while paused."}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive font-medium">
                          {contractPaused
                            ? "⚠️ Contract is currently PAUSED"
                            : "⚠️ Warning"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {contractPaused
                            ? "Unpausing will allow users to purchase tokens again."
                            : "All token purchases will be blocked until you resume the presale."}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setIsPauseDialogOpen(false)}
                          disabled={isPausingContract}
                        >
                          Cancel
                        </Button>
                        <Button
                          className={`flex-1 ${
                            contractPaused
                              ? "bg-primary hover:bg-primary/90"
                              : "bg-destructive hover:bg-destructive/90"
                          } text-white`}
                          onClick={
                            contractPaused ? handleUnpause : handleEmergencyStop
                          }
                          disabled={isPausingContract}
                        >
                          {isPausingContract
                            ? contractPaused
                              ? "Resuming..."
                              : "Pausing..."
                            : contractPaused
                              ? "Resume Presale"
                              : "Pause Presale"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
