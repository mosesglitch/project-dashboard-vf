import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";
import type { DashboardFilters } from "@/lib/types";

interface DashboardHeaderProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export function DashboardHeader({ filters, onFiltersChange }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();

  const handleFilterChange = (key: keyof DashboardFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Organization Logo/Name */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
             
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center space-x-4">
            {/* Date Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Date Range:
              </label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-auto"
                data-testid="input-date-from"
              />
              <span className="text-gray-500 dark:text-gray-400">to</span>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-auto"
                data-testid="input-date-to"
              />
            </div>

            {/* Global Filters */}
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-32" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.division}
              onValueChange={(value) => handleFilterChange('division', value)}
            >
              <SelectTrigger className="w-40" data-testid="select-division-filter">
                <SelectValue placeholder="All Divisions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                <SelectItem value="mechanical">Mechanical</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="instrumentation">Instrumentation</SelectItem>
              </SelectContent>
            </Select>

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-lg"
              data-testid="button-dark-mode-toggle"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
