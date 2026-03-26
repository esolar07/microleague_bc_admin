import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UpArrow } from "../icons";

interface StatsCardProps {
  title: string;
  value: string | number;

  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  icon: any;
}

export const StatsCard = ({
  title,
  value,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) => {
  return (
    <Card
      className={cn(
        "cardShadow bg-white p-5 rounded-[20px] hover:border-primary/30 transition-all",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-semibold text-primary">{value}</p>
          {trend && (
            <p
              className={cn(
                "text-sm mt-1 flex items-center gap-1",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              {/* {trend.value}{trend.isPositive ? "↑" : "↓"} */}
              {trend.value}{trend.isPositive ? <UpArrow /> : "↓"}
            </p>
          )}
        </div>

        <Icon />
      </div>
    </Card>
  );
};
