import { useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { Shield, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  tokenPresaleAddress,
  tokenPresaleAbi,
} from "@/lib/contracts/tokenPresale";

const formatTimestamp = (value: bigint | undefined) => {
  if (!value || value === 0n) {
    return "—";
  }

  try {
    const date = new Date(Number(value) * 1000);
    return date.toLocaleString();
  } catch {
    return value.toString();
  }
};

const AdminSettings = () => {
  if (!tokenPresaleAddress) {
    return (
      <DashboardLayout userType="admin">
        <div className="space-y-8">
          <div className="">
            <h1 className="text-[22px] font-bold text-foreground mb-1">
              Settings
            </h1>
            <p className="text-muted-foreground text-sm">
              Configure presale parameters and system settings
            </p>
          </div>

          <Card className="cardShadow bg-white p-5 rounded-[20px]">
            <h3 className="text-xl font-semibold text-destructive mb-4">
              Missing Contract Address
            </h3>
            <p className="text-sm text-muted-foreground">
              Set{" "}
              <code className="font-mono text-xs">
                VITE_TOKEN_PRESALE_ADDRESS
              </code>{" "}
              in your environment configuration to enable contract interactions
              on this page.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);

  const { data: stagesCount } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "stagesCount",
  });

  const { data: paused } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "paused",
  });

  const { data: treasury } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "treasury",
  });

  const { data: owner } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "owner",
  });

  const { data: saleToken } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "saleToken",
  });

  const { data: saleTokenDecimals } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "saleTokenDecimals",
  });

  const { data: priceFeed } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "ethUsdPriceFeed",
  });

  const decimals = saleTokenDecimals ? Number(saleTokenDecimals) : 18;
  const totalStages = stagesCount ? Number(stagesCount) : 0;
  const hasStages = totalStages > 0;

  useEffect(() => {
    if (hasStages && selectedStageIndex > totalStages - 1) {
      setSelectedStageIndex(totalStages - 1);
    }
  }, [hasStages, totalStages, selectedStageIndex]);

  const { data: stageData } = useReadContract({
    address: tokenPresaleAddress,
    abi: tokenPresaleAbi,
    functionName: "getStage",
    args: [BigInt(selectedStageIndex)],
    query: {
      enabled: hasStages,
    },
  });

  const stageDetails = useMemo(() => {
    if (!stageData) {
      return null;
    }

    return {
      price: formatUnits(stageData.price, 18),
      offeredAmount: formatUnits(stageData.offeredAmount, decimals),
      soldAmount: formatUnits(stageData.soldAmount, decimals),
      minBuyTokens: formatUnits(stageData.minBuyTokens, decimals),
      maxBuyTokens: formatUnits(stageData.maxBuyTokens, decimals),
      startTime: formatTimestamp(stageData.startTime),
      endTime: formatTimestamp(stageData.endTime),
      cliff: Number(stageData.cliff),
      duration: Number(stageData.duration),
      whitelistOnly: stageData.whitelistOnly,
    };
  }, [stageData, decimals]);

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Admin Settings
          </h1>
          <p className="text-muted-foreground">
            Configure presale parameters and system settings
          </p>
        </div>

        {/* Security Settings */}
        <Card className="cardShadow bg-white p-5 rounded-[20px]">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">
              Security & Access
            </h3>
          </div>
          <div className="space-y-6">
            {/* <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Whitelist Mode</p>
                <p className="text-sm text-muted-foreground">
                  Only allow whitelisted addresses to purchase
                </p>
              </div>
              <Switch />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">KYC Requirement</p>
                <p className="text-sm text-muted-foreground">
                  Require KYC verification for purchases
                </p>
              </div>
              <Switch />
            </div>
            <Separator className="bg-border" /> */}
            <div className="space-y-3">
              <p className="font-medium text-foreground">Admin Wallet</p>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {treasury ?? "—"}
                </p>
              </div>
              <Button
                variant="outline"
                className="border-border hover:border-primary/50"
              >
                Change Admin Wallet
              </Button>
            </div>
          </div>
        </Card>

        {/* Emergency Controls */}
        <Card className="cardShadow bg-white p-5 rounded-[20px]">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="text-xl font-semibold text-destructive">
              Emergency Controls
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div>
                <p className="font-medium text-foreground">Pause All Sales</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Immediately stop all token purchases across all stages
                </p>
              </div>
              <Button
                variant="outline"
                className="border-warning text-warning hover:bg-warning/10"
              >
                Pause Sales
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div>
                <p className="font-medium text-foreground">
                  Emergency Withdraw
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Withdraw all funds from the contract to admin wallet
                </p>
              </div>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
              >
                Emergency Withdraw
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive">
              <div>
                <p className="font-medium text-destructive">
                  Terminate Contract
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently disable the contract - this cannot be undone
                </p>
              </div>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-white"
              >
                Terminate
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
