import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

const AdminStages = () => {
  const { address } = useAccount();
  const { toast } = useToast();
  const { status } = useAccount();
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

  const decimals = saleTokenDecimals ? Number(saleTokenDecimals) : 18;

  const parseDaysToSeconds = (value: string) => {
    const minutes = Number(value); // Changed from days
    if (!Number.isFinite(minutes) || minutes < 0) {
      throw new Error("Cliff and duration must be non-negative numbers.");
    }

    return BigInt(Math.floor(minutes)) * 60n; // Changed from 86_400n to 60n
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
        "Maximum purchase must be greater than minimum purchase."
      );
    }

    const cliff = form.cliffDays ? parseDaysToSeconds(form.cliffDays) : 0n;
    const duration = form.durationDays
      ? parseDaysToSeconds(form.durationDays)
      : 0n;

    const releaseInterval = form.releaseIntervalDays
      ? parseDaysToSeconds(form.releaseIntervalDays)
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
    [totalStages]
  );

  const contracts = useMemo(
    () =>
      stageIndexes.map((index) => ({
        address: tokenPresaleAddress,
        abi: tokenPresaleAbi,
        functionName: "getStage",
        args: [BigInt(index)],
      })),
    [stageIndexes]
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
    if (!open) {
      resetForm();
      setPendingAction(null);
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

  const isCreatingStage = isWriting || isWaitingForReceipt;

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
      // releaseIntervalDays:
      //   raw.releaseInterval === 0n
      //     ? ""
      //     : (Number(raw.releaseInterval) / 86_400).toString(),
      releaseIntervalDays:
        raw.releaseInterval === 0n ? "" : Number(120).toString(), // Changed from 86_400 to 60
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

      setPendingAction("create");

      const hash = await writeContractAsync({
        address: tokenPresaleAddress,
        abi: tokenPresaleAbi,
        functionName: "addStage",
        args: [
          {
            ...normalized,
            soldAmount: 0n,
            // active: stageForm.active,
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

      setPendingAction("update");

      const hash = await writeContractAsync({
        address: tokenPresaleAddress,
        abi: tokenPresaleAbi,
        functionName: "updateStage",
        args: [
          BigInt(editingStageId),
          {
            ...normalized,
            soldAmount: stageToEdit.raw.soldAmount,
            // active: stageForm.active,
            releaseInterval: 1800n,
            whitelistOnly: stageForm.whitelistOnly,
          },
        ],
        account: address,
        chain: undefined,
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
          : "Failed to update the stage. Please try again.";

      toast({
        title: "Update stage failed",
        description,
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
                isConnected={isConnected}
                onCancel={() => handleDialogChange(false)}
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
              <form className="space-y-4 py-4" onSubmit={handleUpdateStage}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price-edit">Token Price (USD)</Label>
                    <Input
                      id="price-edit"
                      type="number"
                      step="0.000000000000000001"
                      min="0"
                      required
                      value={stageForm.price}
                      onChange={(event) =>
                        setStageForm((prev) => ({
                          ...prev,
                          price: event.target.value,
                        }))
                      }
                      className="bg-background border-border"
                    />
                    <p className="text-xs text-muted-foreground">
                      Stored as a fixed 18-decimal USD price per token.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offeredTokens-edit">Tokens Offered</Label>
                    <Input
                      id="offeredTokens-edit"
                      type="number"
                      step="0.0001"
                      min="0"
                      required
                      value={stageForm.offeredTokens}
                      onChange={(event) =>
                        setStageForm((prev) => ({
                          ...prev,
                          offeredTokens: event.target.value,
                        }))
                      }
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minBuyTokens-edit">
                      Minimum Purchase (tokens)
                    </Label>
                    <Input
                      id="minBuyTokens-edit"
                      type="number"
                      step="0.0001"
                      min="0"
                      required
                      value={stageForm.minBuyTokens}
                      onChange={(event) =>
                        setStageForm((prev) => ({
                          ...prev,
                          minBuyTokens: event.target.value,
                        }))
                      }
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxBuyTokens-edit">
                      Maximum Purchase (tokens)
                    </Label>
                    <Input
                      id="maxBuyTokens-edit"
                      type="number"
                      step="0.0001"
                      min="0"
                      required
                      value={stageForm.maxBuyTokens}
                      onChange={(event) =>
                        setStageForm((prev) => ({
                          ...prev,
                          maxBuyTokens: event.target.value,
                        }))
                      }
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                {/* <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="softCapTokens-edit">
                      Soft Cap (tokens)
                    </Label>
                    <Input
                      id="softCapTokens-edit"
                      type="number"
                      step="0.0001"
                      min="0"
                      value={stageForm.softCapTokens}
                      onChange={(event) =>
                        setStageForm((prev) => ({
                          ...prev,
                          softCapTokens: event.target.value,
                        }))
                      }
                      placeholder="Defaults to 50% of offered tokens"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hardCapTokens-edit">
                      Hard Cap (tokens)
                    </Label>
                    <Input
                      id="hardCapTokens-edit"
                      type="number"
                      step="0.0001"
                      min="0"
                      value={stageForm.hardCapTokens}
                      onChange={(event) =>
                        setStageForm((prev) => ({
                          ...prev,
                          hardCapTokens: event.target.value,
                        }))
                      }
                      placeholder="Defaults to tokens offered"
                      className="bg-background border-border"
                    />
                  </div>
                </div> */}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate-edit">Start Time</Label>
                    <Input
                      id="startDate-edit"
                      type="datetime-local"
                      required
                      value={stageForm.startDate}
                      onChange={(event) =>
                        setStageForm((prev) => ({
                          ...prev,
                          startDate: event.target.value,
                        }))
                      }
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate-edit">End Time</Label>
                    <Input
                      id="endDate-edit"
                      type="datetime-local"
                      required
                      value={stageForm.endDate}
                      onChange={(event) =>
                        setStageForm((prev) => ({
                          ...prev,
                          endDate: event.target.value,
                        }))
                      }
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cliffDays-edit">Cliff (days)</Label>
                    <Input
                      id="cliffDays-edit"
                      type="number"
                      min="0"
                      value={stageForm.cliffDays}
                      onChange={(event) =>
                        setStageForm((prev) => ({
                          ...prev,
                          cliffDays: event.target.value,
                        }))
                      }
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="durationDays-edit">
                      Vesting Duration (days)
                    </Label>
                    <Input
                      id="durationDays-edit"
                      type="number"
                      min="0"
                      value={stageForm.durationDays}
                      onChange={(event) =>
                        setStageForm((prev) => ({
                          ...prev,
                          durationDays: event.target.value,
                        }))
                      }
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="releaseIntervalDays-edit">
                    Release Interval (days)
                  </Label>
                  <Input
                    id="releaseIntervalDays-edit"
                    type="number"
                    min="0"
                    value={stageForm.releaseIntervalDays}
                    onChange={(event) =>
                      setStageForm((prev) => ({
                        ...prev,
                        releaseIntervalDays: event.target.value,
                      }))
                    }
                    placeholder="0 for instant release"
                    className="bg-background border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Interval in days between token releases during vesting
                  </p>
                </div> */}

                <div className="space-y-2">
                  <Label htmlFor="releaseIntervalDays-edit">
                    Release Interval (minutes) {/* Changed from (days) */}
                  </Label>
                  <Input
                    id="releaseIntervalDays-edit"
                    type="number"
                    min="0"
                    value={stageForm.releaseIntervalDays}
                    onChange={(event) =>
                      setStageForm((prev) => ({
                        ...prev,
                        releaseIntervalDays: event.target.value,
                      }))
                    }
                    placeholder="0 for instant release"
                    className="bg-background border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Interval in minutes between token releases during vesting{" "}
                    {/* Changed from days */}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium text-foreground">
                        Whitelist required
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Restrict purchases to whitelisted accounts
                      </p>
                    </div>
                    <Switch
                      checked={stageForm.whitelistOnly}
                      onCheckedChange={(checked) =>
                        setStageForm((prev) => ({
                          ...prev,
                          whitelistOnly: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <div />
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-border hover:border-primary/50"
                      onClick={() => handleEditDialogChange(false)}
                      disabled={isCreatingStage}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={isCreatingStage}
                    >
                      {isCreatingStage ? "Updating…" : "Update Stage"}
                    </Button>
                  </div>
                </div>
              </form>
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
