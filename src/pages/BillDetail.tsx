import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type BillStatus = "draft" | "pending" | "approved" | "rejected";

const statusConfig: Record<BillStatus, { color: string; icon: typeof Clock }> = {
  draft: { color: "bg-muted text-muted-foreground", icon: FileText },
  pending: { color: "bg-warning/15 text-warning", icon: Clock },
  approved: { color: "bg-success/15 text-success", icon: CheckCircle },
  rejected: { color: "bg-destructive/15 text-destructive", icon: XCircle },
};

export default function BillDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const [bill, setBill] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchBill();
  }, [id]);

  const fetchBill = async () => {
    const [{ data: billData }, { data: approvalsData }] = await Promise.all([
      supabase.from("bills").select("*").eq("id", id).single(),
      supabase
        .from("bill_approvals")
        .select("*, profiles:approver_id(full_name)")
        .eq("bill_id", id)
        .order("approval_level"),
    ]);
    setBill(billData);
    setApprovals(approvalsData || []);
    setLoading(false);
  };

  const handleApproval = async (action: "approved" | "rejected") => {
    if (!user || !bill) return;

    const myApproval = approvals.find(
      (a) => a.approver_id === user.id && a.status === "pending"
    );
    if (!myApproval) {
      toast.error("You don't have a pending approval for this bill.");
      return;
    }

    await supabase
      .from("bill_approvals")
      .update({ status: action, comments: comment, acted_at: new Date().toISOString() })
      .eq("id", myApproval.id);

    if (action === "rejected") {
      await supabase.from("bills").update({ status: "rejected" }).eq("id", bill.id);
      toast.success("Bill rejected.");
    } else {
      // Check if there's a next level
      const nextApproval = approvals.find(
        (a) => a.approval_level === myApproval.approval_level + 1
      );
      if (nextApproval) {
        await supabase
          .from("bill_approvals")
          .update({ status: "pending" })
          .eq("id", nextApproval.id);
        await supabase
          .from("bills")
          .update({ current_approval_level: nextApproval.approval_level })
          .eq("id", bill.id);
        toast.success("Bill approved and forwarded to next level.");
      } else {
        await supabase.from("bills").update({ status: "approved" }).eq("id", bill.id);
        toast.success("Bill fully approved!");
      }
    }

    setComment("");
    fetchBill();
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!bill) return <div className="text-center py-12 text-muted-foreground">Bill not found.</div>;

  const status = bill.status as BillStatus;
  const StatusIcon = statusConfig[status].icon;
  const canApprove =
    user &&
    approvals.some((a) => a.approver_id === user.id && a.status === "pending");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{bill.vendor_name || "Bill Details"}</h2>
          <p className="text-sm text-muted-foreground">#{bill.bill_number || bill.id.slice(0, 8)}</p>
        </div>
        <Badge className={cn("capitalize text-sm px-3 py-1", statusConfig[status].color)}>
          <StatusIcon className="mr-1 h-3.5 w-3.5" />
          {status}
        </Badge>
      </div>

      {/* Bill Image */}
      {bill.file_url && (
        <Card>
          <CardContent className="p-4">
            <img
              src={bill.file_url}
              alt="Bill"
              className="w-full max-h-96 object-contain rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Bill Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Extracted Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Vendor</span>
              <p className="font-medium">{bill.vendor_name || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Amount</span>
              <p className="font-medium text-lg">₹{Number(bill.total_amount).toLocaleString("en-IN")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Bill Date</span>
              <p className="font-medium">{bill.bill_date || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">GST</span>
              <p className="font-medium">{bill.gst_number || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Department</span>
              <p className="font-medium">{bill.department || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created</span>
              <p className="font-medium">{new Date(bill.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Approval Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {approvals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approval workflow assigned.</p>
          ) : (
            <div className="relative space-y-0">
              {approvals.map((a, i) => {
                const aStatus = a.status as BillStatus;
                const AIcon = statusConfig[aStatus]?.icon || Clock;
                return (
                  <div key={a.id} className="flex gap-4">
                    {/* Vertical line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2",
                          aStatus === "approved"
                            ? "border-success bg-success/10"
                            : aStatus === "rejected"
                            ? "border-destructive bg-destructive/10"
                            : aStatus === "pending"
                            ? "border-warning bg-warning/10"
                            : "border-muted bg-muted"
                        )}
                      >
                        <AIcon className="h-4 w-4" />
                      </div>
                      {i < approvals.length - 1 && (
                        <div className="w-px flex-1 bg-border min-h-[2rem]" />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className="font-medium text-sm">
                        Level {a.approval_level} — {(a as any).profiles?.full_name || "Approver"}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{aStatus}</p>
                      {a.comments && (
                        <p className="text-xs mt-1 text-muted-foreground italic">"{a.comments}"</p>
                      )}
                      {a.acted_at && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.acted_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Actions */}
      {canApprove && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Add a comment (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <div className="flex gap-3">
              <Button
                onClick={() => handleApproval("approved")}
                className="bg-success hover:bg-success/90 text-success-foreground"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleApproval("rejected")}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
