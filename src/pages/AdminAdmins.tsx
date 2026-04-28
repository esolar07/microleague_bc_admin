import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserPlus, Trash2, ShieldCheck, Shield, Users } from "lucide-react";
import { useAllAdmins, useCreateAdmin, useDeleteAdmin } from "@/hooks/useAdmins";
import { useAdmin } from "@/hooks/useAdmin";
import { IAdminListItem } from "@/types/admin.interface";

const AdminAdmins = () => {
  const { isSuperAdmin } = useAdmin();
  const { data: admins, isLoading, isError, refetch } = useAllAdmins();

  const createMutation = useCreateAdmin();
  const deleteMutation = useDeleteAdmin();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    address: "",
    superAdmin: false,
  });

  const handleCreateSubmit = () => {
    if (!form.firstName || !form.lastName || !form.address) return;
    createMutation.mutate(form, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setForm({ firstName: "", lastName: "", address: "", superAdmin: false });
      },
    });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 10)}...${addr.slice(-8)}`;

  if (isError) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive text-lg">Failed to load admins</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  const adminList: IAdminListItem[] = Array.isArray(admins) ? admins : [];
  const totalAdmins = adminList.length;
  const superAdminCount = adminList.filter((a) => a.superAdmin).length;

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[22px] font-bold text-foreground mb-1">
              Admins Management
            </h1>
            <p className="text-muted-foreground text-sm">
              View all admins and manage access
            </p>
          </div>
          {isSuperAdmin && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Create New Admin
                  </DialogTitle>
                  <DialogDescription>
                    Add a new admin by providing their wallet address and name.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>First Name</Label>
                      <Input
                        placeholder="John"
                        value={form.firstName}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, firstName: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Last Name</Label>
                      <Input
                        placeholder="Doe"
                        value={form.lastName}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, lastName: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Wallet Address</Label>
                    <Input
                      placeholder="0x..."
                      value={form.address}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, address: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                    <div>
                      <Label className="text-foreground">Super Admin</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Grant full privileges including creating admins
                      </p>
                    </div>
                    <Switch
                      checked={form.superAdmin}
                      onCheckedChange={(val) =>
                        setForm((f) => ({ ...f, superAdmin: val }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateSubmit}
                    disabled={
                      createMutation.isPending ||
                      !form.firstName ||
                      !form.lastName ||
                      !form.address
                    }
                  >
                    {createMutation.isPending ? "Creating..." : "Create Admin"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="cardShadow bg-white p-5 rounded-[20px] flex items-center justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Admins</p>
              <p className="text-2xl font-semibold text-primary">{totalAdmins}</p>
              <p className="text-sm text-muted-foreground mt-1">
                All registered admins
              </p>
            </div>
            <Users className="w-10 h-10 text-primary/30" />
          </Card>
          <Card className="cardShadow bg-white p-5 rounded-[20px] flex items-center justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Super Admins</p>
              <p className="text-2xl font-semibold text-primary">
                {superAdminCount}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                With full privileges
              </p>
            </div>
            <ShieldCheck className="w-10 h-10 text-primary/30" />
          </Card>
        </div>

        {/* Table */}
        <Card className="cardShadow bg-white p-5 rounded-[20px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">
                  Wallet Address
                </TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">
                  Created At
                </TableHead>
                {isSuperAdmin && (
                  <TableHead className="text-muted-foreground">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading admins...
                  </TableCell>
                </TableRow>
              ) : adminList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No admins found
                  </TableCell>
                </TableRow>
              ) : (
                adminList.map((admin) => (
                  <TableRow
                    key={admin.id}
                    className="border-border hover:bg-muted/50"
                  >
                    <TableCell className="font-medium text-foreground">
                      {admin.firstName} {admin.lastName}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-foreground">
                        {truncateAddress(admin.address)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {admin.superAdmin ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3" />
                          Super Admin
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 w-fit"
                        >
                          <Shield className="w-3 h-3" />
                          Admin
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(admin.createdAt)}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Admin</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove{" "}
                                <span className="font-semibold">
                                  {admin.firstName} {admin.lastName}
                                </span>{" "}
                                as an admin? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => deleteMutation.mutate(admin.id)}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAdmins;
