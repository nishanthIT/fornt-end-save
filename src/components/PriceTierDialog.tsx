import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TierRow {
  quantity: string;
  price: string;
}

interface PriceTierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  productId: string;
  productTitle: string;
  basePrice: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// 456 -> 4.56 (pence-style price entry, same as the rest of the admin panel)
const formatPriceInput = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return (parseInt(digits, 10) / 100).toFixed(2);
};

/**
 * Quantity-based pricing for a product at a shop, e.g. 1 × £1.50 (base price)
 * plus tiers like 7 × £9.00. Tiers are shown to shoppers when scanning.
 */
export const PriceTierDialog = ({
  open,
  onOpenChange,
  shopId,
  productId,
  productTitle,
  basePrice,
}: PriceTierDialogProps) => {
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const authHeaders = () => {
    const authToken = localStorage.getItem("auth_token");
    return {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    };
  };

  const loadTiers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/shop/${shopId}/product/${productId}/price-tiers`,
        { headers: authHeaders(), credentials: "include" }
      );
      const data = await response.json();
      if (response.ok) {
        setTiers(
          (data.tiers || []).map((t: { quantity: number; price: number }) => ({
            quantity: String(t.quantity),
            price: t.price.toFixed(2),
          }))
        );
      } else {
        toast.error(data.error || "Failed to load quantity prices");
      }
    } catch {
      toast.error("Failed to load quantity prices");
    } finally {
      setLoading(false);
    }
  }, [shopId, productId]);

  useEffect(() => {
    if (open) loadTiers();
  }, [open, loadTiers]);

  const updateTier = (index: number, patch: Partial<TierRow>) => {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const handleSave = async () => {
    const payload = [];
    for (const tier of tiers) {
      const quantity = parseInt(tier.quantity, 10);
      const price = parseFloat(tier.price);
      if (!Number.isInteger(quantity) || quantity < 2) {
        toast.error("Quantity must be a whole number of 2 or more");
        return;
      }
      if (isNaN(price) || price <= 0) {
        toast.error("Please enter a valid price for every tier");
        return;
      }
      if (payload.some((p) => p.quantity === quantity)) {
        toast.error(`Duplicate tier for quantity ${quantity}`);
        return;
      }
      payload.push({ quantity, price });
    }

    setSaving(true);
    try {
      const response = await fetch(
        `${API_BASE}/shop/${shopId}/product/${productId}/price-tiers`,
        {
          method: "PUT",
          headers: authHeaders(),
          credentials: "include",
          body: JSON.stringify({ tiers: payload }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success("Quantity prices saved");
        onOpenChange(false);
      } else {
        toast.error(data.error || "Failed to save quantity prices");
      }
    } catch {
      toast.error("Failed to save quantity prices");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Quantity Pricing</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-gray-600 line-clamp-2">{productTitle}</p>

          {/* Base price (single unit) — read only, managed via the normal price field */}
          <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm">
            <span className="font-semibold">1 ×</span>
            <span className="flex-1">Single price</span>
            <span className="font-semibold">£{basePrice.toFixed(2)}</span>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 py-2">Loading…</p>
          ) : (
            tiers.map((tier, index) => {
              const qty = parseInt(tier.quantity, 10);
              const price = parseFloat(tier.price);
              const unit =
                Number.isInteger(qty) && qty > 0 && !isNaN(price) && price > 0
                  ? (price / qty).toFixed(2)
                  : null;
              return (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={tier.quantity}
                    onChange={(e) =>
                      updateTier(index, { quantity: e.target.value.replace(/\D/g, "") })
                    }
                    className="h-9 w-16 text-center"
                    placeholder="Qty"
                  />
                  <span className="text-sm text-gray-500">for</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={tier.price}
                      onChange={(e) => updateTier(index, { price: formatPriceInput(e.target.value) })}
                      className="h-9 pl-6"
                      placeholder="e.g. 900 = £9.00"
                    />
                  </div>
                  <span className="w-20 text-right text-xs text-gray-500">
                    {unit ? `£${unit}/each` : ""}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-red-500 hover:text-red-700"
                    onClick={() => setTiers((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setTiers((prev) => [...prev, { quantity: "", price: "" }])}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Quantity Price
          </Button>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || loading}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
