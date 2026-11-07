import { FormEvent, useEffect, useState } from "react";
import { AdminUserInput, apiRequest, ApiService, ApiUser } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Moon, Pencil, Plus, Shield, Sun, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateCategory } from "@/i18n/labels";

type AccountSection = "user" | "provider" | "admin" | "all";

const emptyAccount: AdminUserInput = {
  email: "",
  name: "",
  city: "",
  phone: "",
  role: "user",
  password: "",
};

export default function Admin() {
  const { role, profile } = useAuth();
  const { t } = useTranslation();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [accountForm, setAccountForm] = useState<AdminUserInput>(emptyAccount);
  const [savingAccount, setSavingAccount] = useState(false);
  const [deletingUser, setDeletingUser] = useState<ApiUser | null>(null);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("localfind_admin_theme") === "dark",
  );

  useEffect(() => {
    if (role === "admin") fetchData();
  }, [role]);

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [usersData, servicesData] = await Promise.all([
        apiRequest<ApiUser[]>("/admin/users"),
        apiRequest<ApiService[]>("/admin/services"),
      ]);
      setUsers(usersData);
      setServices(servicesData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.unableToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setAccountForm(emptyAccount);
    setDialogOpen(true);
  };

  const openEditDialog = (user: ApiUser) => {
    setEditingUser(user);
    setAccountForm({
      email: user.email,
      name: user.name,
      city: user.city,
      phone: user.phone,
      role: user.role,
      password: "",
    });
    setDialogOpen(true);
  };

  const saveAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingAccount(true);
    const body: AdminUserInput = { ...accountForm };
    body.phone = body.phone?.trim() || null;
    if (!body.password) delete body.password;
    try {
      if (editingUser) {
        await apiRequest<ApiUser>(`/admin/users/${editingUser.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(t("admin.accountUpdated"));
      } else {
        await apiRequest<ApiUser>("/admin/users", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(t("admin.accountCreated"));
      }
      setDialogOpen(false);
      await fetchData(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.unableToSave"));
    } finally {
      setSavingAccount(false);
    }
  };

  const deleteUser = async () => {
    if (!deletingUser) return;
    try {
      await apiRequest(`/admin/users/${deletingUser.id}`, { method: "DELETE" });
      toast.success(t("admin.accountRemoved"));
      setDeletingUser(null);
      await fetchData(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.unableToRemove"));
      setDeletingUser(null);
    }
  };

  const toggleTheme = () => {
    const nextDarkMode = !darkMode;
    setDarkMode(nextDarkMode);
    localStorage.setItem("localfind_admin_theme", nextDarkMode ? "dark" : "light");
  };

  const deleteService = async (id: string) => {
    try {
      await apiRequest(`/admin/services/${id}`, { method: "DELETE" });
      toast.success(t("admin.serviceDeleted"));
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.unableToDeleteService"));
    }
  };

  if (role !== "admin") {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t("admin.accessDenied")}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-20 ${darkMode ? "dark bg-background text-foreground" : ""}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`${darkMode ? "dark" : ""} min-h-full bg-background text-foreground`}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
          </div>
          <Button type="button" variant="outline" onClick={toggleTheme}>
            {darkMode ? <Sun /> : <Moon />}
            {t(darkMode ? "admin.switchToLight" : "admin.switchToDark")}
          </Button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "admin.customers", value: users.filter((user) => user.role === "user").length },
            { label: "admin.providers", value: users.filter((user) => user.role === "provider").length },
            { label: "admin.admins", value: users.filter((user) => user.role === "admin").length },
            { label: "admin.serviceListings", value: services.length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{t(stat.label)}</p>
              <p className="mt-1 text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="user">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="user">{t("admin.customers")}</TabsTrigger>
              <TabsTrigger value="provider">{t("admin.providers")}</TabsTrigger>
              <TabsTrigger value="admin">{t("admin.admins")}</TabsTrigger>
              <TabsTrigger value="all">{t("admin.allAccounts")}</TabsTrigger>
              <TabsTrigger value="services">{t("admin.services")}</TabsTrigger>
            </TabsList>
            <Button onClick={openCreateDialog}>
              <Plus /> {t("admin.addAccount")}
            </Button>
          </div>

          {(["user", "provider", "admin", "all"] as AccountSection[]).map((section) => {
            const sectionUsers = section === "all" ? users : users.filter((user) => user.role === section);
            return (
              <TabsContent key={section} value={section} className="mt-4">
                <AccountTable
                  users={sectionUsers}
                  currentUserId={profile?.id}
                  onEdit={openEditDialog}
                  onDelete={setDeletingUser}
                />
              </TabsContent>
            );
          })}

          <TabsContent value="services" className="mt-4">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.serviceTitle")}</TableHead>
                    <TableHead>{t("addService.category")}</TableHead>
                    <TableHead>{t("admin.city")}</TableHead>
                    <TableHead>{t("admin.provider")}</TableHead>
                    <TableHead className="w-20">{t("admin.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.title}</TableCell>
                      <TableCell>{translateCategory(service.category, t)}</TableCell>
                      <TableCell>{service.city}</TableCell>
                      <TableCell>{service.profiles?.name}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteService(service.id)} aria-label={t("admin.deleteService", { title: service.title })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {services.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">{t("admin.noListings")}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={darkMode ? "dark text-foreground" : "text-foreground"}>
          <DialogHeader>
            <DialogTitle>{editingUser ? t("admin.editAccount") : t("admin.createAccount")}</DialogTitle>
            <DialogDescription>
              {editingUser ? t("admin.editAccountDescription") : t("admin.createAccountDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveAccount} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account-name">{t("admin.fullName")}</Label>
                <Input id="account-name" required maxLength={200} value={accountForm.name} onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-email">{t("admin.email")}</Label>
                <Input id="account-email" type="email" required value={accountForm.email} onChange={(event) => setAccountForm({ ...accountForm, email: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-city">{t("admin.city")}</Label>
                <Input id="account-city" required maxLength={200} value={accountForm.city} onChange={(event) => setAccountForm({ ...accountForm, city: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-phone">{t("admin.phone")}</Label>
                <Input id="account-phone" type="tel" maxLength={50} value={accountForm.phone ?? ""} onChange={(event) => setAccountForm({ ...accountForm, phone: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.accountType")}</Label>
                <Select
                  value={accountForm.role}
                  onValueChange={(value) => {
                    if (value === "user" || value === "provider" || value === "admin") {
                      setAccountForm({ ...accountForm, role: value });
                    }
                  }}
                  disabled={editingUser?.id === profile?.id}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className={darkMode ? "dark" : undefined}>
                    <SelectItem value="user">{t("admin.customer")}</SelectItem>
                    <SelectItem value="provider">{t("admin.provider")}</SelectItem>
                    <SelectItem value="admin">{t("admin.administrator")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-password">{editingUser ? t("admin.newPassword") : t("admin.initialPassword")}</Label>
                <Input
                  id="account-password"
                  type="password"
                  required={!editingUser}
                  minLength={6}
                  maxLength={128}
                  autoComplete="new-password"
                  value={accountForm.password}
                  onChange={(event) => setAccountForm({ ...accountForm, password: event.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={savingAccount}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={savingAccount}>
                {savingAccount && <Loader2 className="animate-spin" />}
                {editingUser ? t("admin.saveChanges") : t("admin.createAccount")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingUser)} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent className={darkMode ? "dark" : undefined}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.removeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.removeDescription", { name: deletingUser?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={deleteUser}>
              {t("admin.removeAccount")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AccountTable({
  users,
  currentUserId,
  onEdit,
  onDelete,
}: {
  users: ApiUser[];
  currentUserId?: string;
  onEdit: (user: ApiUser) => void;
  onDelete: (user: ApiUser) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.name")}</TableHead>
            <TableHead>{t("admin.email")}</TableHead>
            <TableHead>{t("admin.city")}</TableHead>
            <TableHead>{t("admin.phone")}</TableHead>
            <TableHead>{t("admin.role")}</TableHead>
            <TableHead className="w-24">{t("admin.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.city}</TableCell>
              <TableCell>{user.phone || "—"}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {user.role === "user" ? t("admin.customer") : user.role === "provider" ? t("admin.provider") : t("admin.administrator")}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(user)} aria-label={t("admin.editUser", { name: user.name })}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(user)}
                    disabled={user.id === currentUserId}
                    aria-label={t("admin.removeUser", { name: user.name })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">{t("admin.noAccounts")}</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
