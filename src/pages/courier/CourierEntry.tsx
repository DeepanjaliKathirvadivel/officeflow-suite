import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Package, Upload } from "lucide-react";

export default function CourierEntry() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [form, setForm] = useState({ tracking_number: "", vendor_id: "", assigned_to: "" });
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newVendor, setNewVendor] = useState("");

  useEffect(() => {
    supabase.from("courier_vendors").select("*").order("name").then(({ data }) => setVendors(data || []));
    supabase.from("profiles").select("user_id, full_name").then(({ data }) => setEmployees(data || []));
  }, []);

  const addVendor = async () => {
    if (!newVendor.trim()) return;
    const { data, error } = await supabase.from("courier_vendors").insert({ name: newVendor.trim() }).select().single();
    if (error) { toast.error("Failed to add vendor"); return; }
    setVendors((v) => [...v, data]);
    setForm((f) => ({ ...f, vendor_id: data.id }));
    setNewVendor("");
    toast.success("Vendor added");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    let slip_image_url = "";
    if (slipFile) {
      const ext = slipFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("courier-slips").upload(path, slipFile);
      if (upErr) { toast.error("Failed to upload slip"); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from("courier-slips").getPublicUrl(path);
      slip_image_url = urlData.publicUrl;
    }

    const { error } = await supabase.from("couriers").insert({
      tracking_number: form.tracking_number,
      vendor_id: form.vendor_id,
      assigned_to: form.assigned_to,
      slip_image_url,
      created_by: user.id,
    });

    if (error) { toast.error("Failed to save courier entry"); setSubmitting(false); return; }
    toast.success("Courier entry saved");
    navigate("/couriers");
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">New Courier Entry</h2>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tracking Number *</Label>
              <Input required value={form.tracking_number} onChange={(e) => setForm((f) => ({ ...f, tracking_number: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Courier Vendor *</Label>
              <Select value={form.vendor_id} onValueChange={(v) => setForm((f) => ({ ...f, vendor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2 mt-1">
                <Input placeholder="Add new vendor" value={newVendor} onChange={(e) => setNewVendor(e.target.value)} className="text-sm" />
                <Button type="button" variant="outline" size="sm" onClick={addVendor}>Add</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign to Employee *</Label>
              <Select value={form.assigned_to} onValueChange={(v) => setForm((f) => ({ ...f, assigned_to: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.user_id} value={e.user_id}>{e.full_name || e.user_id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Courier Slip Image</Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Button type="submit" disabled={submitting || !form.tracking_number || !form.vendor_id || !form.assigned_to} className="w-full">
              {submitting ? "Saving..." : "Save Entry"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
