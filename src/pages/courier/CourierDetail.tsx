import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SignatureCanvas from "@/components/shared/SignatureCanvas";
import { toast } from "sonner";
import { Package, CheckCircle } from "lucide-react";

export default function CourierDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [courier, setCourier] = useState<any>(null);
  const [ack, setAck] = useState<any>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchCourier = async () => {
      const { data: c } = await supabase.from("couriers").select("*, courier_vendors(name)").eq("id", id).single();
      if (c) {
        const { data: p } = await supabase.from("profiles").select("full_name").eq("user_id", c.assigned_to).single();
        setCourier({ ...c, assigned_name: p?.full_name || "Unknown" });
      }
    };
    fetchCourier();
    supabase.from("courier_acknowledgements").select("*").eq("courier_id", id).maybeSingle().then(({ data }) => setAck(data));
  }, [id]);

  const handleAcknowledge = async (signatureData: string) => {
    if (!user || !id) return;
    setSubmitting(true);
    const { error } = await supabase.from("courier_acknowledgements").insert({
      courier_id: id,
      acknowledged_by: user.id,
      signature_data: signatureData,
    });
    if (error) { toast.error("Failed to acknowledge"); setSubmitting(false); return; }
    await supabase.from("couriers").update({ status: "collected" as any }).eq("id", id);
    toast.success("Parcel acknowledged");
    setShowSignature(false);
    // Reload
    const fetchUpdated = async () => {
      const { data: c } = await supabase.from("couriers").select("*, courier_vendors(name)").eq("id", id).single();
      if (c) {
        const { data: p } = await supabase.from("profiles").select("full_name").eq("user_id", c.assigned_to).single();
        setCourier({ ...c, assigned_name: p?.full_name || "Unknown" });
      }
    };
    fetchUpdated();
    supabase.from("courier_acknowledgements").select("*").eq("courier_id", id).maybeSingle().then(({ data }) => setAck(data));
    setSubmitting(false);
  };

  if (!courier) return <p className="text-muted-foreground p-4">Loading...</p>;

  const isAssigned = user?.id === courier.assigned_to;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Courier Detail</h2>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Tracking #:</span><p className="font-medium">{courier.tracking_number}</p></div>
            <div><span className="text-muted-foreground">Vendor:</span><p className="font-medium">{(courier.courier_vendors as any)?.name}</p></div>
            <div><span className="text-muted-foreground">Assigned to:</span><p className="font-medium">{courier.assigned_name}</p></div>
            <div><span className="text-muted-foreground">Status:</span>
              <Badge variant={courier.status === "collected" ? "default" : "secondary"} className="capitalize mt-1">
                {courier.status.replace("_", " ")}
              </Badge>
            </div>
            <div><span className="text-muted-foreground">Created:</span><p>{new Date(courier.created_at).toLocaleString()}</p></div>
          </div>
          {courier.slip_image_url && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Courier Slip:</p>
              <img src={courier.slip_image_url} alt="Courier slip" className="max-w-sm rounded-lg border" />
            </div>
          )}
        </CardContent>
      </Card>

      {ack ? (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckCircle className="h-5 w-5 text-success" />Acknowledged</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Acknowledged at: {new Date(ack.acknowledged_at).toLocaleString()}</p>
            <img src={ack.signature_data} alt="Signature" className="max-w-[200px] border rounded" />
          </CardContent>
        </Card>
      ) : isAssigned && courier.status !== "collected" ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Acknowledge Parcel</CardTitle></CardHeader>
          <CardContent>
            {showSignature ? (
              <SignatureCanvas onSave={handleAcknowledge} />
            ) : (
              <Button onClick={() => setShowSignature(true)}>Acknowledge & Sign</Button>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
