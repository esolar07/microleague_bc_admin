import { useState } from "react";
import {
  useBuyers,
  useBuyerStats,
  useCreateBuyer,
  useUpdateBuyer,
} from "@/hooks/useBuyers";
import { BuyerStatus } from "@/types/buyer.interface";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Search,
  X,
  Eye,
  User,
  Coins,
  DollarSign,
  Clock,
  Users,
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
import { Paginate } from "@/components/ui/paginate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { formatNumber, formatterNumber } from "@/lib/utils";
import {
  ConversionIcon,
  DollarIcon,
  SoldIcon,
  UserIcon,
} from "@/components/icons";

const AdminBuyers = () => {
  const initialFilters = {
    search: "",
    status: "All" as BuyerStatus | "All",
    page: 1,
    limit: 10,
    sort: "volume-desc",
  };

  const [filters, setFilters] = useState(initialFilters);
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // API calls using React Query
  const {
    data: buyersResponse,
    isLoading,
    isError,
    refetch,
  } = useBuyers(filters);

  const { data: statsResponse } = useBuyerStats();
  const createMutation = useCreateBuyer();
  const updateMutation = useUpdateBuyer();

  // Handle filter changes
  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value as BuyerStatus | "All",
      page: 1,
    }));
  };

  const handleSortChange = (value: string) => {
    setFilters((prev) => ({ ...prev, sort: value }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  // Handle buyer status toggle
  // Handle buyer status toggle
  const handleStatusToggle = (buyer: any, newStatus: BuyerStatus) => {
    updateMutation.mutate(
      {
        id: buyer._id,
        data: {
          status: newStatus,
        },
      },
      {
        onSuccess: (updatedBuyer) => {
          // Update the selectedBuyer state with the new status
          if (selectedBuyer && selectedBuyer._id === buyer._id) {
            setSelectedBuyer((prev) => ({
              ...prev,
              status: newStatus,
            }));
          }
          toast.success(`Buyer status updated to ${newStatus}`);
        },
        onError: (error) => {
          toast.error(
            error.response?.data?.message || "Failed to update status",
          );
        },
      },
    );
  };

  // Open buyer details dialog
  const handleViewBuyer = (buyer: any) => {
    setSelectedBuyer(buyer);
    setIsDialogOpen(true);
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "All" ||
    filters.sort !== "volume-desc";

  // Create dummy buyer
  const handleCreateDummyBuyer = () => {
    createMutation.mutate({
      walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      tokensPurchased: Math.floor(Math.random() * 300000) + 50000,
      amountSpent: Math.floor(Math.random() * 15000) + 5000,
      claimed: Math.floor(Math.random() * 100000),
      unclaimed: Math.floor(Math.random() * 200000),
      referrals: Math.floor(Math.random() * 10),
      joinDate: new Date(
        Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
      ).toISOString(),
      status: Math.random() > 0.2 ? BuyerStatus.ACTIVE : BuyerStatus.INACTIVE,
    });
  };

  // Extract data with proper fallbacks
  const stats = statsResponse?.data?.data?.data || {
    totalBuyers: 0,
    activeBuyers: 0,
    totalVolume: 0,
    totalTokensPurchased: 0,
    totalClaimed: 0,
    totalUnclaimed: 0,
    totalReferrals: 0,
    avgPurchase: 0,
  };

  const buyers = buyersResponse?.data?.data?.data || [];
  const pagination = buyersResponse?.data?.data?.pagination || {
    totalCount: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time ago for last activity
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  if (isError) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive text-lg">Failed to load buyers</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div className="">
            <h1 className="text-[22px] font-bold text-foreground mb-1">
              Buyers Management
            </h1>
            <p className="text-muted-foreground text-sm">
              View and manage all presale participants
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="cardShadow bg-white p-5 rounded-[20px] hover:border-primary/30 transition-all flex items-center justify-between gap-1">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Buyers</p>
              <p className="text-2xl font-semibold text-primary">
                {stats.totalBuyers}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Total registered buyers
              </p>
            </div>
            <DollarIcon />
          </Card>

          <Card className="cardShadow bg-white p-5 rounded-[20px] hover:border-primary/30 transition-all flex items-center justify-between gap-1">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Unclaimed Tokens
              </p>
              <p className="text-3xl font-bold text-primary">
                {formatNumber(stats.totalUnclaimed)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Claimed: {formatNumber(stats.totalClaimed)}
              </p>
            </div>
            <UserIcon />
          </Card>
          <Card className="cardShadow bg-white p-5 rounded-[20px] hover:border-primary/30 transition-all flex items-center justify-between gap-1">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Volume</p>
              <p className="text-3xl font-bold text-success">
                {formatNumber(stats.totalVolume)}
              </p>
              <p className="text-xs text-success mt-1">
                {formatNumber(stats.totalTokensPurchased)} tokens
              </p>
            </div>
            <SoldIcon />
          </Card>
          <Card className="cardShadow bg-white p-5 rounded-[20px] hover:border-primary/30 transition-all flex items-center justify-between gap-1">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Avg Purchase</p>
              <p className="text-3xl font-bold text-black">
                {formatNumber(stats.avgPurchase)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">per buyer</p>
            </div>
            <ConversionIcon />
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
                  placeholder="Search by wallet address..."
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
                  <SelectItem value={BuyerStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={BuyerStatus.INACTIVE}>Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.sort} onValueChange={handleSortChange}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volume-desc">Highest Volume</SelectItem>
                  <SelectItem value="volume-asc">Lowest Volume</SelectItem>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Buyers Table */}
        <Card className="cardShadow bg-white p-5 rounded-[20px] overflow-hidden">
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
                <TableHead className="text-muted-foreground">Claimed</TableHead>
                <TableHead className="text-muted-foreground">
                  Unclaimed
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Referrals
                </TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading buyers...
                  </TableCell>
                </TableRow>
              ) : buyers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No buyers found
                  </TableCell>
                </TableRow>
              ) : (
                buyers.map((buyer) => (
                  <TableRow
                    key={buyer.id}
                    className="border-border hover:bg-muted/50"
                  >
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm text-foreground">
                          {buyer.walletAddress.slice(0, 10)}...
                          {buyer.walletAddress.slice(-8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatDate(buyer.joinDate)}
                          {buyer.lastActivity &&
                            ` • ${formatTimeAgo(buyer.lastActivity)}`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {formatterNumber(buyer.tokensPurchased)}
                    </TableCell>
                    <TableCell className="text-success">
                      {formatNumber(buyer.amountSpent)}
                    </TableCell>
                    <TableCell className="text-foreground ">
                      {formatterNumber(buyer.claimed)}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {formatterNumber(buyer.unclaimed)}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {buyer.referrals||0}
                    </TableCell>
                  
                   
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border hover:border-primary/50"
                            onClick={() => handleViewBuyer(buyer)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-card border-border">
                          <DialogHeader>
                            <DialogTitle className="text-foreground flex items-center gap-2">
                              <User className="w-5 h-5" />
                              Buyer Details -{" "}
                              {selectedBuyer?.walletAddress?.slice(0, 10)}...
                              {selectedBuyer?.walletAddress?.slice(-8)}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                              View and manage buyer information
                            </DialogDescription>
                          </DialogHeader>

                          {selectedBuyer && (
                            <div className="space-y-6">
                              {/* Wallet Address */}
                              <div className="space-y-2">
                                <Label className="text-muted-foreground">
                                  Wallet Address
                                </Label>
                                <div className="flex items-center gap-2 p-3 bg-background border border-border rounded-lg">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary" />
                                  </div>
                                  <p className="font-mono text-sm text-foreground">
                                    {selectedBuyer.walletAddress}
                                  </p>
                                </div>
                              </div>

                              {/* Stats Grid */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 p-3 bg-background border border-border rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-success" />
                                    <Label className="text-muted-foreground">
                                      Tokens Purchased
                                    </Label>
                                  </div>
                                  <p className="text-lg font-semibold text-foreground">
                                    {formatterNumber(
                                      selectedBuyer.tokensPurchased,
                                    )}
                                  </p>
                                </div>
                                <div className="space-y-1 p-3 bg-background border border-border rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-success" />
                                    <Label className="text-muted-foreground">
                                      Amount Spent
                                    </Label>
                                  </div>
                                  <p className="text-lg font-semibold text-success">
                                    {formatNumber(selectedBuyer.amountSpent)}
                                  </p>
                                </div>
                                <div className="space-y-1 p-3 bg-background border border-border rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-success" />
                                    <Label className="text-muted-foreground">
                                      Claimed Tokens
                                    </Label>
                                  </div>
                                  <p className="text-lg font-semibold text-success">
                                    {formatterNumber(selectedBuyer.claimed)}
                                  </p>
                                </div>
                                <div className="space-y-1 p-3 bg-background border border-border rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-accent" />
                                    <Label className="text-muted-foreground">
                                      Unclaimed Tokens
                                    </Label>
                                  </div>
                                  <p className="text-lg font-semibold text-accent">
                                    {formatterNumber(selectedBuyer.unclaimed)}
                                  </p>
                                </div>
                              </div>

                              {/* Referrals and Dates */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 p-3 bg-background border border-border rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    <Label className="text-muted-foreground">
                                      Referrals
                                    </Label>
                                  </div>
                                  <p className="text-lg font-semibold text-foreground">
                                    {selectedBuyer.referrals}
                                  </p>
                                </div>
                                <div className="space-y-1 p-3 bg-background border border-border rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <Label className="text-muted-foreground">
                                      Joined Date
                                    </Label>
                                  </div>
                                  <p className="text-sm text-foreground">
                                    {formatDate(selectedBuyer.joinDate)}
                                  </p>
                                </div>
                              </div>

                              {/* Status Toggle */}
                              <div className="space-y-3 p-4 bg-background border border-border rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <Label className="text-foreground">
                                      Account Status
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedBuyer.status ===
                                      BuyerStatus.ACTIVE
                                        ? "This buyer is currently active"
                                        : "This buyer is currently inactive"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge
                                      variant="outline"
                                      className={
                                        selectedBuyer.status ===
                                        BuyerStatus.ACTIVE
                                          ? "border-success text-success bg-success/10"
                                          : "border-muted-foreground text-muted-foreground"
                                      }
                                    >
                                      {selectedBuyer.status}
                                    </Badge>
                                    <Switch
                                      checked={
                                        selectedBuyer.status ===
                                        BuyerStatus.ACTIVE
                                      }
                                      onCheckedChange={(checked) =>
                                        handleStatusToggle(
                                          selectedBuyer,
                                          checked
                                            ? BuyerStatus.ACTIVE
                                            : BuyerStatus.INACTIVE,
                                        )
                                      }
                                      disabled={updateMutation.isPending}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              {/* <div className="flex gap-3 pt-4">
                                <Button
                                  variant="outline"
                                  className="flex-1 border-border hover:border-primary/50"
                                  onClick={() => setIsDialogOpen(false)}
                                >
                                  Close
                                </Button>
                                <Button
                                  className="flex-1"
                                  onClick={() => {
                                    // Add any additional actions here
                                    setIsDialogOpen(false);
                                  }}
                                >
                                  Send Notification
                                </Button>
                              </div> */}
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

export default AdminBuyers;
