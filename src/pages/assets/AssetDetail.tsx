import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import SignatureCanvas from "@/components/shared/SignatureCanvas";
import { toast } from "sonner";
import { Box, ArrowRightLeft, History } from "lucide-react";

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const [asset, setAsset] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [damages, setDamages] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showIssue, setShowIssue] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [issueForm, setIssueForm] = useState({ issued_to: "", due_date: "" });
  const [returnForm, setReturnForm] = useState({ condition: "", damage_desc: "" });
  const [damageFile, setDamageFile] = useState<File | null>(null);
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!id) return;
    supabase.from("assets").select("*").eq("id", id).single().then(({ data }) => setAsset(data));
    supabase.from("asset_transactions").select("*").eq("asset_id", id).order("created_at", { ascending: false }).then(async ({ data }) => {
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((t) => t.issued_to))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.full_name]));
        setTransactions(data.map((t) => ({ ...t, issued_to_name: profileMap[t.issued_to] || "Unknown" })));
      } else {
        setTransactions([]);
      }
    });
    supabase.from("damage_reports").select("*").eq("asset_id", id).order("created_at", { ascending: false }).then(({ data }) => setDamages(data || []));
    supabase.from("profiles").select("user_id, full_name").then(({ data }) => setEmployees(data || []));
  };

  useEffect(load, [id]);

  const handleIssue = async () => {
    if (!user || !id || !signature) return;
    setSubmitting(true);
    const { error } = await supabase.from("asset_transactions").insert({
      asset_id: id,
      issued_to: issueForm.issued_to,
      issued_by: user.id,
      due_date: issueForm.due_date,
      signature_data: signature,
    });
    if (error) { toast.error("Failed to issue asset"); setSubmitting(false); return; }
    await supabase.from("assets").update({ status: "issued" as any }).eq("id", id);
    toast.success("Asset issued");
    setShowIssue(false);
    setSignature("");
    load();
    setSubmitting(false);
  };

  const handleReturn = async () => {
    if (!user || !id) return;
    setSubmitting(true);
    const activeTransaction = transactions.find((t) => t.status === "issued");
    if (!activeTransaction) { toast.error("No active issue found"); setSubmitting(false); return; }

    await supabase.from("asset_transactions").update({ return_date: new Date().toISOString(), return_condition: returnForm.condition, status: "returned" as any }).eq("id", activeTransaction.id);
    await supabase.from("assets").update({ status: "available" as any }).eq("id", id);

    if (returnForm.damage_desc) {
      let damage_image = "";
      if (damageFile) {
        const path = `${crypto.randomUUID()}.${damageFile.name.split(".").pop()}`;
        await supabase.storage.from("asset-images").upload(path, damageFile);
        damage_image = supabase.storage.from("asset-images").getPublicUrl(path).data.publicUrl;
      }
      await supabase.from("damage_reports").insert({
        asset_id: id,
        transaction_id: activeTransaction.id,
        reported_by: user.id,
        description: returnForm.damage_desc,
        image_url: damage_image || null,
      });
    }

    toast.success("Asset returned");
    setShowReturn(false);
    load();
    setSubmitting(false);
  };

  if (!asset) return <p className="text-muted-foreground p-4">Loading...</p>;
  const isAdmin = hasRole("admin");
  const activeIssue = transactions.find((t) => t.status === "issued");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Box className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">{asset.name}</h2>
        <Badge className="capitalize">{asset.status}</Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Asset Code:</span><p className="font-medium">{asset.asset_code}</p></div>
            <div><span className="text-muted-foreground">Type:</span><p className="font-medium">{asset.asset_type}</p></div>
            <div><span className="text-muted-foreground">Serial:</span><p className="font-medium">{asset.serial_number || "N/A"}</p></div>
            <div><span className="text-muted-foreground">Department:</span><p className="font-medium">{asset.department || "N/A"}</p></div>
          </div>
          {asset.image_url && <img src={asset.image_url} alt={asset.name} className="mt-4 max-h-48 rounded-lg border object-cover" />}
        </CardContent>
      </Card>

      {isAdmin && (
        <div className="flex gap-2">
          {asset.status === "available" && <Button onClick={() => setShowIssue(true)}><ArrowRightLeft className="mr-2 h-4 w-4" />Issue Asset</Button>}
          {asset.status === "issued" && <Button variant="outline" onClick={() => setShowReturn(true)}>Mark Returned</Button>}
        </div>
      )}

      {showIssue && (
        <Card>
          <CardHeader><CardTitle className="text-base">Issue Asset</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Assign to Employee *</Label>
              <Select value={issueForm.issued_to} onValueChange={(v) => setIssueForm((f) => ({ ...f, issued_to: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.user_id} value={e.user_id}>{e.full_name || e.user_id}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input type="date" value={issueForm.due_date} onChange={(e) => setIssueForm((f) => ({ ...f, due_date: e.target.value }))} />
            </div>
            <SignatureCanvas onSave={(d) => setSignature(d)} />
            {signature && <p className="text-sm text-success">✓ Signature captured</p>}
            <Button onClick={handleIssue} disabled={submitting || !issueForm.issued_to || !issueForm.due_date || !signature}>
              {submitting ? "Issuing..." : "Confirm Issue"}
            </Button>
          </CardContent>
        </Card>
      )}

      {showReturn && (
        <Card>
          <CardHeader><CardTitle className="text-base">Return Asset</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={returnForm.condition} onValueChange={(v) => setReturnForm((f) => ({ ...f, condition: v }))}>
                <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {returnForm.condition === "damaged" && (
              <>
                <div className="space-y-2">
                  <Label>Damage Description</Label>
                  <Textarea value={returnForm.damage_desc} onChange={(e) => setReturnForm((f) => ({ ...f, damage_desc: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Damage Photo</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setDamageFile(e.target.files?.[0] || null)} />
                </div>
              </>
            )}
            <Button onClick={handleReturn} disabled={submitting}>
              {submitting ? "Processing..." : "Confirm Return"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* History Timeline */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="h-5 w-5" />Asset History</CardTitle></CardHeader>
        <CardContent>
          {transactions.length === 0 && damages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => (
                <div key={t.id} className="border-l-2 border-primary/30 pl-4 py-2">
                  <p className="text-sm font-medium">
                    {t.status === "issued" ? "Issued" : "Returned"} — {t.issued_to_name || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.issue_date).toLocaleDateString()} {t.return_date ? `→ ${new Date(t.return_date).toLocaleDateString()}` : "(active)"}
                  </p>
                  {t.return_condition && <p className="text-xs">Condition: {t.return_condition}</p>}
                  {t.signature_data && <img src={t.signature_data} alt="Signature" className="max-w-[120px] border rounded mt-1" />}
                </div>
              ))}
              {damages.map((d) => (
                <div key={d.id} className="border-l-2 border-destructive/30 pl-4 py-2">
                  <p className="text-sm font-medium text-destructive">Damage Report</p>
                  <p className="text-xs">{d.description}</p>
                  {d.image_url && <img src={d.image_url} alt="Damage" className="max-w-[120px] border rounded mt-1" />}
                  <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
