import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { DashboardFilters } from "@/lib/types";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export function FilterModal({ isOpen, onClose, filters, onFiltersChange }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<DashboardFilters>(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters: DashboardFilters = {
      status: "all",
      division: "all",
      budgetStatus: "all",
      performanceStatus: "all",
      dateFrom: "",
      dateTo: "",
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Projects</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={localFilters.dateFrom}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, dateFrom: e.target.value })
                  }
                  data-testid="input-filter-date-from"
                />
              </div>
              <div>
                <Label htmlFor="dateTo" className="text-xs text-muted-foreground">To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={localFilters.dateTo}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, dateTo: e.target.value })
                  }
                  data-testid="input-filter-date-to"
                />
              </div>
            </div>
          </div>
   
          <Separator />

          {/* Division Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Division</Label>
            <Select
              value={localFilters.division}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, division: value })
              }
            >
              <SelectTrigger data-testid="select-filter-division">
                <SelectValue placeholder="All Divisions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                <SelectItem value="mechanical">Mechanical</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="instrumentation">Instrumentation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Budget Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Budget Status</Label>
            <Select
              value={localFilters.budgetStatus || "all"}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, budgetStatus: value })
              }
            >
              <SelectTrigger data-testid="select-filter-budget-status">
                <SelectValue placeholder="All Budget Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Budget Status</SelectItem>
                <SelectItem value="under">Under Budget</SelectItem>
                <SelectItem value="within">Within Budget</SelectItem>
                <SelectItem value="over">Over Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Performance Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Performance Status</Label>
            <Select
              value={localFilters.performanceStatus || "all"}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, performanceStatus: value })
              }
            >
              <SelectTrigger data-testid="select-filter-performance-status">
                <SelectValue placeholder="All Performance Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance Status</SelectItem>
                <SelectItem value="on-track">On Track</SelectItem>
                <SelectItem value="behind">Behind Schedule</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Project Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Project Status</Label>
            <Select
              value={localFilters.status}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, status: value })
              }
            >
              <SelectTrigger data-testid="select-filter-status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handleResetFilters}
            data-testid="button-reset-filters"
          >
            Reset All
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-filters"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyFilters}
              data-testid="button-apply-filters"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}