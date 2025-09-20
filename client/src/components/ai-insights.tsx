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
  high: "bg-red-100 text-red-800",
};

const priorityIcons = {
  low: <Info className="h-4 w-4" />,
  medium: <TrendingUp className="h-4 w-4" />,
  high: <AlertTriangle className="h-4 w-4" />,
};

export function AIInsights({ type, projectCode }: AIInsightsProps) {
  // Mock data since we don't have AI backend endpoints
  const insights = {
    insights: [
      {
        title: "Project Progress Analysis",
        description: "AI insights temporarily disabled in frontend-only mode. Previously analyzed project performance metrics and risk indicators.",
        priority: "medium" as const,
        category: "performance"
      }
    ],
    summary: "AI insights are currently disabled as this application now runs without backend dependencies.",
    lastUpdated: new Date().toISOString()
  };
  
  const rawInsights = "<p>AI insights are temporarily disabled in frontend-only mode.</p>";
  const isLoading = false;

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

  if (!insights) {
    return (
      <Card className="bg-white dark:bg-gray-900 border dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No insights available at this time.
          </p>
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

        {/* Structured Insights */}
        <div className="space-y-3">
          {insights.insights.map((insight, index) => (
            <div
              key={index}
              className="p-3 border rounded-lg dark:border-gray-700"
            >
              <div className="flex items-start gap-3">
                <div className="text-lg">{insight.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {insight.title}
                    </h4>
                    <Badge
                      className={`text-xs ${priorityColors[insight.priority]}`}
                    >
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

        {/* Raw HTML Insights */}
        {rawInsights && (
          <div
            className="prose dark:prose-invert max-w-none mt-6"
            dangerouslySetInnerHTML={{ __html: rawInsights }}
          />
        )}
      </CardContent>
    </Card>
  );
}
