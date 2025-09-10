import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  HandCoins 
} from "lucide-react";
import type { KPIData } from "@/lib/types";

interface KPICardsProps {
  data: KPIData | undefined;
  isLoading: boolean;
}

export function KPICards({ data, isLoading }: KPICardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatLargeCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `Ksh${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `Ksh${(amount / 1000).toFixed(0)}K`;
    }
    return formatCurrency(amount);
  };

  const kpiItems = [
    {
      title: "Total Projects",
      value: data?.totalProjects || 0,
      icon: Building2,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      testId: "text-total-projects"
    },
    {
      title: "Active Projects",
      value: data?.activeProjects || 0,
      icon: Play,
      iconColor: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900",
      testId: "text-active-projects"
    },
    {
      title: "Completed",
      value: data?.completedProjects || 0,
      icon: CheckCircle,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      testId: "text-completed-projects"
    },
    {
      title: "Delayed",
      value: data?.delayedProjects || 0,
      icon: AlertTriangle,
      iconColor: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900",
      testId: "text-delayed-projects"
    },
    {
      title: "Total Budget",
      value: data ? formatLargeCurrency(data.totalBudget) : "$0",
      icon: DollarSign,
      iconColor: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900",
      testId: "text-total-budget"
    },
    {
      title: "Actual Spend",
      value: data ? formatLargeCurrency(data.actualSpend) : "$0",
      icon: TrendingUp,
      iconColor: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900",
      testId: "text-actual-spend"
    },
    {
      title: "Amount Received",
      value: data ? formatLargeCurrency(data.amountReceived) : "$0",
      icon: HandCoins,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      testId: "text-amount-received"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {Array.from({ length: 7 }).map((_, index) => (
          <Card key={index} className="bg-white dark:bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Skeleton className="p-2 w-10 h-10 rounded-lg" />
                <div className="ml-4 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
      {kpiItems.map((item, index) => (
        <Card key={index} className="bg-white dark:bg-gray-900 border dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`p-2 ${item.bgColor} rounded-lg`}>
                <item.icon className={`h-5 w-5 ${item.iconColor}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {item.title}
                </p>
                <p 
                  className="text-2xl font-bold text-gray-900 dark:text-white"
                  data-testid={item.testId}
                >
                  {item.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
