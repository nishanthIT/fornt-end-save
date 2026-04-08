import { API_CONFIG } from '@/config/api';

const API_BASE = API_CONFIG.BASE_URL;

export interface ListItemSummary {
  itemId: string | null;
  dedupeKey: string;
  itemName: string;
  barcode: string | null;
  caseBarcode: string | null;
  img?: string | string[] | { url?: string } | null;
  listCount: number;
  lastUpdated: string | null;
}

export interface ListItemsQuery {
  search?: string;
  missingCaseBarcode?: boolean;
  sortBy?: 'itemName' | 'itemId' | 'caseBarcode' | 'listCount' | 'lastUpdated';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ListItemsResponse {
  success: boolean;
  data: {
    items: ListItemSummary[];
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
}

export const adminListItemsService = new AdminListItemsService();
export default adminListItemsService;
