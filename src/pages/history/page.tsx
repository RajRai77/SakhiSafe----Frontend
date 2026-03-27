import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { ClockIcon, CheckCircleIcon, XCircleIcon, AlertTriangleIcon, MapPinIcon } from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";

const statusConfig = {
  sent: { icon: CheckCircleIcon, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30", label: "Sent" },
  sending: { icon: AlertTriangleIcon, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", label: "Sending" },
  failed: { icon: XCircleIcon, color: "text-destructive", bg: "bg-destructive/10", label: "Failed" },
  cancelled: { icon: XCircleIcon, color: "text-muted-foreground", bg: "bg-muted", label: "Cancelled" },
} as const;

function AlertHistoryList() {
  const alerts = useQuery(api.alerts.list, {});

  if (alerts === undefined) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Alert History</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{alerts.length} total alerts</p>
      </div>

      {alerts.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><ClockIcon /></EmptyMedia>
            <EmptyTitle>No alerts yet</EmptyTitle>
            <EmptyDescription>Your emergency alert history will appear here after you trigger your first SOS</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, i) => {
            const config = statusConfig[alert.status];
            const Icon = config.icon;
            return (
              <motion.div
                key={alert._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${config.bg}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div>
                      <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(alert._creationTime), "d MMM yyyy, h:mm a")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                  <MapPinIcon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {alert.latitude != null && alert.longitude != null
                      ? `${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}`
                      : "Location not available"}
                  </span>
                  {alert.mapLink && (
                  <a
                    href={alert.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-primary font-medium flex-shrink-0"
                  >
                    View Map
                  </a>
                  )}
                </div>

                {alert.contactsNotified.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Notified: </span>
                    {alert.contactsNotified.join(", ")}
                  </div>
                )}

                {alert.note && (
                  <p className="text-xs text-muted-foreground italic">{alert.note}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 gap-4 text-center">
          <p className="text-muted-foreground">Sign in to view your alert history</p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <AlertHistoryList />
      </Authenticated>
    </>
  );
}
