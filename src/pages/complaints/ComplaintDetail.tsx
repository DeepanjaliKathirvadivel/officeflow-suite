import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertTriangle, MessageSquare } from "lucide-react";

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const [complaint, setComplaint] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [resolution, setResolution] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!id) return;
    supabase.from("complaints").select("*").eq("id", id).single().then(({ data }) => setComplaint(data));
    supabase.from("complaint_assignments").select("*").eq("complaint_id", id).maybeSingle().then(({ data }) => setAssignment(data));
    supabase.from("complaint_history").select("*, profiles:performed_by(full_name)").eq("complaint_id", id).order("created_at", { ascending: true }).then(({ data }) => setHistory(data || []));
  };

  useEffect(load, [id]);

  const addNote = async () => {
    if (!user || !id || !note.trim()) return;
    setSubmitting(true);
    await supabase.from("complaint_history").insert({ complaint_id: id, action: "note_added", note, performed_by: user.id });
    setNote("");
    load();
    setSubmitting(false);
    toast.success("Note added");
  };

  const updateStatus = async (newStatus: string) => {
    if (!user || !id) return;
    if (newStatus === "closed" && !resolution.trim()) { toast.error("Resolution remark is required"); return; }
    setSubmitting(true);
    await supabase.from("complaints").update({
      status: newStatus as any,
      ...(newStatus === "closed" ? { resolution_remark: resolution } : {}),
    }).eq("id", id);
    await supabase.from("complaint_history").insert({
      complaint_id: id,
      action: `status_changed_to_${newStatus}`,
      note: newStatus === "closed" ? resolution : `Status changed to ${newStatus}`,
      performed_by: user.id,
    });
    load();
    setSubmitting(false);
    toast.success(`Status updated to ${newStatus}`);
  };

  if (!complaint) return <p className="text-muted-foreground p-4">Loading...</p>;

  const canManage = hasRole("admin") || hasRole("it_team") || hasRole("manager");
  const statusColor = complaint.status === "open" ? "destructive" : complaint.status === "in_progress" ? "secondary" : "default";
  const priorityColor = complaint.priority === "high" ? "destructive" : complaint.priority === "medium" ? "secondary" : "outline";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Complaint Detail</h2>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2">
            <Badge variant={statusColor as any} className="capitalize">{complaint.status.replace("_", " ")}</Badge>
            <Badge variant={priorityColor as any} className="capitalize">{complaint.priority} priority</Badge>
            <Badge variant="outline" className="capitalize">{complaint.category}</Badge>
          </div>
          <p className="text-sm">{complaint.description}</p>
          {assignment && <p className="text-xs text-muted-foreground">Assigned to: {assignment.assigned_department}</p>}
          {complaint.attachment_url && (
            <a href={complaint.attachment_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">View Attachment</a>
          )}
          {complaint.resolution_remark && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Resolution:</p>
              <p className="text-sm">{complaint.resolution_remark}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {canManage && complaint.status !== "closed" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {complaint.status === "open" && <Button onClick={() => updateStatus("in_progress")} disabled={submitting}>Mark In Progress</Button>}
              {complaint.status !== "closed" && (
                <div className="flex-1 space-y-2">
                  <Label>Resolution Remark (required to close)</Label>
                  <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Enter resolution details..." />
                  <Button variant="outline" onClick={() => updateStatus("closed")} disabled={submitting}>Close Complaint</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Internal Notes */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-5 w-5" />Timeline</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="border-l-2 border-primary/30 pl-4 py-1">
                <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()} · {(h as any).profiles?.full_name || "System"}</p>
                <p className="text-sm font-medium capitalize">{h.action.replace(/_/g, " ")}</p>
                {h.note && <p className="text-sm text-muted-foreground">{h.note}</p>}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add internal note..." className="flex-1" />
            <Button onClick={addNote} disabled={!note.trim() || submitting} className="self-end">Add Note</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
