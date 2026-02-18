import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

const CATEGORY_DEPT_MAP: Record<string, string> = {
  it: "IT",
  maintenance: "Facilities",
  hr: "HR",
  security: "Security",
  admin: "Admin",
};

export default function ComplaintSubmit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ category: "", priority: "medium", description: "" });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    let attachment_url = "";
    if (file) {
      const path = `${crypto.randomUUID()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("complaint-attachments").upload(path, file);
      if (error) { toast.error("Upload failed"); setSubmitting(false); return; }
      attachment_url = supabase.storage.from("complaint-attachments").getPublicUrl(path).data.publicUrl;
    }

    const { data: complaint, error } = await supabase.from("complaints").insert({
      category: form.category as any,
      priority: form.priority as any,
      description: form.description,
      attachment_url: attachment_url || null,
      submitted_by: user.id,
    }).select().single();

    if (error) { toast.error("Failed to submit complaint"); setSubmitting(false); return; }

    // Auto-assign department
    const dept = CATEGORY_DEPT_MAP[form.category] || "Admin";
    await supabase.from("complaint_assignments").insert({
      complaint_id: complaint.id,
      assigned_department: dept,
    });

    // Add history entry
    await supabase.from("complaint_history").insert({
      complaint_id: complaint.id,
      action: "submitted",
      note: `Complaint submitted and auto-assigned to ${dept}`,
      performed_by: user.id,
    });

    toast.success("Complaint submitted");
    navigate("/complaints");
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Submit Complaint</h2>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea required rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Attachment</Label>
              <Input type="file" accept="image/*,.pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <Button type="submit" disabled={submitting || !form.category || !form.description} className="w-full">
              {submitting ? "Submitting..." : "Submit Complaint"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
