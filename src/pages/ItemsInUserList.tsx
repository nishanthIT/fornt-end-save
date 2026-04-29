import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, PencilLine, RefreshCw, ScanLine, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OptimizedScanner } from '@/components/OptimizedScanner';
import { getImageUrl } from '@/utils/imageUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  adminListItemsService,
  ListItemsFilterOption,
  ListItemSummary,
} from '@/services/adminListItemsService';

type SortBy = 'itemName' | 'itemId' | 'caseBarcode' | 'listCount' | 'lastUpdated';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;
const ALL_FILTER_VALUE = 'all';
const UNKNOWN_SHOP_VALUE = '__UNKNOWN_SHOP__';
const UNKNOWN_SHOP_LABEL = 'Unknown Shop';

const ItemsInUserList = () => {
  const [items, setItems] = useState<ListItemSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [missingCaseBarcodeOnly, setMissingCaseBarcodeOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('lastUpdated');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedShopId, setSelectedShopId] = useState(ALL_FILTER_VALUE);
  const [selectedAisle, setSelectedAisle] = useState(ALL_FILTER_VALUE);
  const [shopOptions, setShopOptions] = useState<ListItemsFilterOption[]>([]);
  const [aisleOptions, setAisleOptions] = useState<ListItemsFilterOption[]>([]);
  const [allShopsOptions, setAllShopsOptions] = useState<ListItemsFilterOption[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItemSummary | null>(null);
  const [caseBarcodeInput, setCaseBarcodeInput] = useState('');
  const [searchScannerOpen, setSearchScannerOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await adminListItemsService.getListItems({
        search,
        missingCaseBarcode: missingCaseBarcodeOnly,
        shopId: selectedShopId !== ALL_FILTER_VALUE ? selectedShopId : undefined,
        aisle: selectedAisle !== ALL_FILTER_VALUE ? selectedAisle : undefined,
        sortBy,
        sortOrder,
        page,
        limit: ITEMS_PER_PAGE,
      });

      setItems(response.data.items);
  setShopOptions(response.data.filters?.shops || []);
  setAisleOptions(response.data.filters?.aisles || []);
      setTotalPages(response.data.pagination.totalPages || 1);
      setTotalItems(response.data.pagination.total || 0);
    } catch (error) {
      console.error('Failed to load items in user list:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [search, missingCaseBarcodeOnly, selectedShopId, selectedAisle, sortBy, sortOrder, page]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const loadAllShops = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
        const response = await fetch(`${base}/getAllshop?shopType=WHOLESALE`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        });

        if (!response.ok) return;

        const data = await response.json();
        if (!Array.isArray(data)) return;

        const normalized = data
          .map((shop: { id?: string; name?: string }) => ({
            value: String(shop?.id || '').trim(),
            label: String(shop?.name || '').trim() || UNKNOWN_SHOP_LABEL,
            count: 0,
          }))
          .filter((shop: ListItemsFilterOption) => shop.value.length > 0)
          .sort((a: ListItemsFilterOption, b: ListItemsFilterOption) => a.label.localeCompare(b.label));

        setAllShopsOptions(normalized);
      } catch {
        setAllShopsOptions([]);
      }
    };

    loadAllShops();
  }, []);

  const effectiveShopOptions = useMemo(() => {
    if (shopOptions.length > 0) return shopOptions;

    const hasUnknownInItems = items.some((item) => !String(item.shopId || '').trim());
    const merged = [...allShopsOptions];
    if (hasUnknownInItems && !merged.some((shop) => shop.value === UNKNOWN_SHOP_VALUE)) {
      merged.push({ value: UNKNOWN_SHOP_VALUE, label: UNKNOWN_SHOP_LABEL, count: 0 });
    }
    return merged;
  }, [shopOptions, allShopsOptions, items]);

  const effectiveAisleOptions = useMemo(() => {
    if (aisleOptions.length > 0) return aisleOptions;
    return [];
  }, [aisleOptions]);

  useEffect(() => {
    if (selectedShopId !== ALL_FILTER_VALUE && !effectiveShopOptions.some((shop) => shop.value === selectedShopId)) {
      setSelectedShopId(ALL_FILTER_VALUE);
      setSelectedAisle(ALL_FILTER_VALUE);
      setPage(1);
    }
  }, [effectiveShopOptions, selectedShopId]);

  useEffect(() => {
    if (selectedAisle !== ALL_FILTER_VALUE && !effectiveAisleOptions.some((aisle) => aisle.value === selectedAisle)) {
      setSelectedAisle(ALL_FILTER_VALUE);
      setPage(1);
    }
  }, [effectiveAisleOptions, selectedAisle]);

  const toggleSort = (nextSortBy: SortBy) => {
    if (sortBy === nextSortBy) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(nextSortBy);
    setSortOrder('asc');
  };

  const openEditModal = (item: ListItemSummary) => {
    setEditingItem(item);
    setCaseBarcodeInput(item.caseBarcode || '');
    setScannerOpen(false);
    setIsEditOpen(true);
  };

  const saveCaseBarcode = async () => {
    if (!editingItem?.itemId) {
      toast.error('Cannot update this item: missing item ID');
      return;
    }

    try {
      setSaving(true);
      await adminListItemsService.updateCaseBarcode(editingItem.itemId, caseBarcodeInput);
      toast.success('Case barcode updated globally');
      setIsEditOpen(false);
      setScannerOpen(false);
      await loadItems();
    } catch (error) {
      console.error('Failed to update case barcode:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update case barcode');
    } finally {
      setSaving(false);
    }
  };

  const pageSummary = useMemo(() => {
    if (!totalItems) return '0 items';
    const start = (page - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(page * ITEMS_PER_PAGE, totalItems);
    return `${start}-${end} of ${totalItems}`;
  }, [page, totalItems]);

  return (
    <div className="max-w-6xl mx-auto py-4 px-3 sm:px-4 lg:px-6">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Items in User List</h1>
        </div>
        <Button size="sm" variant="outline" onClick={loadItems} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="mb-3">
        <CardContent className="p-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name, ID, or barcode"
                  className="h-9 pl-9 pr-20"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="absolute right-1.5 top-1 h-7 px-2"
                  onClick={() => setSearchScannerOpen((prev) => !prev)}
                >
                  <ScanLine className="h-3.5 w-3.5" />
                </Button>
              </div>

              {searchScannerOpen && (
                <div className="rounded-md border p-2">
                  <OptimizedScanner
                    onScan={(result) => {
                      if (!result) return;
                      setSearchInput(result);
                      setSearch(result.trim());
                      setPage(1);
                      setSearchScannerOpen(false);
                      toast.success(`Searching for scanned barcode: ${result}`);
                    }}
                    onError={(error) => {
                      toast.error(error.message || 'Scanner error');
                    }}
                    height={190}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-md border px-2 py-2">
              <Switch
                checked={missingCaseBarcodeOnly}
                onCheckedChange={(checked) => {
                  setPage(1);
                  setMissingCaseBarcodeOnly(checked);
                }}
                id="missing-case-barcode-only"
              />
              <label htmlFor="missing-case-barcode-only" className="text-xs font-medium sm:text-sm">
                Missing case barcode only
              </label>
            </div>

            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Shop</label>
              <Select
                value={selectedShopId}
                onValueChange={(value) => {
                  setPage(1);
                  setSelectedShopId(value);
                  setSelectedAisle(ALL_FILTER_VALUE);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All shops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>All shops</SelectItem>
                  {effectiveShopOptions.map((shop) => (
                    <SelectItem key={shop.value} value={shop.value}>
                      {shop.count > 0 ? `${shop.label} (${shop.count})` : shop.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedShopId !== ALL_FILTER_VALUE && (
            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Aisle</label>
              <Select
                value={selectedAisle}
                onValueChange={(value) => {
                  setPage(1);
                  setSelectedAisle(value);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All aisles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>All aisles</SelectItem>
                  {effectiveAisleOptions.map((aisle) => (
                    <SelectItem key={aisle.value} value={aisle.value}>
                      {aisle.label} ({aisle.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">
                  <button className="inline-flex items-center gap-2" onClick={() => toggleSort('itemName')}>
                    Item
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead>
                  <button className="inline-flex items-center gap-2" onClick={() => toggleSort('caseBarcode')}>
                    Case Barcode
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead>
                  <button className="inline-flex items-center gap-2" onClick={() => toggleSort('listCount')}>
                    List Count
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <button className="inline-flex items-center gap-2" onClick={() => toggleSort('lastUpdated')}>
                    Last Updated
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-gray-500">
                    Loading items...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-gray-500">
                    No items found for current filters.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const missingCaseBarcode = !item.caseBarcode || !item.caseBarcode.trim();

                  return (
                    <TableRow key={item.dedupeKey} className={missingCaseBarcode ? 'bg-red-50/60 dark:bg-red-950/20' : ''}>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={getImageUrl(item.img || null)}
                            alt={item.itemName}
                            className="h-8 w-8 rounded object-cover border"
                            loading="lazy"
                          />
                          <div className="font-medium leading-tight truncate max-w-[260px]">{item.itemName}</div>
                        </div>
                        <div className="hidden xl:block text-xs text-gray-500 truncate max-w-[280px]">
                          Barcode: {item.barcode || 'N/A'}
                        </div>
                        <div className="hidden xl:block text-xs text-gray-500 truncate max-w-[280px]">
                          Shop: {item.shopName || 'Unknown Shop'} | Aisle: {item.aisle || 'No Aisle'}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        {missingCaseBarcode ? (
                          <Badge variant="destructive">Missing</Badge>
                        ) : (
                          <span className="font-mono text-sm">{item.caseBarcode}</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2">{item.listCount}</TableCell>
                      <TableCell className="hidden lg:table-cell py-2">
                        {item.lastUpdated ? new Date(item.lastUpdated).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <Button size="sm" className="h-7 px-2 text-xs" variant="outline" onClick={() => openEditModal(item)}>
                          <PencilLine className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            </Table>
          </div>

          <div className="space-y-1.5 p-2 md:hidden">
            {loading ? (
              <div className="rounded-md border p-3 text-center text-sm text-gray-500">Loading items...</div>
            ) : items.length === 0 ? (
              <div className="rounded-md border p-3 text-center text-sm text-gray-500">No items found for current filters.</div>
            ) : (
              items.map((item) => {
                const missingCaseBarcode = !item.caseBarcode || !item.caseBarcode.trim();

                return (
                  <div
                    key={item.dedupeKey}
                    className={`rounded-md border p-2 ${missingCaseBarcode ? 'border-red-300 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={getImageUrl(item.img || null)}
                        alt={item.itemName}
                        className="h-9 w-9 shrink-0 rounded object-cover border"
                        loading="lazy"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{item.itemName}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {missingCaseBarcode ? (
                            <span className="text-red-600 font-medium">Missing Case Barcode</span>
                          ) : (
                            <span className="font-mono">{item.caseBarcode}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {item.shopName || 'Unknown Shop'} | {item.aisle || 'No Aisle'}
                        </div>
                      </div>

                      {missingCaseBarcode ? (
                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Missing</Badge>
                      ) : (
                        <span className="text-[10px] text-gray-500">x{item.listCount}</span>
                      )}

                      <Button size="sm" className="h-7 px-2 text-xs" variant="outline" onClick={() => openEditModal(item)}>
                        <PencilLine className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{pageSummary}</div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </Button>
          <div className="text-xs sm:text-sm">Page {page} / {Math.max(totalPages, 1)}</div>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setScannerOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Case Barcode</DialogTitle>
            <DialogDescription>
              This updates the global case barcode for the item across all user lists.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{editingItem?.itemName}</div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="sm:w-auto"
                onClick={() => setScannerOpen((prev) => !prev)}
              >
                <ScanLine className="mr-2 h-4 w-4" />
                {scannerOpen ? 'Hide Scanner' : 'Scan Barcode'}
              </Button>
              <div className="text-xs text-gray-500 sm:self-center">Scan auto-fills input. You can also type manually.</div>
            </div>

            {scannerOpen && (
              <div className="rounded-md border p-2">
                <OptimizedScanner
                  onScan={(result) => {
                    if (!result) return;
                    setCaseBarcodeInput(result);
                    setScannerOpen(false);
                    toast.success(`Scanned and auto-filled: ${result}`);
                  }}
                  onError={(error) => {
                    toast.error(error.message || 'Scanner error');
                  }}
                  height={220}
                />
              </div>
            )}

            <Input
              value={caseBarcodeInput}
              onChange={(e) => setCaseBarcodeInput(e.target.value)}
              placeholder="Scan or enter case barcode manually"
            />
            <p className="text-xs text-gray-500">Leave empty to clear barcode.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveCaseBarcode} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemsInUserList;
