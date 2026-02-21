import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Category {
  id: string;
  name: string;
}

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowCreate?: boolean;
}

const DEFAULT_CATEGORIES = [
  "Confectionery",
  "Crisps",
  "Soft Drinks",
  "Alcohol",
  "Grocery",
  "Pet Food",
  "Health & Beauty",
  "House Hold",
  "Hardware",
  "Medicines",
  "Cigarettes",
  "Single Spirits",
  "Cakes & Bread",
  "Chill Foods",
  "Frozen & Ice Cream"
];

export function CategorySelect({
  value,
  onChange,
  placeholder = "Select category...",
  disabled = false,
  allowCreate = true
}: CategorySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Fetch categories from API
  const fetchCategories = React.useCallback(async (query?: string) => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
      const url = query 
        ? `${apiUrl}/categories/search?query=${encodeURIComponent(query)}`
        : `${apiUrl}/categories`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCategories(data.data);
          return;
        }
      }
      // Fallback to default categories if API fails
      setCategories(DEFAULT_CATEGORIES.map((name, index) => ({ 
        id: `default-${index}`, 
        name 
      })));
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      // Use default categories as fallback
      setCategories(DEFAULT_CATEGORIES.map((name, index) => ({ 
        id: `default-${index}`, 
        name 
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load categories when component mounts or popover opens
  React.useEffect(() => {
    if (open) {
      fetchCategories(searchQuery);
    }
  }, [open, searchQuery, fetchCategories]);

  // Filter categories based on search query
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  // Check if search query matches any existing category
  const matchesExisting = React.useMemo(() => {
    if (!searchQuery) return false;
    return categories.some(
      cat => cat.name.toLowerCase() === searchQuery.toLowerCase()
    );
  }, [categories, searchQuery]);

  const handleSelect = (categoryName: string) => {
    onChange(categoryName);
    setOpen(false);
    setSearchQuery("");
  };

  const handleCreateNew = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
      const authToken = localStorage.getItem("auth_token");
      
      const response = await fetch(`${apiUrl}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify({ name: searchQuery.trim() }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCategories(prev => [...prev, data.data]);
          handleSelect(data.data.name);
        }
      } else {
        // If creation fails (maybe already exists), just use the name
        handleSelect(searchQuery.trim());
      }
    } catch (error) {
      console.error("Failed to create category:", error);
      // Use the name even if creation fails
      handleSelect(searchQuery.trim());
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[200px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search category..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading categories...
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {allowCreate && searchQuery.trim() ? (
                    <button
                      className="flex w-full items-center justify-center gap-2 py-2 text-sm hover:bg-accent cursor-pointer"
                      onClick={handleCreateNew}
                    >
                      <Plus className="h-4 w-4" />
                      Create "{searchQuery.trim()}"
                    </button>
                  ) : (
                    "No category found."
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {filteredCategories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={category.name}
                      onSelect={() => handleSelect(category.name)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === category.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {category.name}
                    </CommandItem>
                  ))}
                  {/* Show create option if search doesn't match existing */}
                  {allowCreate && searchQuery.trim() && !matchesExisting && filteredCategories.length > 0 && (
                    <CommandItem
                      value={`create-${searchQuery}`}
                      onSelect={handleCreateNew}
                      className="border-t"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create "{searchQuery.trim()}"
                    </CommandItem>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default CategorySelect;
