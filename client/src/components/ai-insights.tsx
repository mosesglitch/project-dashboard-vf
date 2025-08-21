import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, TrendingUp, AlertTriangle, Info } from "lucide-react";

interface AIInsight {
  type: string;
  title: string;
  content: string;
  priority: "low" | "medium" | "high";
  icon: string;
}

interface AIInsightsData {
  insights: AIInsight[];
  summary: string;
  lastUpdated: string;
}

interface AIInsightsProps {
  type: "portfolio" | "project";
  projectCode?: string;
}

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800", 
  high: "bg-red-100 text-red-800"
};

const priorityIcons = {
  low: <Info className="h-4 w-4" />,
  medium: <TrendingUp className="h-4 w-4" />,
  high: <AlertTriangle className="h-4 w-4" />
};

export function AIInsights({ type, projectCode }: AIInsightsProps) {
  const { data: insights, isLoading } = useQuery<AIInsightsData>({
    queryKey: ["ai-insights", type, projectCode],
    queryFn: async () => {
      const url = type === "portfolio" 
        ? "/api/ai/insights/portfolio"
        : `/api/ai/insights/project/${projectCode}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch AI insights");
      return response.json();
    },
    enabled: type === "portfolio" || (type === "project" && !!projectCode),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || !insights.insights) {
    return (
      <Card className="bg-white dark:bg-gray-900 border dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No insights available at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-900 border dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Insights
          <Badge variant="outline" className="ml-auto">
            Updated {new Date(insights.lastUpdated).toLocaleTimeString()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">
            {insights.summary}
          </p>
        </div>

        {/* Individual Insights */}
        <div className="space-y-3">
          {insights.insights.map((insight, index) => (
            <div key={index} className="p-3 border rounded-lg dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="text-lg">{insight.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {insight.title}
                    </h4>
                    <Badge className={`text-xs ${priorityColors[insight.priority]}`}>
                      <div className="flex items-center gap-1">
                        {priorityIcons[insight.priority]}
                        {insight.priority}
                      </div>
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {insight.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}