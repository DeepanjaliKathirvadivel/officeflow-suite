import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Box, Upload } from "lucide-react";

const ASSET_TYPES = ["Laptop", "Desktop", "Monitor", "Keyboard", "Mouse", "Phone", "Printer", "Projector", "Furniture", "Vehicle", "Other"];
const DEPARTMENTS = ["IT", "HR", "Finance", "Operations", "Admin", "Marketing", "Sales"];

export default function AssetRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", asset_type: "", serial_number: "", department: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const generateAssetCode = () => `AST-${Date.now().toString(36).toUpperCase()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    let image_url = "";
    if (imageFile) {
      const path = `${crypto.randomUUID()}.${imageFile.name.split(".").pop()}`;
      const { error: upErr } = await supabase.storage.from("asset-images").upload(path, imageFile);
      if (upErr) { toast.error("Failed to upload image"); setSubmitting(false); return; }
      image_url = supabase.storage.from("asset-images").getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from("assets").insert({
      asset_code: generateAssetCode(),
      name: form.name,
      asset_type: form.asset_type,
      serial_number: form.serial_number || null,
      department: form.department || null,
      image_url: image_url || null,
      created_by: user.id,
    });

    if (error) { toast.error("Failed to register asset"); setSubmitting(false); return; }
    toast.success("Asset registered");
    navigate("/assets");
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Box className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Register Asset</h2>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Asset Name *</Label>
              <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Asset Type *</Label>
              <Select value={form.asset_type} onValueChange={(v) => setForm((f) => ({ ...f, asset_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input value={form.serial_number} onChange={(e) => setForm((f) => ({ ...f, serial_number: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={(v) => setForm((f) => ({ ...f, department: v }))}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Asset Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </div>
            <Button type="submit" disabled={submitting || !form.name || !form.asset_type} className="w-full">
              {submitting ? "Registering..." : "Register Asset"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
