import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Search, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type BillStatus = "draft" | "pending" | "approved" | "rejected";

const statusColors: Record<BillStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-warning/15 text-warning border-warning/30",
  approved: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function Bills() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchBills();
  }, [statusFilter]);

  const fetchBills = async () => {
    setLoading(true);
    let query = supabase
      .from("bills")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter as "draft" | "pending" | "approved" | "rejected");
    }

    const { data } = await query;
    setBills(data || []);
    setLoading(false);
  };

  const filtered = bills.filter(
    (b) =>
      b.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.bill_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Expense Bills</h2>
        <Link to="/bills/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Bill
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendor or bill number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bills List */}
      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading bills...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          No bills found.{" "}
          <Link to="/bills/new" className="text-primary hover:underline">
            Create one
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((bill) => (
            <Card key={bill.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium truncate">{bill.vendor_name || "Unknown Vendor"}</span>
                    <Badge
                      variant="outline"
                      className={cn("capitalize text-xs", statusColors[bill.status as BillStatus])}
                    >
                      {bill.status}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {bill.bill_number && <span>#{bill.bill_number}</span>}
                    <span>₹{Number(bill.total_amount).toLocaleString("en-IN")}</span>
                    {bill.department && <span>{bill.department}</span>}
                    <span>{new Date(bill.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Link to={`/bills/${bill.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
