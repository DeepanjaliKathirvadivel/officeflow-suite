import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
  TrendingUp,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [recentBills, setRecentBills] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    const { data: bills } = await supabase
      .from("bills")
      .select("id, vendor_name, total_amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const all = bills || [];
    setRecentBills(all);
    setStats({
      total: all.length,
      pending: all.filter((b) => b.status === "pending").length,
      approved: all.filter((b) => b.status === "approved").length,
      rejected: all.filter((b) => b.status === "rejected").length,
    });
  };

  const statCards = [
    { label: "Total Bills", value: stats.total, icon: FileText, color: "text-primary" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-warning" },
    { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-success" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Overview of expense bill operations</p>
        </div>
        <Link to="/bills/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Bill
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`rounded-lg bg-muted p-2.5 ${s.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Bills */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Bills</CardTitle>
          <Link to="/bills" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recentBills.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No bills yet. Create your first bill to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {recentBills.map((bill) => (
                <Link
                  key={bill.id}
                  to={`/bills/${bill.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{bill.vendor_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(bill.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      ₹{Number(bill.total_amount).toLocaleString("en-IN")}
                    </span>
                    <Badge variant="outline" className="capitalize text-xs">
                      {bill.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
