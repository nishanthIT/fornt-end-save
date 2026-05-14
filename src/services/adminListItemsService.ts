import { API_CONFIG } from '@/config/api';

const API_BASE = API_CONFIG.BASE_URL;

export interface ListItemSummary {
  itemId: string | null;
  dedupeKey: string;
  itemName: string;
  barcode: string | null;
  caseBarcode: string | null;
  img?: string | string[] | { url?: string } | null;
  price?: number | string | null;
  caseSize?: string | null;
  packetSize?: string | null;
  retailSize?: string | null;
  rrp?: number | string | null;
  category?: string | null;
  shopId: string;
  shopName: string;
  aisle: string;
  aisleValue: string;
  listCount: number;
  lastUpdated: string | null;
}

export interface ListItemUpdatePayload {
  itemId: string;
  shopId?: string;
  title?: string;
  barcode?: string;
  caseBarcode?: string;
  caseSize?: string;
  packetSize?: string;
  retailSize?: string;
  rrp?: number | string | null;
  category?: string;
  price?: number | string | null;
}

export interface ProductLookupResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    barcode: string | null;
    caseBarcode: string | null;
    caseSize: string | null;
    packetSize: string | null;
    retailSize: string | null;
    rrp: number | string | null;
    category: string | null;
  };
}

export interface ListItemUpdateLog {
  id: string;
  timestamp: string;
  product: {
    id: string;
    title: string;
    barcode: string | null;
    caseBarcode: string | null;
    caseSize: string | null;
    packetSize: string | null;
    retailSize: string | null;
    rrp: number | string | null;
    category: string | null;
  };
  shop: {
    id: string;
    name: string;
  };
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
}

export interface ListItemUpdateSummary {
  rangeDays: number;
  totalUnique: number;
  byDate: Array<{
    date: string;
    uniqueProducts: number;
    totalEdits: number;
  }>;
}

export interface ListItemsFilterOption {
  value: string;
  label: string;
  count: number;
}

export interface ListItemsQuery {
  search?: string;
  missingCaseBarcode?: boolean;
  shopId?: string;
  aisle?: string;
  sortBy?: 'itemName' | 'itemId' | 'caseBarcode' | 'listCount' | 'lastUpdated';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ListItemsResponse {
  success: boolean;
  data: {
    items: ListItemSummary[];
    filters: {
      shops: ListItemsFilterOption[];
      aisles: ListItemsFilterOption[];
      selectedShop: string | null;
      selectedAisle: string | null;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

class AdminListItemsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getListItems(query: ListItemsQuery): Promise<ListItemsResponse> {
    const params = new URLSearchParams();

    if (query.search) params.append('search', query.search);
    if (query.missingCaseBarcode) params.append('missingCaseBarcode', 'true');
    if (query.shopId) params.append('shopId', query.shopId);
    if (query.aisle) params.append('aisle', query.aisle);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query.page) params.append('page', String(query.page));
    if (query.limit) params.append('limit', String(query.limit));

    const response = await fetch(`${API_BASE}${API_CONFIG.ADMIN.LIST_ITEMS}?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch list items');
    }

    return response.json();
  }

  async updateCaseBarcode(itemId: string, caseBarcode: string): Promise<void> {
    const response = await fetch(`${API_BASE}${API_CONFIG.ADMIN.UPDATE_LIST_ITEM_CASE_BARCODE}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ itemId, caseBarcode }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update case barcode');
    }
  }

  async updateListItem(payload: ListItemUpdatePayload): Promise<void> {
    const response = await fetch(`${API_BASE}${API_CONFIG.ADMIN.UPDATE_LIST_ITEM}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update list item');
    }
  }

  async getProductByBarcode(barcode: string, field?: 'barcode' | 'caseBarcode'): Promise<ProductLookupResponse> {
    const params = field ? `?field=${encodeURIComponent(field)}` : '';
    const response = await fetch(`${API_BASE}${API_CONFIG.PRODUCT.GET_BY_BARCODE(barcode)}${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Product not found');
    }

    return response.json();
  }

  async getEmployeeListItemUpdates(
    employeeId: number,
    limit = 25,
    summaryDays = 30
  ): Promise<{ logs: ListItemUpdateLog[]; summary: ListItemUpdateSummary | null }> {
    const response = await fetch(
      `${API_BASE}${API_CONFIG.ADMIN.EMPLOYEE_LIST_ITEM_UPDATES(employeeId)}?limit=${limit}&summaryDays=${summaryDays}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch list item updates');
    }

    const data = await response.json();
    return {
      logs: data.data || [],
      summary: data.summary || null
    };
  }
}

export const adminListItemsService = new AdminListItemsService();
export default adminListItemsService;
