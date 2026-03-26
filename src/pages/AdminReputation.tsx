import { useState } from "react";
import { useBuyers } from "@/hooks/useBuyers";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Star, TrendingDown, TrendingUp, Users, Award } from "lucide-react";
import { Paginate } from "@/components/ui/paginate";

type Tier = "All" | "Excellent" | "Good" | "Fair" | "Poor" | "Very Poor";

const TIER_STYLES: Record<string, string> = {
  Excellent: "border-green-500 text-green-600 bg-green-50",
  Good: "border-blue-500 text-blue-600 bg-blue-50",
  Fair: "border-amber-500 text-amber-600 bg-amber-50",
  Poor: "border-orange-500 text-orange-600 bg-orange-50",
  "Very Poor": "border-red-500 text-red-600 bg-red-50",
};

const TIER_RANGES: Record<Exclude<Tier, "All">, [number, number]> = {
  Excellent: [160, 200],
  Good: [120, 159],
  Fair: [80, 119],
  Poor: [40, 79],
  "Very Poor": [0, 39],
};

const formatDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Never";

const getDisplayName = (buyer: {
  username?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  walletAddress?: string;
}): { primary: string; secondary: string | null } => {
  const name =
    buyer.fullName?.trim() ||
    [buyer.firstName, buyer.lastName].filter(Boolean).join(" ").trim() ||
    buyer.username?.trim();

  if (name) {
    return {
      primary: name,
      secondary: buyer.walletAddress
        ? `${buyer.walletAddress.slice(0, 6)}...${buyer.walletAddress.slice(-4)}`
        : null,
    };
  }

  return {
    primary: buyer.walletAddress
      ? `${buyer.walletAddress.slice(0, 10)}...${buyer.walletAddress.slice(-8)}`
      : "Unknown",
    secondary: null,
  };
};

const AdminReputation = () => {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<Tier>("All");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch all buyers — reputation fields are included in the user document
  const { data: buyersResponse, isLoading } = useBuyers({
    search: search || undefined,
    page,
    limit,
  });

  const allBuyers = buyersResponse?.data?.data?.data ?? [];
  const pagination = buyersResponse?.data?.data?.pagination ?? {
    totalCount: 0,
    totalPages: 0,
    page: 1,
    limit,
  };

  // Filter by tier client-side (reputation not a backend filter yet)
  const filtered =
    tierFilter === "All"
      ? allBuyers
      : allBuyers.filter((b) => b.reputationTier === tierFilter);

  // Sort descending by score
  const sorted = [...filtered].sort(
    (a, b) => (b.reputationScore ?? 100) - (a.reputationScore ?? 100)
  );

  // Tier distribution counts from current page
  const tierCounts = {
    Excellent: allBuyers.filter((b) => b.reputationTier === "Excellent").length,
    Good: allBuyers.filter((b) => (b.reputationTier ?? "Good") === "Good").length,
    Fair: allBuyers.filter((b) => b.reputationTier === "Fair").length,
    Poor: allBuyers.filter((b) => b.reputationTier === "Poor").length,
    "Very Poor": allBuyers.filter((b) => b.reputationTier === "Very Poor").length,
  };

  const statCards = [
    {
      label: "Excellent",
      count: tierCounts.Excellent,
      range: "160 – 200",
      color: "text-green-600",
      bg: "bg-green-50",
      icon: <Award className="w-5 h-5 text-green-500" />,
    },
    {
      label: "Good",
      count: tierCounts.Good,
      range: "120 – 159",
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: <Star className="w-5 h-5 text-blue-500" />,
    },
    {
      label: "Fair",
      count: tierCounts.Fair,
      range: "80 – 119",
      color: "text-amber-600",
      bg: "bg-amber-50",
      icon: <Users className="w-5 h-5 text-amber-500" />,
    },
    {
      label: "Poor",
      count: tierCounts.Poor,
      range: "40 – 79",
      color: "text-orange-600",
      bg: "bg-orange-50",
      icon: <TrendingDown className="w-5 h-5 text-orange-500" />,
    },
    {
      label: "Very Poor",
      count: tierCounts["Very Poor"],
      range: "0 – 39",
      color: "text-red-600",
      bg: "bg-red-50",
      icon: <TrendingDown className="w-5 h-5 text-red-500" />,
    },
  ];

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-[22px] font-bold text-foreground mb-1">
            Reputation Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitor participant reputation scores using contribution activity, KYC status, staking activity, and external credit data.
          </p>
        </div>

        {/* Tier distribution stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((s) => (
            <Card
              key={s.label}
              className={`cardShadow bg-white p-4 rounded-[20px] cursor-pointer transition-all hover:border-primary/30 ${
                tierFilter === s.label ? "ring-2 ring-primary" : ""
              }`}
              onClick={() =>
                setTierFilter((prev) =>
                  prev === s.label ? "All" : (s.label as Tier)
                )
              }
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${s.color}`}>{s.label}</span>
                {s.icon}
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.range}</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="cardShadow bg-white p-5 rounded-[20px]">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by wallet address or name..."
                className="pl-9 bg-background border-border"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={tierFilter}
              onValueChange={(v) => {
                setTierFilter(v as Tier);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] bg-background border-border">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Tiers</SelectItem>
                <SelectItem value="Excellent">Excellent</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Fair">Fair</SelectItem>
                <SelectItem value="Poor">Poor</SelectItem>
                <SelectItem value="Very Poor">Very Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Ranked table */}
        <Card className="cardShadow bg-white p-5 rounded-[20px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-10">#</TableHead>
                <TableHead className="text-muted-foreground">Wallet Address</TableHead>
                <TableHead className="text-muted-foreground">Score</TableHead>
                <TableHead className="text-muted-foreground">Tier</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No participants found
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((buyer, idx) => {
                  const score = buyer.reputationScore ?? 100;
                  const tier = buyer.reputationTier ?? "Good";
                  const tierStyle = TIER_STYLES[tier] ?? TIER_STYLES["Good"];
                  const rank = (page - 1) * limit + idx + 1;

                  const displayName = getDisplayName(buyer);

                  return (
                    <TableRow key={buyer.id} className="border-border hover:bg-muted/50">
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {rank}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">
                          {displayName.primary}
                        </p>
                        {displayName.secondary && (
                          <p className="text-xs font-mono text-muted-foreground mt-0.5">
                            {displayName.secondary}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {/* Mini score bar */}
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(score / 200) * 100}%`,
                                  backgroundColor:
                                    tier === "Excellent"
                                      ? "#22A822"
                                      : tier === "Good"
                                      ? "#4A5BF1"
                                      : tier === "Fair"
                                      ? "#D97706"
                                      : tier === "Poor"
                                      ? "#EA580C"
                                      : "#DC2626",
                                }}
                              />
                            </div>
                            <span className="font-semibold text-sm text-foreground">
                              {score}
                            </span>
                            <span className="text-xs text-muted-foreground">/ 200</span>
                          </div>
                          {/* Score breakdown */}
                          {buyer.poolContributionScore !== undefined && (
                            <div className="flex gap-2 text-xs">
                              <span className="text-blue-600">A:{buyer.poolContributionScore || 0}</span>
                              <span className="text-green-600">K:{buyer.kycScore || 0}</span>
                              <span className="text-orange-600">S:{buyer.stakingScore || 0}</span>
                              <span className="text-red-600">C:{buyer.externalCreditScore || 0}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={tierStyle}>
                          {tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            buyer.status === "Active"
                              ? "border-success text-success bg-success/10"
                              : "border-muted-foreground text-muted-foreground"
                          }
                        >
                          {buyer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {buyer.reputationUpdatedAt ? (
                          <span className="text-foreground">
                            {formatDate(buyer.reputationUpdatedAt)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">
                            Never calculated
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        <Paginate
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          limit={pagination.limit}
          onPageChange={(p) => setPage(p)}
          showInfo={true}
          disabled={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminReputation;
