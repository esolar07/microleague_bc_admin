import { useState } from "react";
import {
  useTransactions,
  useTransactionStats,
} from "@/hooks/transaction.hooks";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  Search,
  ExternalLink,
  Copy,
  Eye,
  Calendar,
  X,
  DollarSign,
  Hash,
  User,
  FileText,
  Shield,
  ShoppingCart,
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { PresaleTxType, Transaction } from "@/types/transaction.interface";
import { formatterNumber, truncateAddress, formatDate } from "@/lib/utils";
import { Paginate } from "@/components/ui/paginate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Transactions = () => {
  const initialFilters = {
    limit: 10,
    page: 1,
    search: undefined as string | undefined,
    type: undefined as PresaleTxType | undefined,
    sortBy: "timestamp" as "timestamp" | "amount" | "usdAmount" | "tokens",
    sortOrder: "desc" as "asc" | "desc",
  };

  const [filters, setFilters] = useState(initialFilters);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // API calls using React Query
  const {
    data: transactionsResponse,
    isLoading,
    isError,
    refetch,
  } = useTransactions(filters);

  const { data: statsResponse } = useTransactionStats();

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value.trim() === "" ? undefined : value,
      page: 1,
    }));
  };

  const handleTypeChange = (value: string) => {
    const type = value === "all" ? undefined : (value as PresaleTxType);
    setFilters((prev) => ({
      ...prev,
      type,
      page: 1,
    }));
  };

  const handleSortChange = (value: string) => {
    if (value === "newest") {
      setFilters((prev) => ({
        ...prev,
        sortBy: "timestamp",
        sortOrder: "desc",
      }));
    } else if (value === "oldest") {
      setFilters((prev) => ({
        ...prev,
        sortBy: "timestamp",
        sortOrder: "asc",
      }));
    } else if (value === "highest") {
      setFilters((prev) => ({
        ...prev,
        sortBy: "usdAmount",
        sortOrder: "desc",
      }));
    } else if (value === "lowest") {
      setFilters((prev) => ({
        ...prev,
        sortBy: "usdAmount",
        sortOrder: "asc",
      }));
    }
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  // Check if transaction is from admin
  const isFromAdmin = (transaction: Transaction) => {
    return transaction.usdAmount === 0 && transaction.amount === 0;
  };

  // Check if transaction is from presale
  const isFromPresale = (transaction: Transaction) => {
    return transaction.usdAmount > 0 || transaction.amount > 0;
  };

  // Open transaction details dialog
  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // View on explorer
  const handleViewOnExplorer = (txHash: string) => {
    window.open(`https://sepolia.etherscan.io/tx/${txHash}`, "_blank");
  };

  // Format timestamp to date
  const formatTimestamp = (timestamp: number) => {
    return formatDate(new Date(timestamp * 1000));
  };

  // Get badge color for transaction type
  const getTypeBadgeColor = (type: PresaleTxType) => {
    switch (type) {
      case PresaleTxType.BLOCKCHAIN:
        return "border-blue-500 text-blue-500 bg-blue-500/10";
      case PresaleTxType.Crypto_Payment:
        return "border-green-500 text-green-500 bg-green-500/10";
      case PresaleTxType.Card_Payment:
        return "border-purple-500 text-purple-500 bg-purple-500/10";
      case PresaleTxType.Bank_Transfer:
        return "border-orange-500 text-orange-500 bg-orange-500/10";
      case PresaleTxType.WERT:
        return "border-pink-500 text-pink-500 bg-pink-500/10";
      case PresaleTxType.Other_Cryptos:
        return "border-yellow-500 text-yellow-500 bg-yellow-500/10";
      default:
        return "border-gray-500 text-gray-500 bg-gray-500/10";
    }
  };

  // Get source badge
  const getSourceBadge = (transaction: Transaction) => {
    if (isFromAdmin(transaction)) {
      return (
        <Badge
          variant="outline"
          className="border-purple-500 text-purple-500 bg-purple-500/10 text-xs gap-1"
        >
          <Shield className="w-3 h-3" />
          From Admin
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="border-blue-500 text-blue-500 bg-blue-500/10 text-xs gap-1"
      >
        <ShoppingCart className="w-3 h-3" />
        From Presale
      </Badge>
    );
  };

  // Format type for display
  const formatTypeForDisplay = (type: PresaleTxType) => {
    return type.replace(/_/g, " ");
  };

  // Extract data
  const transactions = transactionsResponse?.data?.data?.data || [];
  const pagination = {
    total: transactionsResponse?.total || 0,
    page: transactionsResponse?.page || 1,
    limit: transactionsResponse?.limit || 10,
    totalPages: transactionsResponse?.totalPages || 1,
  };

  const stats = statsResponse?.data?.data || {
    totalTransactions: 0,
    totalTokensSold: 0,
    totalUsdAmount: 0,
    averageTransactionSize: 0,
  };

  const hasActiveFilters =
    filters.search !== undefined ||
    filters.type !== undefined ||
    filters.sortBy !== "timestamp" ||
    filters.sortOrder !== "desc";

  if (isError) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive text-lg">
            Failed to load transactions
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[22px] font-bold text-foreground mb-1">
              Transaction History
            </h1>
            <p className="text-muted-foreground text-sm">
              View all your token purchases, claims, and rewards
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Transactions
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalTransactions}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Coins className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className="text-3xl font-bold text-success">
                  {formatterNumber(stats.totalTokensSold, 2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-3xl font-bold text-primary">
                  ${formatterNumber(stats.totalUsdAmount, 2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Transaction</p>
                <p className="text-3xl font-bold text-accent text-purple-500">
                  ${formatterNumber(stats.averageTransactionSize, 2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 border-border bg-card">
          <div className="space-y-2">
            <div className="flex items-center h-8 justify-between">
              <h3 className="text-sm font-medium text-foreground">Filters</h3>
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
                  placeholder="Search by address, hash, or email..."
                  className="pl-9 bg-background border-border"
                  value={filters.search || ""}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <Select
                value={filters.type || "all"}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger className="bg-background border-border capitalize">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(PresaleTxType).map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {formatTypeForDisplay(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={
                  filters.sortOrder === "desc" && filters.sortBy === "timestamp"
                    ? "newest"
                    : filters.sortOrder === "asc" &&
                      filters.sortBy === "timestamp"
                    ? "oldest"
                    : filters.sortOrder === "desc" &&
                      filters.sortBy === "usdAmount"
                    ? "highest"
                    : "lowest"
                }
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="highest">Highest Amount</SelectItem>
                  <SelectItem value="lowest">Lowest Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Transaction Table */}
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  Transaction Hash
                </TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Source</TableHead>
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Tokens</TableHead>
                <TableHead className="text-muted-foreground">
                  ETH Amount
                </TableHead>
                <TableHead className="text-muted-foreground">
                  USD Value
                </TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-3">
                      <Coins className="w-12 h-12 text-muted-foreground" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          No transactions found
                        </h3>
                        <p className="text-muted-foreground">
                          Try adjusting your filters or search criteria
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow
                    key={tx.txHash}
                    className={`border-border hover:bg-muted/50 ${
                      isFromAdmin(tx) ? "bg-purple-50 dark:bg-purple-950/10" : ""
                    }`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-mono text-sm text-foreground">
                            {truncateAddress(tx.txHash, 6, 4)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Stage {tx.stage}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getTypeBadgeColor(tx.type)} text-xs`}
                      >
                        {formatTypeForDisplay(tx.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getSourceBadge(tx)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm text-foreground">
                          {truncateAddress(tx.address, 6, 4)}
                        </p>
                        {tx.email && (
                          <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {tx.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {formatterNumber(tx.tokens, 4)}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {isFromAdmin(tx) ? (
                        <span className="text-muted-foreground italic">
                          N/A (Admin Allocation)
                        </span>
                      ) : (
                        `${tx.amount?.toFixed(6) || "0"} ETH`
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-success">
                      {isFromAdmin(tx) ? (
                        <span className="text-muted-foreground italic">
                          N/A (Admin Allocation)
                        </span>
                      ) : (
                        `$${tx.usdAmount?.toFixed(2) || "0"}`
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTimestamp(tx.timestamp)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-border hover:border-primary/50"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleViewTransaction(tx)}
                            className="cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewOnExplorer(tx.txHash)}
                            className="cursor-pointer"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on Explorer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCopy(tx.txHash)}
                            className="cursor-pointer"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Hash
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {isFromAdmin(tx) ? (
                            <DropdownMenuItem className="text-purple-600 cursor-pointer">
                              <Shield className="w-4 h-4 mr-2" />
                              From Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-blue-600 cursor-pointer">
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              From Presale
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          totalCount={pagination.total}
          limit={pagination.limit}
          onPageChange={(newPage) =>
            setFilters((prev) => ({ ...prev, page: newPage }))
          }
          showInfo={true}
          disabled={isLoading}
        />

        {/* Transaction Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Transaction Details
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {selectedTransaction &&
                  truncateAddress(selectedTransaction.txHash)}
              </DialogDescription>
            </DialogHeader>

            {selectedTransaction && (
              <div className="space-y-6">
                {/* Transaction Hash & Quick Actions */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    Transaction Hash
                  </Label>
                  <div className="flex items-center gap-2 p-3 bg-background border border-border rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Hash className="w-4 h-4 text-primary" />
                    </div>
                    <p className="font-mono text-sm text-foreground flex-1">
                      {truncateAddress(selectedTransaction.txHash, 10, 12)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(selectedTransaction.txHash)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleViewOnExplorer(selectedTransaction.txHash)
                        }
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Explorer
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Source Badge */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Source</Label>
                  {getSourceBadge(selectedTransaction)}
                </div>

                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {/* Type and Stage */}
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">
                        Transaction Type
                      </Label>
                      <div className="flex gap-2">
                        <Badge
                          variant="outline"
                          className={`${getTypeBadgeColor(
                            selectedTransaction.type
                          )} text-sm`}
                        >
                          {formatTypeForDisplay(selectedTransaction.type)}
                        </Badge>
                        <Badge variant="secondary" className="text-sm">
                          Stage {selectedTransaction.stage}
                        </Badge>
                      </div>
                    </div>

                    {/* Amount Details */}
                    <div className="space-y-1 p-3 bg-background border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="w-4 h-4 text-green-500" />
                        <Label className="text-muted-foreground">
                          Amount Details
                        </Label>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Tokens
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatterNumber(selectedTransaction.tokens, 4)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            ETH Amount
                          </span>
                          <span className="text-foreground">
                            {isFromAdmin(selectedTransaction) ? (
                              <span className="text-muted-foreground italic">
                                N/A (Admin Allocation)
                              </span>
                            ) : (
                              `${selectedTransaction.amount?.toFixed(6) || "0"} ETH`
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            USD Value
                          </span>
                          <span className="text-success font-semibold">
                            {isFromAdmin(selectedTransaction) ? (
                              <span className="text-muted-foreground italic">
                                N/A (Admin Allocation)
                              </span>
                            ) : (
                              `$${selectedTransaction.usdAmount?.toFixed(2) || "0"}`
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Timestamps */}
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">
                        Timestamps
                      </Label>
                      <div className="space-y-1 p-3 bg-background border border-border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Blockchain Time
                          </span>
                        </div>
                        <p className="text-sm text-foreground">
                          {formatTimestamp(selectedTransaction.timestamp)}
                        </p>
                        {selectedTransaction.createdAt && (
                          <>
                            <Separator className="my-2" />
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Record Created
                              </span>
                            </div>
                            <p className="text-sm text-foreground">
                              {formatDate(
                                new Date(selectedTransaction.createdAt)
                              )}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">
                        User Information
                      </Label>
                      <div className="p-3 bg-background border border-border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <p className="font-mono text-sm text-foreground">
                            {truncateAddress(
                              selectedTransaction.address,
                              8,
                              10
                            )}
                          </p>
                        </div>
                        {selectedTransaction.email && (
                          <p className="text-sm text-muted-foreground">
                            {selectedTransaction.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contract & Token Addresses */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    Contract & Token Addresses
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-background border border-border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        Contract
                      </p>
                      <p className="font-mono text-sm text-foreground truncate">
                        {truncateAddress(selectedTransaction.contract, 8, 10)}
                      </p>
                    </div>
                    <div className="p-3 bg-background border border-border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        Token
                      </p>
                      <p className="font-mono text-sm text-foreground truncate">
                        {truncateAddress(
                          selectedTransaction.tokenAddress,
                          8,
                          10
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin Allocation Note */}
                {isFromAdmin(selectedTransaction) && (
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-purple-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-purple-600 mb-1">
                          Admin Allocation
                        </h4>
                        <p className="text-sm text-purple-600/80">
                          This transaction was manually allocated by an administrator. 
                          The ETH amount and USD value are not applicable as this was 
                          an off-chain allocation process.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Presale Note */}
                {isFromPresale(selectedTransaction) && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <ShoppingCart className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-600 mb-1">
                          Presale Transaction
                        </h4>
                        <p className="text-sm text-blue-600/80">
                          This transaction was processed through the presale platform. 
                          The user purchased tokens during the presale period with real funds.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Transactions;