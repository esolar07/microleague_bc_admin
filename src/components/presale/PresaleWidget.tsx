import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Address,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  AlertCircle,
  Clock,
  Info,
  Loader2,
  PauseCircle,
  PlayCircle,
  Shield,
  Timer,
  Wallet,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  tokenPresaleAddress,
  tokenPresaleAbi,
} from "@/lib/contracts/tokenPresale";
import { sepolia } from "viem/chains";
import { TokenPresale__factory } from "@/contracts/typechain";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useEthersSigner } from "@/hooks/useEtherSigner";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type StageStruct = {
  price: bigint;
  offeredAmount: bigint;
  soldAmount: bigint;
  minBuyTokens: bigint;
  maxBuyTokens: bigint;
  hardCap: bigint;
  softCap: bigint;
  startTime: bigint;
  endTime: bigint;
  cliff: bigint;
  duration: bigint;
  active: boolean;
  whitelistOnly: boolean;
};

type StageView = {
  id: number;
  struct: StageStruct;
  priceUsd: number;
  remainingTokens: number;
  progress: number;
  status: StageStatus;
  startTimeLabel: string;
  endTimeLabel: string;
  startsAtMs: number;
  endsAtMs: number;
};

type StageStatus = "upcoming" | "active" | "ended" | "paused";

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

const getStageStatus = (
  stage: StageStruct,
  nowSeconds: number
): StageStatus => {
  const start = Number(stage.startTime);
  const end = Number(stage.endTime);

  if (!stage.active) {
    if (start > nowSeconds) {
      return "upcoming";
    }
    if (end <= nowSeconds) {
      return "ended";
    }
    return "paused";
  }

  if (start > nowSeconds) {
    return "upcoming";
  }

  if (end <= nowSeconds) {
    return "ended";
  }

  return "active";
};

const formatDuration = (ms: number) => {
  if (ms <= 0) {
    return "0s";
  }

  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MINUTE);
  const seconds = Math.floor((ms % MINUTE) / SECOND);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && parts.length < 2) parts.push(`${seconds}s`);

  return parts.join(" ") || "0s";
};

const PresaleWidget = () => {
  const { toast } = useToast();
  const { address, status } = useAccount();
  const isConnected = status === "connected" && Boolean(address);
  const signer = useEthersSigner();
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [amount, setAmount] = useState("0.1");
  const [selectedCurrency, setSelectedCurrency] = useState<
    "ETH" | "USDT" | "USDC"
  >("ETH");
  const [transactionHash, setTransactionHash] = useState<
    `0x${string}` | undefined
  >(undefined);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: saleTokenDecimals } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "saleTokenDecimals",
    query: {
      enabled: Boolean(tokenPresaleAddress),
    },
  });

  const decimals = saleTokenDecimals ? Number(saleTokenDecimals) : 18;

  const paymentTokens = useMemo(() => {
    const items: Array<{
      symbol: "ETH" | "USDT" | "USDC";
      address: Address;
      isNative: boolean;
    }> = [{ symbol: "ETH", address: ZERO_ADDRESS, isNative: true }];

    const usdtAddress = import.meta.env.VITE_USDT_ADDRESS;
    const usdcAddress = import.meta.env.VITE_USDC_ADDRESS;

    if (usdtAddress?.startsWith("0x")) {
      items.push({
        symbol: "USDT",
        address: usdtAddress as Address,
        isNative: false,
      });
    }

    if (usdcAddress?.startsWith("0x")) {
      items.push({
        symbol: "USDC",
        address: usdcAddress as Address,
        isNative: false,
      });
    }

    return items;
  }, []);

  const erc20Tokens = paymentTokens.filter((token) => !token.isNative);

  const { data: erc20PaymentMeta } = useReadContracts({
    allowFailure: true,
    contracts: erc20Tokens.flatMap((token) => [
      {
        address: tokenPresaleAddress,
        abi: tokenPresaleAbi,
        functionName: "paymentAllowed",
        args: [token.address],
      } as const,
      {
        address: tokenPresaleAddress,
        abi: tokenPresaleAbi,
        functionName: "paymentDecimals",
        args: [token.address],
      } as const,
    ]),
    query: {
      enabled: erc20Tokens.length > 0 && Boolean(tokenPresaleAddress),
    },
  } as any);

  const paymentMeta = useMemo(() => {
    const meta = new Map<
      "ETH" | "USDT" | "USDC",
      {
        allowed: boolean;
        decimals: number;
        address: Address;
        isNative: boolean;
      }
    >();

    paymentTokens.forEach((token) => {
      meta.set(token.symbol, {
        allowed: token.isNative,
        decimals: token.isNative ? 18 : 6,
        address: token.address,
        isNative: token.isNative,
      });
    });

    if (
      erc20PaymentMeta &&
      erc20PaymentMeta.length === erc20Tokens.length * 2
    ) {
      erc20Tokens.forEach((token, index) => {
        const allowedResult = erc20PaymentMeta[index * 2];
        const decimalsResult = erc20PaymentMeta[index * 2 + 1];

        const allowed = allowedResult?.result ?? false;
        const paymentDecimals = decimalsResult?.result ?? 6n;

        meta.set(token.symbol, {
          allowed,
          decimals: Number(paymentDecimals),
          address: token.address,
          isNative: false,
        });
      });
    }

    return meta;
  }, [erc20PaymentMeta, paymentTokens, erc20Tokens]);

  const selectedPaymentMeta = paymentMeta.get(selectedCurrency) ?? {
    allowed: true,
    decimals: 18,
    address: ZERO_ADDRESS,
    isNative: true,
  };

  const {
    data: stagesCount,
    isLoading: isLoadingStagesCount,
    refetch: refetchStagesCount,
  } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "stagesCount",
    query: {
      enabled: Boolean(tokenPresaleAddress),
    },
  });

  const totalStages = stagesCount ? Number(stagesCount) : 0;

  const stageIndexes = useMemo(
    () => Array.from({ length: totalStages }, (_, index) => index),
    [totalStages]
  );

  const {
    data: stageContracts,
    isLoading: isLoadingStages,
    isFetching: isFetchingStages,
    refetch: refetchStageContracts,
  } = useReadContracts({
    allowFailure: true,
    contracts: stageIndexes.map((index) => ({
      address: tokenPresaleAddress,
      abi: tokenPresaleAbi,
      functionName: "getStage",
      args: [BigInt(index)],
    })),
    query: {
      enabled: Boolean(tokenPresaleAddress) && totalStages > 0,
    },
  } as any);

  const stageViews = useMemo<StageView[]>(() => {
    if (!stageContracts || stageContracts.length === 0) {
      return [];
    }

    const nowSeconds = Math.floor(now / 1000);

    return stageContracts
      .map((stageContract, index) => {
        const result = stageContract?.result as any;
        if (!result) {
          return undefined;
        }

        const priceUsd = Number(formatUnits(result.price, 18));
        const offeredTokens = Number(
          formatUnits(result.offeredAmount, decimals)
        );
        const soldTokens = Number(formatUnits(result.soldAmount, decimals));
        const remainingTokens = Math.max(offeredTokens - soldTokens, 0);
        const progress =
          offeredTokens > 0
            ? Math.min((soldTokens / offeredTokens) * 100, 100)
            : 0;
        const status = getStageStatus(result, nowSeconds);
        const startsAtMs = Number(result.startTime) * 1000;
        const endsAtMs = Number(result.endTime) * 1000;

        return {
          id: index,
          struct: result,
          priceUsd,
          remainingTokens,
          progress,
          status,
          startTimeLabel: formatTimestamp(result.startTime),
          endTimeLabel: formatTimestamp(result.endTime),
          startsAtMs,
          endsAtMs,
        };
      })
      .filter((stage): stage is StageView => Boolean(stage));
  }, [stageContracts, decimals, now]);

  useEffect(() => {
    if (stageViews.length === 0) {
      return;
    }

    if (selectedStageIndex > stageViews.length - 1) {
      setSelectedStageIndex(0);
    }
  }, [stageViews, selectedStageIndex]);

  const currentStage = stageViews[selectedStageIndex];

  const paymentAmount = useMemo(() => {
    if (!amount.trim()) {
      return undefined;
    }
    try {
      return parseUnits(amount, selectedPaymentMeta.decimals);
    } catch {
      return undefined;
    }
  }, [amount, selectedPaymentMeta.decimals]);

  const adjustDecimals = (value: bigint, from: number, to: number) => {
    if (from === to) {
      return value;
    }

    const difference = Math.abs(from - to);
    const factor = 10n ** BigInt(difference);

    if (from < to) {
      return value * factor;
    }

    return value / factor;
  };

  const { data: ethPriceData } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "getEthPrice",
    query: {
      enabled: Boolean(tokenPresaleAddress) && selectedPaymentMeta.isNative,
    },
  });

  const expectedTokens = useMemo(() => {
    if (!currentStage || !paymentAmount || paymentAmount === 0n) {
      return undefined;
    }

    const stagePrice = currentStage.struct.price;
    if (!stagePrice || stagePrice === 0n) {
      return undefined;
    }

    if (selectedPaymentMeta.isNative) {
      if (!ethPriceData) {
        return undefined;
      }

      const [ethPrice, ethPriceDecimalsBig] = ethPriceData;
      if (!ethPrice || ethPrice === 0n) {
        return undefined;
      }

      const ethPriceDecimals = Number(ethPriceDecimalsBig);

      const paymentUsd18 =
        (paymentAmount * ethPrice) / 10n ** BigInt(ethPriceDecimals);

      if (paymentUsd18 === 0n) {
        return 0n;
      }

      return (paymentUsd18 * 10n ** BigInt(decimals)) / stagePrice;
    }

    const paymentUsd18 = adjustDecimals(
      paymentAmount,
      selectedPaymentMeta.decimals,
      18
    );

    if (paymentUsd18 === 0n) {
      return 0n;
    }

    return (paymentUsd18 * 10n ** BigInt(decimals)) / stagePrice;
  }, [
    currentStage,
    decimals,
    ethPriceData,
    paymentAmount,
    selectedPaymentMeta.decimals,
    selectedPaymentMeta.isNative,
  ]);

  const minTokens = useMemo(() => {
    if (!expectedTokens || expectedTokens === 0n) {
      return 0n;
    }

    const withSlippage = (expectedTokens * 99n) / 100n;
    return withSlippage === 0n ? expectedTokens : withSlippage;
  }, [expectedTokens]);

  const pricePerTokenInCurrency = useMemo(() => {
    if (
      !expectedTokens ||
      expectedTokens === 0n ||
      !paymentAmount ||
      paymentAmount === 0n
    ) {
      return undefined;
    }

    const tokensHuman = Number(formatUnits(expectedTokens, decimals));

    if (!Number.isFinite(tokensHuman) || tokensHuman === 0) {
      return undefined;
    }

    if (selectedPaymentMeta.isNative && ethPriceData) {
      const [ethPrice, ethPriceDecimalsBig] = ethPriceData;
      if (!ethPrice || ethPrice === 0n) {
        return undefined;
      }

      const ethPriceDecimals = Number(ethPriceDecimalsBig);
      const paymentUsdBig =
        (paymentAmount * ethPrice) / 10n ** BigInt(ethPriceDecimals);
      const paymentUsd = Number(formatUnits(paymentUsdBig, 18));

      return paymentUsd / tokensHuman;
    }

    const paymentHuman = Number(
      formatUnits(paymentAmount, selectedPaymentMeta.decimals)
    );
    return paymentHuman / tokensHuman;
  }, [
    decimals,
    ethPriceData,
    expectedTokens,
    paymentAmount,
    selectedPaymentMeta.decimals,
    selectedPaymentMeta.isNative,
  ]);

  const expectedTokenDisplay = useMemo(() => {
    if (!expectedTokens || expectedTokens === 0n) {
      return "0";
    }

    const raw = Number(formatUnits(expectedTokens, decimals));
    const displayPrecision = 6;

    if (!Number.isFinite(raw)) {
      return "0";
    }

    const threshold = Math.pow(10, -displayPrecision);

    if (Math.abs(raw) < threshold) {
      const minimum = Number(`1e-${displayPrecision}`).toLocaleString(
        undefined,
        {
          maximumFractionDigits: displayPrecision,
        }
      );
      return `< ${minimum}`;
    }

    return raw.toLocaleString(undefined, {
      maximumFractionDigits: displayPrecision,
    });
  }, [decimals, expectedTokens]);

  const { data: balance } = useBalance({
    address,
    token: selectedPaymentMeta.isNative
      ? undefined
      : selectedPaymentMeta.address,
    query: { enabled: Boolean(address) },
  });

  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const {
    data: receipt,
    error: waitError,
    isLoading: isWaitingForReceipt,
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
    confirmations: 1,
    query: { enabled: Boolean(transactionHash) },
  });

  const isProcessing = isWriting || isWaitingForReceipt;

  useEffect(() => {
    if (!waitError) {
      return;
    }

    const description =
      waitError instanceof Error
        ? waitError.message
        : "Transaction failed. Please try again.";

    toast({
      title: "Purchase failed",
      description,
      variant: "destructive",
    });

    setTransactionHash(undefined);
  }, [waitError, toast]);

  useEffect(() => {
    if (!receipt) {
      return;
    }

    toast({
      title: "Purchase confirmed",
      description: "Your presale transaction has been confirmed on-chain.",
    });

    setTransactionHash(undefined);
    void Promise.allSettled([refetchStagesCount(), refetchStageContracts()]);
  }, [receipt, toast, refetchStagesCount, refetchStageContracts]);

  if (!tokenPresaleAddress) {
    return (
      <Card className="p-6 border-destructive/50 bg-card">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold">Missing contract configuration</p>
            <p className="text-sm text-muted-foreground">
              Set{" "}
              <code className="font-mono text-xs">
                VITE_TOKEN_PRESALE_ADDRESS
              </code>{" "}
              to enable the presale widget.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const handlePurchase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isConnected || !address) {
      toast({
        title: "Wallet disconnected",
        description:
          "Please connect your wallet to participate in the presale.",
        variant: "destructive",
      });
      return;
    }

    if (!currentStage) {
      toast({
        title: "No stages available",
        description: "There are no active stages on the contract.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPaymentMeta.allowed) {
      toast({
        title: "Payment token disabled",
        description: `${selectedCurrency} is currently disabled for payments.`,
        variant: "destructive",
      });
      return;
    }

    if (!paymentAmount || paymentAmount === 0n) {
      toast({
        title: "Invalid amount",
        description: `Enter a valid ${selectedCurrency} amount greater than zero.`,
        variant: "destructive",
      });
      return;
    }

    if (!expectedTokens || expectedTokens === 0n) {
      toast({
        title: "Cannot calculate tokens",
        description:
          "Unable to determine token amount for the specified ETH value.",
        variant: "destructive",
      });
      return;
    }

    try {
      let hash: `0x${string}`;
      if (selectedPaymentMeta.isNative) {
        const presale = TokenPresale__factory.connect(
          tokenPresaleAddress,
          signer
        );
        const tx = await presale.buyWithETH(
          BigInt(currentStage.id),
          minTokens > 0n ? minTokens : expectedTokens,
          {
            value: paymentAmount,
            gasLimit: 3000000,
          }
        );
        hash = tx.hash as Address;

        // hash = await writeContractAsync({
        //   address: tokenPresaleAddress,
        //   abi: tokenPresaleAbi,
        //   functionName: "buyWithETH",
        //   args: [BigInt(currentStage.id), BigInt(1)],
        //   value: paymentAmount,
        //   chain: sepolia,
        //   account: address,
        // });
      } else {
        hash = await writeContractAsync({
          address: tokenPresaleAddress,
          abi: tokenPresaleAbi,
          functionName: "buyWithToken",
          args: [
            selectedPaymentMeta.address,
            paymentAmount,
            BigInt(currentStage.id),
            minTokens > 0n ? minTokens : expectedTokens,
          ],
          chain: sepolia,
          account: address,
        });
      }

      setTransactionHash(hash);
      toast({
        title: "Transaction submitted",
        description: "Awaiting confirmation…",
      });
    } catch (error) {
      const description =
        error instanceof Error
          ? error.message
          : "Failed to submit the transaction.";

      toast({
        title: "Purchase failed",
        description,
        variant: "destructive",
      });
    }
  };

  const isLoading = isLoadingStagesCount || isLoadingStages || isFetchingStages;

  return (
    <Card className="p-6 md:p-8 bg-card border border-border shadow-lg">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Presale Widget
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to simulate presale purchases directly from this
            page.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/40 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Fetching current stage data…
          </div>
        )}

        {!isLoading && stageViews.length === 0 && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/40 text-muted-foreground">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">
                No presale stages found
              </p>
              <p className="text-sm">
                Once stages are added on-chain they will appear here
                automatically.
              </p>
            </div>
          </div>
        )}

        {stageViews.length > 0 && currentStage && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stage">Select Stage</Label>
                <Select
                  value={selectedStageIndex.toString()}
                  onValueChange={(value) =>
                    setSelectedStageIndex(Number(value))
                  }
                >
                  <SelectTrigger
                    id="stage"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Select a stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stageViews.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id.toString()}>
                        Stage {stage.id + 1} • {stage.status.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Stage Price (USD)</Label>
                <Input
                  readOnly
                  value={currentStage.priceUsd.toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}
                  className="bg-background border-border"
                />
                {pricePerTokenInCurrency !== undefined &&
                  !Number.isNaN(pricePerTokenInCurrency) && (
                    <p className="text-xs text-muted-foreground">
                      ≈{" "}
                      {pricePerTokenInCurrency.toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })}{" "}
                      {selectedCurrency} per token (based on entered amount)
                    </p>
                  )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Remaining Allocation
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {currentStage.remainingTokens.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  tokens
                </p>
                <p className="text-xs text-muted-foreground">
                  Soft cap:{" "}
                  {Number(
                    formatUnits(currentStage.struct.softCap, decimals)
                  ).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  tokens
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Stage Window
                </p>
                <p className="text-sm text-foreground flex flex-col md:flex-row md:items-center md:gap-2">
                  <span className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    {currentStage.startTimeLabel}
                  </span>
                  <span className="hidden md:inline text-muted-foreground">
                    →
                  </span>
                  <span>{currentStage.endTimeLabel}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <div className="inline-flex items-center gap-1 font-medium text-foreground">
                  {currentStage.status === "active" ? (
                    <>
                      <Clock className="w-3 h-3" />
                      Ends in {formatDuration(currentStage.endsAtMs - now)}
                    </>
                  ) : currentStage.status === "upcoming" ? (
                    <>
                      <PlayCircle className="w-3 h-3" />
                      Starts in {formatDuration(currentStage.startsAtMs - now)}
                    </>
                  ) : currentStage.status === "paused" ? (
                    <>
                      <PauseCircle className="w-3 h-3" />
                      Stage paused
                    </>
                  ) : (
                    <>
                      <Info className="w-3 h-3" />
                      Stage ended
                    </>
                  )}
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    currentStage.status === "active"
                      ? "bg-success/10 text-success"
                      : currentStage.status === "upcoming"
                      ? "bg-warning/10 text-warning"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStage.status.toUpperCase()}
                </span>
              </div>
              <Progress value={currentStage.progress} className="h-2" />
            </div>

            <form className="space-y-4" onSubmit={handlePurchase}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currencyAmount">
                    {selectedCurrency} Amount
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="currencyAmount"
                        type="number"
                        step={
                          selectedCurrency === "ETH" ? "0.0001" : "0.000001"
                        }
                        min="0"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        className="bg-background border-border"
                      />
                    </div>
                    <Select
                      value={selectedCurrency}
                      onValueChange={(value) =>
                        setSelectedCurrency(value as typeof selectedCurrency)
                      }
                    >
                      <SelectTrigger className="w-24 bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTokens.map((token) => {
                          const meta = paymentMeta.get(token.symbol);
                          return (
                            <SelectItem
                              key={token.symbol}
                              value={token.symbol}
                              disabled={meta ? !meta.allowed : false}
                            >
                              {token.symbol}
                              {meta && !meta.allowed ? " (disabled)" : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  {balance && (
                    <p className="text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="w-3 h-3" />
                        Balance:{" "}
                        {selectedPaymentMeta.isNative
                          ? formatEther(balance.value)
                          : Number(
                              formatUnits(
                                balance.value,
                                selectedPaymentMeta.decimals
                              )
                            ).toLocaleString(undefined, {
                              maximumFractionDigits: 4,
                            })}{" "}
                        {balance.symbol}
                      </span>
                    </p>
                  )}
                  {!selectedPaymentMeta.allowed && (
                    <p className="text-xs text-destructive">
                      {selectedCurrency} is not enabled for payments on this
                      contract.
                    </p>
                  )}
                  {!selectedPaymentMeta.isNative && (
                    <p className="text-xs text-muted-foreground">
                      Ensure you have approved the TokenPresale contract to
                      spend your {selectedCurrency}.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Estimated Tokens</Label>
                  <Input
                    readOnly
                    value={expectedTokenDisplay}
                    className="bg-background border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum received (after 1% slippage):{" "}
                    {minTokens > 0n
                      ? Number(formatUnits(minTokens, decimals)).toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 4,
                          }
                        )
                      : "0"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stage limits: Min{" "}
                    {Number(
                      formatUnits(currentStage.struct.minBuyTokens, decimals)
                    ).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    / Max{" "}
                    {Number(
                      formatUnits(currentStage.struct.maxBuyTokens, decimals)
                    ).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    tokens
                  </p>
                  {currentStage.struct.whitelistOnly && (
                    <p className="text-xs text-warning inline-flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Whitelist only
                    </p>
                  )}
                </div>
              </div>

              {currentStage.status !== "active" && (
                <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <AlertCircle className="mt-0.5 w-3.5 h-3.5 flex-shrink-0" />
                  <div>
                    {currentStage.status === "upcoming" && (
                      <>
                        Stage starts at{" "}
                        <span className="font-medium">
                          {currentStage.startTimeLabel}
                        </span>
                        . You can prepare your transaction now, but purchases
                        will only succeed once the stage is active.
                      </>
                    )}
                    {currentStage.status === "paused" && (
                      <>
                        This stage is currently paused. Admins must resume the
                        stage before purchases can proceed.
                      </>
                    )}
                    {currentStage.status === "ended" && (
                      <>
                        This stage has ended. Select another active stage to
                        continue.
                      </>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={
                  !isConnected ||
                  isProcessing ||
                  !paymentAmount ||
                  paymentAmount === 0n ||
                  currentStage.status !== "active" ||
                  !selectedPaymentMeta.allowed
                }
              >
                {isProcessing ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing…
                  </span>
                ) : (
                  "Buy With ETH"
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </Card>
  );
};

export default PresaleWidget;
