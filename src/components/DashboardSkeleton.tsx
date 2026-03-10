import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardSkeletonProps {
  kpiCount?: number;
  sections?: number;
}

export function DashboardSkeleton({ kpiCount = 4, sections = 3 }: DashboardSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-10 w-56" />
      </div>

      {/* KPI Cards */}
      <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-${kpiCount}`}>
        {Array.from({ length: kpiCount }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart sections */}
      {Array.from({ length: sections }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
