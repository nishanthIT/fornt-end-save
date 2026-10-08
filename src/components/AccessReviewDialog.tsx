import { useEffect, useState } from "react";
import { Search, Store } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PermissionChecklist } from "@/components/PermissionChecklist";
import { API_CONFIG, getAdminUrl } from "@/config/api";
import {
  ALL_SHOP_PERMISSIONS,
  COMPANY_PERMISSION_OPTIONS,
  DEFAULT_STAFF_PERMISSIONS,
  SHOP_ACCESS_LEVELS,
  SHOP_FEATURE_OPTIONS,
  defaultShopPermissions,
  setShopAccess,
  shopAccessKey,
} from "@/config/permissions";

export type ReviewAction = "GRANT_COMPANY" | "ASSIGN_SHOP" | "NO_ACCESS";

export interface AccessReview {
  id: string;
  reason: string;
  evidence: Record<string, unknown>;
  createdAt: string;
  employee: { id: number; name: string; email: string; createdAt: string };
}

interface AssignableShop {
  id: string;
  name: string;
  address: string;
  owners: { id: number; name: string; email: string }[];
  activeEmployees: number;
  suggested: boolean;
}

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const TITLES: Record<ReviewAction, string> = {
  GRANT_COMPANY: "Grant company staff access",
  ASSIGN_SHOP: "Assign to a customer shop",
  NO_ACCESS: "Keep without access",
};

interface Props {
  review: AccessReview | null;
  action: ReviewAction | null;
  onClose: () => void;
  onResolved: () => void;
}

/** Resolves a flagged employee: pick a shop and shop access, or company permissions. */
export const AccessReviewDialog = ({ review, action, onClose, onResolved }: Props) => {
  const open = !!review && !!action;
  const [note, setNote] = useState("");
  const [companyPermissions, setCompanyPermissions] = useState<string[]>(DEFAULT_STAFF_PERMISSIONS);
  const [search, setSearch] = useState("");
  const [shops, setShops] = useState<AssignableShop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopPermissions, setShopPermissions] = useState<string[]>(defaultShopPermissions());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNote("");
    setCompanyPermissions(DEFAULT_STAFF_PERMISSIONS);
    setSearch("");
    setShopId(null);
    setShopPermissions(defaultShopPermissions());
  }, [open, review?.id, action]);

  useEffect(() => {
    if (!open || action !== "ASSIGN_SHOP") return;
    const handle = setTimeout(async () => {
      setShopsLoading(true);
      try {
        const params = new URLSearchParams({ reviewId: review!.id, ...(search.trim() ? { search: search.trim() } : {}) });
        const res = await fetch(`${getAdminUrl(API_CONFIG.ADMIN.ASSIGNABLE_SHOPS)}?${params}`, { headers: authHeaders() });
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.success) throw new Error(body?.error || "Could not load shops");
        setShops(body.data);
        const suggested = body.data.find((s: AssignableShop) => s.suggested);
        if (suggested) setShopId((current) => current ?? suggested.id);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load shops");
        setShops([]);
      } finally {
        setShopsLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [open, action, review, search]);

  const allShopAccess = ALL_SHOP_PERMISSIONS.every((p) => shopPermissions.includes(p));

  const submit = async () => {
    if (!review || !action) return;
    if (!note.trim()) {
      toast.error("Add a note explaining who confirmed this and how");
      return;
    }
    if (action === "ASSIGN_SHOP" && !shopId) {
      toast.error("Choose the shop this person works at");
      return;
    }
    setSaving(true);
    try {
      if (action === "GRANT_COMPANY") {
        const grant = await fetch(getAdminUrl(API_CONFIG.ADMIN.STAFF_GRANT), {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ employeeId: review.employee.id, permissions: companyPermissions }),
        });
        const grantBody = await grant.json().catch(() => null);
        if (!grant.ok) throw new Error(grantBody?.error || "Could not grant company access");
      }
      const res = await fetch(getAdminUrl(API_CONFIG.ADMIN.RESOLVE_ACCESS_REVIEW(review.id)), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          action,
          note: note.trim(),
          ...(action === "ASSIGN_SHOP" && { shopId, permissions: shopPermissions }),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not resolve review");
      toast.success("Review resolved");
      onResolved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{action ? TITLES[action] : ""}</DialogTitle>
        </DialogHeader>
        {review && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="font-medium">{review.employee.name}</div>
              <div className="text-muted-foreground">{review.employee.email}</div>
            </div>

            {action === "GRANT_COMPANY" && (
              <PermissionChecklist
                title="Company permissions"
                options={COMPANY_PERMISSION_OPTIONS}
                value={companyPermissions}
                onChange={setCompanyPermissions}
              />
            )}

            {action === "ASSIGN_SHOP" && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search shop, owner name or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {shopsLoading && <p className="text-sm text-muted-foreground">Loading shops…</p>}
                  {!shopsLoading && shops.length === 0 && (
                    <p className="text-sm text-muted-foreground">No customer shops match.</p>
                  )}
                  {shops.map((shop) => (
                    <button
                      key={shop.id}
                      type="button"
                      onClick={() => setShopId(shop.id)}
                      className={`w-full text-left rounded-md border p-3 transition-colors ${
                        shopId === shop.id ? "border-blue-600 bg-blue-50 dark:bg-blue-950" : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        <span className="font-medium">{shop.name}</span>
                        {shop.suggested && <Badge variant="secondary">Created by this owner</Badge>}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {shop.activeEmployees} active employee{shop.activeEmployees === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Owner: {shop.owners.map((o) => `${o.name} (${o.email})`).join(", ")}
                        {shop.address ? ` · ${shop.address}` : ""}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Shop employee access</label>
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => setShopPermissions(allShopAccess ? [] : defaultShopPermissions())}
                    >
                      {allShopAccess ? "Clear all" : "Full access"}
                    </button>
                  </div>
                  <div className="rounded-md border divide-y">
                    <div className="grid grid-cols-[1fr_repeat(3,4rem)] px-3 py-2 text-xs font-medium text-muted-foreground">
                      <span>Tool</span>
                      {SHOP_ACCESS_LEVELS.map((l) => (
                        <span key={l.level} className="text-center">{l.label}</span>
                      ))}
                    </div>
                    {SHOP_FEATURE_OPTIONS.map((tool) => (
                      <div key={tool.value} className="grid grid-cols-[1fr_repeat(3,4rem)] items-center px-3 py-2 text-sm">
                        <span>{tool.label}</span>
                        {SHOP_ACCESS_LEVELS.map((l) => (
                          <span key={l.level} className="flex justify-center">
                            <Checkbox
                              aria-label={`${tool.label}: ${l.label}`}
                              checked={shopPermissions.includes(shopAccessKey(tool.value, l.level))}
                              onCheckedChange={(checked) =>
                                setShopPermissions((prev) => setShopAccess(prev, tool.value, l.level, checked === true))
                              }
                            />
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Read = see records, Write = add new ones, Edit = change or delete. The shop owner can change this
                  later from the app. No company access is granted.
                </p>
              </>
            )}

            {action === "NO_ACCESS" && (
              <p className="text-sm text-muted-foreground">
                The account and its lists are kept, but it stays without company or shop access.
              </p>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Resolution note</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Who confirmed this and how (e.g. called the shop owner on 8 Oct)"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={saving}>
                {saving ? "Saving…" : "Confirm"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
