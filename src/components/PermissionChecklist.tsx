import { Checkbox } from "@/components/ui/checkbox";
import type { PermissionOption } from "@/config/permissions";

interface PermissionChecklistProps {
  title: string;
  options: PermissionOption[];
  value: string[];
  onChange: (next: string[]) => void;
}

export const PermissionChecklist = ({ title, options, value, onChange }: PermissionChecklistProps) => {
  const allOn = options.every((o) => value.includes(o.value));
  const toggleAll = () =>
    onChange(
      allOn
        ? value.filter((p) => !options.some((o) => o.value === p))
        : [...new Set([...value, ...options.map((o) => o.value)])]
    );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{title}</label>
        <button type="button" className="text-xs text-blue-600 hover:underline" onClick={toggleAll}>
          {allOn ? "Clear all" : "Select all"}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={value.includes(option.value)}
              onCheckedChange={(checked) =>
                onChange(checked ? [...value, option.value] : value.filter((p) => p !== option.value))
              }
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
};
