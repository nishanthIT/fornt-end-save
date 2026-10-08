export interface PermissionOption {
  value: string;
  label: string;
}

export const COMPANY_PERMISSION_OPTIONS: PermissionOption[] = [
  { value: "catalog.read", label: "View catalog" },
  { value: "catalog.write", label: "Edit catalog" },
  { value: "shops.manage", label: "Manage wholesale shops & prices" },
  { value: "list_items.manage", label: "Items in user lists" },
  { value: "price_reports.review", label: "Review price corrections" },
  { value: "customers.view", label: "View customers" },
  { value: "customers.manage", label: "Manage customers & subscriptions" },
  { value: "staff.manage", label: "Manage company staff" },
];
export const DEFAULT_STAFF_PERMISSIONS = ["catalog.read", "catalog.write", "shops.manage", "list_items.manage", "price_reports.review"];

// Mirrors SHOP_FEATURES in the backend (src/services/accessControl.js).
export const SHOP_FEATURE_OPTIONS: PermissionOption[] = [
  { value: "feature.lists", label: "Shopping lists" },
  { value: "feature.tasks", label: "Tasks" },
  { value: "feature.expiry", label: "Expiry tracking" },
  { value: "feature.fridges", label: "Temperature log" },
  { value: "feature.cleaning", label: "Cleaning" },
  { value: "feature.incidents", label: "Incident logs" },
  { value: "feature.age_records", label: "Age restriction records" },
  { value: "feature.waste", label: "Waste log" },
  { value: "feature.supplier_payouts", label: "Supplier payouts" },
  { value: "feature.shift_sheet", label: "Shift sheet" },
];
export const SHOP_ACCESS_LEVELS = [
  { level: "read", label: "Read" },
  { level: "write", label: "Write" },
  { level: "edit", label: "Edit" },
] as const;
export type ShopAccessLevel = (typeof SHOP_ACCESS_LEVELS)[number]["level"];

// Read is the bare feature key; write/edit are suffixed (feature.lists.write).
export const shopAccessKey = (feature: string, level: ShopAccessLevel) =>
  level === "read" ? feature : `${feature}.${level}`;

export const ALL_SHOP_PERMISSIONS = SHOP_FEATURE_OPTIONS.flatMap((o) =>
  SHOP_ACCESS_LEVELS.map((l) => shopAccessKey(o.value, l.level))
);
export const defaultShopPermissions = () => [...ALL_SHOP_PERMISSIONS];

/** Write/edit need read: switching them on adds read, switching read off clears them. */
export const setShopAccess = (value: string[], feature: string, level: ShopAccessLevel, on: boolean) => {
  const next = new Set(value);
  if (on) {
    next.add(shopAccessKey(feature, level));
    next.add(feature);
  } else if (level === "read") {
    SHOP_ACCESS_LEVELS.forEach((l) => next.delete(shopAccessKey(feature, l.level)));
  } else {
    next.delete(shopAccessKey(feature, level));
  }
  return ALL_SHOP_PERMISSIONS.filter((p) => next.has(p));
};

/** One label per tool the employee can use, e.g. "Shopping lists (Read · Write)". */
export const shopAccessSummary = (permissions: string[]) =>
  SHOP_FEATURE_OPTIONS.filter((o) => permissions.includes(o.value)).map((o) => {
    const levels = SHOP_ACCESS_LEVELS.filter((l) => permissions.includes(shopAccessKey(o.value, l.level)));
    return `${o.label} (${levels.map((l) => l.label).join(" · ")})`;
  });

const LABELS = new Map([...COMPANY_PERMISSION_OPTIONS, ...SHOP_FEATURE_OPTIONS].map((o) => [o.value, o.label]));
export const permissionLabel = (value: string) => LABELS.get(value) ?? value;
