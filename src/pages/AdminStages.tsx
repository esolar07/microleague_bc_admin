import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits, maxUint256, ContractFunctionRevertedError, ContractFunctionExecutionError } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Clock,
  DollarSign,
  Shield,
} from "lucide-react";
import {
  tokenPresaleAddress,
  tokenPresaleAbi,
} from "@/lib/contracts/tokenPresale";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CreateStageForm from "@/components/stages/CreateStageForm";
import { DollarIcon, HardCapIcon, SoldIcon } from "@/components/icons";
import Loader from "@/components/Loader";

// type StageStruct = {
//   price: bigint;
//   offeredAmount: bigint;
//   soldAmount: bigint;
//   minBuyTokens: bigint;
//   maxBuyTokens: bigint;
//   hardCap: bigint;
//   softCap: bigint;
//   startTime: bigint;
//   endTime: bigint;
//   cliff: bigint;
//   duration: bigint;
//   active?: boolean;
//   whitelistOnly: boolean;
// };

const nowInSeconds = () => Math.floor(Date.now() / 1000);

const formatTimestamp = (value: bigint) => {
  if (!value || value === 0n) {
    return "—";
  }

  const timestamp = Number(value) * 1000;
  if (!Number.isFinite(timestamp)) {
    return value.toString();
  }

  return new Date(timestamp).toLocaleString();
};

const tokenFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const priceFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});

type StageFormState = {
  price: string;
  offeredTokens: string;
  minBuyTokens: string;
  maxBuyTokens: string;
  startDate: string;
  endDate: string;
  cliffDays: string;
  durationDays: string;
  releaseIntervalDays: string;
  whitelistOnly: boolean;
};

const initialStageForm: StageFormState = {
  price: "",
  offeredTokens: "",
  minBuyTokens: "",
  maxBuyTokens: "",
  startDate: "",
  endDate: "",
  cliffDays: "",
  durationDays: "",
  releaseIntervalDays: "",
  whitelistOnly: false,
};

const erc20Abi = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const parseAmount = (value: bigint, decimals: number) => {
  const parsed = parseFloat(formatUnits(value, decimals));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatDateTimeLocal = (seconds: bigint) => {
  if (!seconds || seconds === 0n) {
    return "";
  }

  const date = new Date(Number(seconds) * 1000);
  const pad = (value: number) => value.toString().padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Reusable Status Component
type StatusType = "Active" | "Completed" | "Upcoming" | "Paused";

interface StageStatusProps {
  startTime: bigint;
  endTime: bigint;
  active: boolean;
  soldTokens: number;
  offeredTokens: number;
}

const getStageStatus = ({
  startTime,
  endTime,
  active,
  soldTokens,
  offeredTokens,
}: StageStatusProps): StatusType => {
  const now = nowInSeconds();
  const start = Number(startTime);
  const end = Number(endTime);

  console.log("Status calculation:", {
    now,
    start,
    end,
    active,
    soldTokens,
    offeredTokens,
    isUpcoming: now < start,
    isActiveRange: now >= start && now <= end,
    isEnded: now > end,
  });

  // First check if stage is sold out
  if (soldTokens >= offeredTokens && offeredTokens > 0) {
    return "Completed";
  }

  if (now < start) {
    return "Upcoming";
  } else if (now >= start && now <= end) {
    return active === undefined || active === true ? "Active" : "Paused";
  } else if (now > end) {
    return "Completed";
  }

  // Default fallback
  return "Paused";
};

interface StatusBadgeProps {
  status: StatusType;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case "Active":
        return {
          className: "border-primary text-primary bg-primary/10",
          label: "Active",
        };
      case "Completed":
        return {
          className: "border-success text-success bg-success/10",
          label: "Completed",
        };
      case "Upcoming":
        return {
          className: "border-warning text-warning bg-warning/10",
          label: "Upcoming",
        };
      case "Paused":
        return {
          className: "border-muted-foreground text-muted-foreground",
          label: "Paused",
        };
      default:
        return {
          className: "border-muted-foreground text-muted-foreground",
          label: "Unknown",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

const getContractError = (error: unknown): string => {
  if (error instanceof ContractFunctionExecutionError) {
    const cause = error.cause;
    if (cause instanceof ContractFunctionRevertedError) {
      return cause.data?.errorName ?? cause.shortMessage ?? error.shortMessage;
    }
    return error.shortMessage;
  }
  if (error instanceof Error) return error.message;
  return "Unknown error occurred.";
};

const AdminStages = () => {
  const { address } = useAccount();
  const { toast } = useToast();
  const { status } = useAccount();
  const publicClient = usePublicClient();
  const isConnected = status === "connected";
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [stageForm, setStageForm] = useState<StageFormState>(initialStageForm);
  const [transactionHash, setTransactionHash] = useState<
    `0x${string}` | undefined
  >(undefined);
  const [editingStageId, setEditingStageId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "create" | "update" | null
  >(null);
  const [approveHash, setApproveHash] = useState<`0x${string}` | undefined>(
    undefined,
  );
  const [stageCreateStep, setStageCreateStep] = useState<
    "idle" | "approving" | "creating"
  >("idle");
  const [pendingStageData, setPendingStageData] = useState<{
    price: bigint;
    offeredAmount: bigint;
    minBuyTokens: bigint;
    maxBuyTokens: bigint;
    startTime: bigint;
    endTime: bigint;
    cliff: bigint;
    releaseInterval: bigint;
    duration: bigint;
    whitelistOnly: boolean;
  } | null>(null);

  // if (!tokenPresaleAddress) {
  //   return (
  //     <DashboardLayout userType="admin">
  //       <div className="space-y-8">
  //         <div>
  //           <h1 className="text-[22px] font-bold text-foreground mb-1">
  //             Presale Stages
  //           </h1>
  //           <p className="text-muted-foreground text-sm">
  //             Create and manage presale stages
  //           </p>
  //         </div>

  //         <Card className="p-6 border-destructive/50 bg-card">
  //           <h3 className="text-xl font-semibold text-destructive mb-4">
  //             Missing Contract Address
  //           </h3>
  //           <p className="text-sm text-muted-foreground">
  //             Set{" "}
  //             <code className="font-mono text-xs">
  //               VITE_TOKEN_PRESALE_ADDRESS
  //             </code>{" "}
  //             to display on-chain stages.
  //           </p>
  //         </Card>
  //       </div>
  //     </DashboardLayout>
  //   );
  // }

  const { data: saleTokenDecimals } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "saleTokenDecimals",
  });

  const {
    data: stagesCount,
    isLoading: isLoadingStageCount,
    refetch: refetchStageCount,
  } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "stagesCount",
  });

  const { data: saleTokenAddress } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "saleToken",
  });

  const { data: ownerAddress } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "owner",
  });

  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract(
    {
      address: saleTokenAddress as `0x${string}` | undefined,
      abi: erc20Abi,
      functionName: "allowance",
      args:
        ownerAddress && tokenPresaleAddress
          ? [ownerAddress as `0x${string}`, tokenPresaleAddress]
          : undefined,
      query: {
        enabled: Boolean(
          saleTokenAddress && ownerAddress && tokenPresaleAddress,
        ),
      },
    },
  );

  const { data: approveReceipt } = useWaitForTransactionReceipt({
    hash: approveHash,
    confirmations: 1,
    query: { enabled: Boolean(approveHash) },
  });

  const decimals = saleTokenDecimals ? Number(saleTokenDecimals) : 18;

  const parseDaysToSeconds = (value: string) => {
    const days = Number(value);
    if (!Number.isFinite(days) || days < 0) {
      throw new Error("Cliff and duration must be non-negative numbers.");
    }

    return BigInt(Math.floor(days)) * 86_400n;
  };

  const parseReleaseIntervalToSeconds = (value: string) => {
    const days = Number(value);
    if (!Number.isFinite(days) || days < 0) {
      throw new Error("Release interval must be a non-negative number.");
    }

    return BigInt(Math.floor(days)) * 86_400n;
  };
  const normalizeStageForm = (form: StageFormState) => {
    const requiredFields: Array<[keyof StageFormState, string]> = [
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

    const cliff = form.cliffDays ? parseDaysToSeconds(form.cliffDays) : 0n;
    const duration = form.durationDays
      ? parseDaysToSeconds(form.durationDays)
      : 0n;

    const releaseInterval = form.releaseIntervalDays
      ? parseReleaseIntervalToSeconds(form.releaseIntervalDays)
      : 0n;

    return {
      price,
      offeredAmount,
      minBuyTokens,
      maxBuyTokens,
      startTime: BigInt(Math.floor(startTimestamp / 1000)),
      endTime: BigInt(Math.floor(endTimestamp / 1000)),
      cliff,
      duration,
      releaseInterval,
    };
  };

  const totalStages = stagesCount ? Number(stagesCount) : 0;
  const stageIndexes = useMemo(
    () => Array.from({ length: totalStages }, (_, index) => index),
    [totalStages],
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

  const {
    data: stageContracts,
    isLoading: isLoadingStages,
    isFetching: isFetchingStages,
    refetch: refetchStageContracts,
  } = useReadContracts({
    allowFailure: true,
    contracts: contracts as any,
    query: { enabled: totalStages > 0 },
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
        const minBuyTokens = parseAmount(result.minBuyTokens, decimals);
        const maxBuyTokens = parseAmount(result.maxBuyTokens, decimals);
        const priceUsd = parseAmount(result.price, 18);
        const raisedUsd = soldTokens * priceUsd;
        const startTime = result.startTime;
        const endTime = result.endTime;

        // Try to get active field - it might have a different name or be nested
        let active = result.active;
        if (active === undefined) {
          active = result.isActive || result.activeFlag || result.enabled;
        }

        const progress =
          offeredTokens > 0
            ? Math.min((soldTokens / offeredTokens) * 100, 100)
            : 0;

        // Get status based on time and conditions
        const status = getStageStatus({
          startTime: startTime,
          endTime: endTime,
          active: active, // This might be undefined
          soldTokens,
          offeredTokens,
        });

        return {
          id: index,
          name: `Stage ${index + 1}`,
          priceUsd,
          offeredTokens,
          soldTokens,
          raisedUsd,
          minBuyTokens,
          maxBuyTokens,
          progress,
          startDate: formatTimestamp(startTime),
          endDate: formatTimestamp(endTime),
          status,
          whitelistOnly: result.whitelistOnly,
          raw: result,
        };
      })
      .filter(Boolean);
  }, [stageContracts, decimals]);

  const isLoading = isLoadingStageCount || isLoadingStages || isFetchingStages;

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

  const resetForm = () => {
    setStageForm(initialStageForm);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (open && stages.length > 0) {
      const lastStage = stages[stages.length - 1];
      const prevEnd = formatDateTimeLocal(lastStage.raw.endTime);
      setStageForm((prev) => ({ ...prev, startDate: prevEnd }));
    }
    if (!open) {
      resetForm();
      setPendingAction(null);
      setStageCreateStep("idle");
      setPendingStageData(null);
    }
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      resetForm();
      setEditingStageId(null);
      setPendingAction(null);
    }
  };

  const isCreatingStage = stageCreateStep !== "idle" || isWaitingForReceipt;

  const submitAddStage = useCallback(
    async (data: NonNullable<typeof pendingStageData>) => {
      await publicClient?.simulateContract({
        address: tokenPresaleAddress,
        abi: tokenPresaleAbi,
        functionName: "addStage",
        args: [{ ...data, soldAmount: 0n }],
        account: address,
      });

      const hash = await writeContractAsync({
        address: tokenPresaleAddress,
        abi: tokenPresaleAbi,
        functionName: "addStage",
        args: [{ ...data, soldAmount: 0n }],
        chain: undefined,
        account: address,
      });
      setTransactionHash(hash);
      setStageCreateStep("creating");
      setPendingAction("create");
      toast({
        title: "Step 2/2: Creating stage…",
        description: "Waiting for confirmation on-chain.",
      });
    },
    [writeContractAsync, address, toast, publicClient],
  );

  useEffect(() => {
    if (!approveReceipt) return;
    setApproveHash(undefined);
    refetchAllowance();

    if (pendingStageData) {
      const data = pendingStageData;
      setPendingStageData(null);
      submitAddStage(data).catch((error) => {
        toast({
          title: "Create stage failed",
          description: getContractError(error),
          variant: "destructive",
        });
        setStageCreateStep("idle");
        setPendingAction(null);
      });
    }
  }, [
    approveReceipt,
    pendingStageData,
    refetchAllowance,
    submitAddStage,
    toast,
  ]);

  useEffect(() => {
    if (!transactionReceipt) {
      return;
    }

    const action = pendingAction;

    toast({
      title: action === "update" ? "Stage updated" : "Stage created",
      description:
        action === "update"
          ? "Presale stage changes confirmed on-chain."
          : "New presale stage confirmed on-chain.",
    });

    resetForm();
    setIsDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingStageId(null);
    setPendingAction(null);
    setTransactionHash(undefined);
    setStageCreateStep("idle");

    void Promise.allSettled([refetchStageCount(), refetchStageContracts()]);
  }, [
    transactionReceipt,
    toast,
    refetchStageCount,
    refetchStageContracts,
    pendingAction,
  ]);

  useEffect(() => {
    if (!waitError) {
      return;
    }

    const description =
      waitError instanceof Error
        ? waitError.message
        : "Transaction failed. Please try again.";

    toast({
      title:
        pendingAction === "update"
          ? "Stage update failed"
          : "Stage creation failed",
      description,
      variant: "destructive",
    });

    setTransactionHash(undefined);
    setPendingAction(null);
    setStageCreateStep("idle");
    setPendingStageData(null);
  }, [waitError, toast, pendingAction]);

  const handleOpenEditStage = (stage: (typeof stages)[number]) => {
    const raw = stage.raw;

    setStageForm({
      price: formatUnits(raw.price, 18),
      offeredTokens: formatUnits(raw.offeredAmount, decimals),
      minBuyTokens: formatUnits(raw.minBuyTokens, decimals),
      maxBuyTokens: formatUnits(raw.maxBuyTokens, decimals),
      startDate: formatDateTimeLocal(raw.startTime),
      endDate: formatDateTimeLocal(raw.endTime),
      cliffDays:
        raw.cliff === 0n ? "" : (Number(raw.cliff) / 86_400).toString(),
      durationDays:
        raw.duration === 0n ? "" : (Number(raw.duration) / 86_400).toString(),
      // active: raw.active,
      whitelistOnly: raw.whitelistOnly,
      releaseIntervalDays:
        raw.releaseInterval === 0n
          ? ""
          : (Number(raw.releaseInterval) / 86_400).toString(),
    });

    setEditingStageId(stage.id);
    setIsEditDialogOpen(true);
  };

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
      const stageData = {
        ...normalized,
        whitelistOnly: stageForm.whitelistOnly,
      };
      const needsApproval =
        saleTokenAddress &&
        (!currentAllowance || currentAllowance < normalized.offeredAmount);

      if (needsApproval) {
        setPendingStageData(stageData);
        setStageCreateStep("approving");
        const hash = await writeContractAsync({
          address: saleTokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [tokenPresaleAddress, normalized.offeredAmount],
          chain: undefined,
          account: address,
        });
        setApproveHash(hash);
        toast({
          title: "Step 1/2: Approving tokens…",
          description: "Approve the presale contract to spend your tokens.",
        });
      } else {
        await submitAddStage(stageData);
      }
    } catch (error) {
      toast({
        title: "Create stage failed",
        description: getContractError(error),
        variant: "destructive",
      });
      setStageCreateStep("idle");
      setPendingStageData(null);
      setPendingAction(null);
    }
  };

  const handleUpdateStage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isConnected) {
      toast({
        title: "Wallet disconnected",
        description: "Connect an admin wallet before updating a stage.",
        variant: "destructive",
      });
      return;
    }

    if (editingStageId === null) {
      toast({
        title: "No stage selected",
        description: "Select a stage to edit before submitting.",
        variant: "destructive",
      });
      return;
    }

    const stageToEdit = stages.find((stage) => stage.id === editingStageId);

    if (!stageToEdit) {
      toast({
        title: "Stage not found",
        description: "Unable to load the selected stage for editing.",
        variant: "destructive",
      });
      return;
    }

    try {
      const normalized = normalizeStageForm(stageForm);
      const stageArgs = [
        BigInt(editingStageId),
        {
          ...normalized,
          soldAmount: stageToEdit.raw.soldAmount,
          whitelistOnly: stageForm.whitelistOnly,
        },
      ] as const;

      await publicClient?.simulateContract({
        address: tokenPresaleAddress,
        abi: tokenPresaleAbi,
        functionName: "updateStage",
        args: stageArgs,
        account: address,
      });

      setPendingAction("update");

      const hash = await writeContractAsync({
        address: tokenPresaleAddress,
        abi: tokenPresaleAbi,
        functionName: "updateStage",
        args: stageArgs,
        account: address,
        chain: undefined,
      });

      setTransactionHash(hash);
      toast({
        title: "Transaction submitted",
        description: "Waiting for confirmation on-chain…",
      });
    } catch (error) {
      toast({
        title: "Update stage failed",
        description: getContractError(error),
        variant: "destructive",
      });
      setPendingAction(null);
    }
  };
  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div className="">
            <h1 className="text-[22px] font-bold text-foreground mb-1">
              Presale Stages
            </h1>
            <p className="text-muted-foreground text-sm">
              Create and manage presale stages
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!isConnected}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Stage
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Create New Stage
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Configure the parameters for a new presale stage. Values are
                  submitted directly to the TokenPresale contract.
                </DialogDescription>
              </DialogHeader>
              <CreateStageForm
                form={stageForm}
                setForm={setStageForm}
                onSubmit={handleCreateStage}
                isCreating={isCreatingStage}
                createStep={stageCreateStep}
                isConnected={isConnected}
                onCancel={() => handleDialogChange(false)}
                prevStageEndDate={
                  stages.length > 0
                    ? formatDateTimeLocal(stages[stages.length - 1].raw.endTime)
                    : undefined
                }
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogChange}>
            <DialogContent className="bg-card border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Edit Stage
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Update the parameters for this presale stage. Changes are
                  written directly to the TokenPresale contract.
                </DialogDescription>
              </DialogHeader>
              <CreateStageForm
                form={stageForm}
                setForm={setStageForm}
                onSubmit={handleUpdateStage}
                isCreating={isCreatingStage}
                isConnected={isConnected}
                onCancel={() => handleEditDialogChange(false)}
                submitLabel={isCreatingStage ? "Updating…" : "Update Stage"}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stage Cards */}
        <div className="space-y-4">
          {isLoading && (
            <Card className="p-6 border-border bg-card">
              <Loader loading={true} />
            </Card>
          )}

          {!isLoading && stages.length === 0 && (
            <Card className="p-6 border-border bg-card">
              <p className="text-sm text-muted-foreground">
                No stages found on the contract. Use the controls below to
                create a stage.
              </p>
            </Card>
          )}

          {stages.map((stage) => (
            <Card
              key={stage.id}
              className="cardShadow bg-white p-6 rounded-[20px] w-full border-none"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-foreground">
                          {stage.name}
                        </h3>
                        <StatusBadge status={stage.status} />
                      </div>
                      <p className="text-3xl font-bold text-primary">
                        ${priceFormatter.format(stage.priceUsd)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        per token (USD)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {/* {stage.status === "Active" && (
                        <Button
                          variant="outline"
                          className="flex-1 border-warning text-warning hover:bg-warning/10"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                      )} */}
                      <Button
                        variant="outline"
                        className="flex-1 border-border hover:border-primary/50"
                        onClick={() => handleOpenEditStage(stage)}
                        type="button"
                        disabled={stage.status === "Completed" || stage.status === "Active"}
                        title={
                          stage.status === "Completed"
                            ? "Completed stages cannot be edited"
                            : stage.status === "Active"
                              ? "Active stages cannot be edited"
                              : undefined
                        }
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-5 rounded-[20px] bg-white border border-[#DADADA] flex items-center justify-between">
                      <div className="">
                        <p className="text-sm text-muted-foreground mb-1">
                          Tokens Sold
                        </p>
                        <p className="text-2xl font-semibold text-primary">
                          {tokenFormatter.format(stage.soldTokens)}
                        </p>
                      </div>
                      <DollarIcon />
                    </div>
                    <div className="p-5 rounded-[20px] bg-white border border-[#DADADA] flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Tokens Offered
                        </p>
                        <p className="text-2xl font-semibold text-primary">
                          {tokenFormatter.format(stage.offeredTokens)}
                        </p>
                      </div>
                      <SoldIcon />
                    </div>
                    <div className="p-5 rounded-[20px] bg-white border border-[#DADADA] flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Raised (USD)
                        </p>
                        <p className="text-2xl font-semibold text-success">
                          ${priceFormatter.format(stage.raisedUsd)}
                        </p>
                      </div>
                      <DollarIcon />
                    </div>
                    {/* <div className="p-5 rounded-[20px] bg-white border border-[#DADADA] flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Soft Cap
                        </p>
                        <p className="text-2xl font-semibold text-primary">
                          {tokenFormatter.format(stage.softCapTokens)}
                        </p>
                      </div>
                      <HardCapIcon />
                    </div>
                    <div className="p-5 rounded-[20px] bg-white border border-[#DADADA] flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Hard Cap
                        </p>
                        <p className="text-2xl font-semibold text-primary">
                          {tokenFormatter.format(stage.hardCapTokens)}
                        </p>
                      </div>
                      <HardCapIcon />
                    </div> */}
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-foreground">
                        {stage.progress.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={stage.progress} className="h-2" />
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {stage.startDate} - {stage.endDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span>
                        Min: {tokenFormatter.format(stage.minBuyTokens)} / Max:{" "}
                        {tokenFormatter.format(stage.maxBuyTokens)} tokens
                      </span>
                    </div>
                    {stage.whitelistOnly && (
                      <div className="flex items-center gap-2 text-xs text-warning">
                        <Shield className="w-3 h-3" />
                        <span>Whitelist only</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminStages;
