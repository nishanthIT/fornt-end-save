import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, Barcode, PencilLine, RefreshCw, ScanLine, Search, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { OptimizedScanner } from '@/components/OptimizedScanner';
import { CategorySelect } from '@/components/CategorySelect';
import { getImageUrl } from '@/utils/imageUtils';
import { API_CONFIG } from '@/config/api';
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
  ListItemSummary,
} from '@/services/adminListItemsService';

type SortBy = 'itemName' | 'itemId' | 'caseBarcode' | 'listCount' | 'lastUpdated';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

const ItemsInUserList = () => {
  const [items, setItems] = useState<ListItemSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [missingCaseBarcodeOnly, setMissingCaseBarcodeOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('lastUpdated');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItemSummary | null>(null);
  const [searchScannerOpen, setSearchScannerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const [editForm, setEditForm] = useState({
    title: '',
    barcode: '',
    caseBarcode: '',
    caseSize: '1',
    packetSize: '1',
    retailSize: '',
    rrp: '',
    category: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showCaseBarcodeScanner, setShowCaseBarcodeScanner] = useState(false);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await adminListItemsService.getListItems({
        search,
        missingCaseBarcode: missingCaseBarcodeOnly,
        sortBy,
        sortOrder,
        page,
        limit: ITEMS_PER_PAGE,
      });

      setItems(response.data.items);
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
  }, [search, missingCaseBarcodeOnly, sortBy, sortOrder, page]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const toggleSort = (nextSortBy: SortBy) => {
    if (sortBy === nextSortBy) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(nextSortBy);
    setSortOrder('asc');
  };

  const formatPriceInput = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const num = parseInt(digits, 10);
    return (num / 100).toFixed(2);
  };

  const handlePriceChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const formatted = formatPriceInput(cleanValue);
    setEditForm((prev) => ({ ...prev, rrp: formatted }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openEditModal = async (item: ListItemSummary) => {
    setEditingItem(item);
    setSelectedImage(null);
    setImagePreview(null);
    setShowBarcodeScanner(false);
    setShowCaseBarcodeScanner(false);
    setIsEditOpen(true);

    setEditForm({
      title: item.itemName || '',
      barcode: item.barcode || '',
      caseBarcode: item.caseBarcode || '',
      caseSize: '1',
      packetSize: '1',
      retailSize: '',
      rrp: '',
      category: '',
    });
    setEditImageUrl(getImageUrl(item.img || null));

    if (!item.itemId) return;

    try {
      setLoadingProduct(true);
      const authToken = localStorage.getItem('auth_token');
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/getProductById/${item.itemId}`,
        {
          headers: {
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          credentials: 'include',
        }
      );
      if (response.ok) {
        const data = await response.json();
        const product = data.product || data.data || data;
        setEditForm({
          title: product.title || item.itemName || '',
          barcode: product.barcode || item.barcode || '',
          caseBarcode: product.caseBarcode || item.caseBarcode || '',
          caseSize: product.caseSize || '1',
          packetSize: product.packetSize || '1',
          retailSize: product.retailSize || '',
          rrp: product.rrp ? String(product.rrp) : '',
          category: product.category || '',
        });
        if (product.img) {
          setEditImageUrl(getImageUrl(product.img));
        }
      }
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    } finally {
      setLoadingProduct(false);
    }
  };

  const saveProduct = async () => {
    if (!editingItem?.itemId) {
      toast.error('Cannot update this item: missing item ID');
      return;
    }

    if (!editForm.title.trim()) {
      toast.error('Product name is required');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('title', editForm.title.toUpperCase());
      formData.append('barcode', editForm.barcode);
      formData.append('caseBarcode', editForm.caseBarcode);
      formData.append('caseSize', editForm.caseSize);
      formData.append('packetSize', editForm.packetSize);
      formData.append('retailSize', editForm.retailSize);
      formData.append('rrp', editForm.rrp);
      formData.append('category', editForm.category);

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const authToken = localStorage.getItem('auth_token');
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/editProduct/${editingItem.itemId}`,
        {
          method: 'PUT',
          body: formData,
          headers: {
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update product');
      }

      toast.success('Product updated successfully!');
      setIsEditOpen(false);
      setSelectedImage(null);
      setImagePreview(null);
      await loadItems();
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
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
          if (!open) {
            setShowBarcodeScanner(false);
            setShowCaseBarcodeScanner(false);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details. Changes apply globally across all user lists.
            </DialogDescription>
          </DialogHeader>

          {loadingProduct ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Loading product details...</span>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Product Name *</label>
                <Input
                  placeholder="Enter product name"
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value.toUpperCase() }))}
                  className="uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Barcode</label>
                  <div className="relative">
                    <Input
                      placeholder="Barcode"
                      value={editForm.barcode}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, barcode: e.target.value }))}
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBarcodeScanner(true)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      type="button"
                    >
                      <Barcode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Case Barcode</label>
                  <div className="relative">
                    <Input
                      placeholder="Case barcode"
                      value={editForm.caseBarcode}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, caseBarcode: e.target.value }))}
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCaseBarcodeScanner(true)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      type="button"
                    >
                      <Barcode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Case Size</label>
                  <Input
                    placeholder="1"
                    value={editForm.caseSize}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, caseSize: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Packet Size</label>
                  <Input
                    placeholder="1"
                    value={editForm.packetSize}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, packetSize: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">RRP (e.g. 456 = £4.56)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <Input
                    className="pl-7"
                    placeholder="0.00"
                    value={editForm.rrp}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Category</label>
                <CategorySelect
                  value={editForm.category}
                  onChange={(val) => setEditForm((prev) => ({ ...prev, category: val }))}
                  placeholder="Select category..."
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Current Image</label>
                <img
                  src={editImageUrl}
                  alt={editForm.title}
                  className="w-16 h-16 object-cover rounded-md"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Upload New Image (Optional)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative w-16 h-16 mt-1">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </Button>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveProduct}
                  className="flex-1"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Scan Product Barcode</DialogTitle>
          </DialogHeader>
          <div className="w-full max-w-full overflow-hidden">
            <OptimizedScanner
              width="100%"
              height={250}
              onScan={(result) => {
                setEditForm((prev) => ({ ...prev, barcode: result }));
                setShowBarcodeScanner(false);
                toast.success('Barcode scanned!');
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCaseBarcodeScanner} onOpenChange={setShowCaseBarcodeScanner}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Scan Case Barcode</DialogTitle>
          </DialogHeader>
          <div className="w-full max-w-full overflow-hidden">
            <OptimizedScanner
              width="100%"
              height={250}
              onScan={(result) => {
                setEditForm((prev) => ({ ...prev, caseBarcode: result }));
                setShowCaseBarcodeScanner(false);
                toast.success('Case barcode scanned!');
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemsInUserList;
