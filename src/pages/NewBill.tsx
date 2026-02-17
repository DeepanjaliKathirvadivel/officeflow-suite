import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import BillCapture from "@/components/bills/BillCapture";
import OcrProcessor, { type ParsedBillData } from "@/components/bills/OcrProcessor";
import BillForm, { type BillFormData } from "@/components/bills/BillForm";

export default function NewBill() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedBillData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageCaptured = (f: File, url: string) => {
    setFile(f);
    setPreviewUrl(url);
    setParsedData(null);
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file || !user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("bill-files").upload(path, file);
    if (error) {
      toast.error("File upload failed: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("bill-files").getPublicUrl(path);
    return data.publicUrl;
  };

  const saveBill = async (formData: BillFormData, status: "draft" | "pending") => {
    if (!user) return;
    setLoading(true);
    try {
      const fileUrl = await uploadFile();

      const { data: bill, error } = await supabase
        .from("bills")
        .insert({
          submitted_by: user.id,
          vendor_name: formData.vendorName,
          bill_number: formData.billNumber,
          bill_date: formData.billDate || null,
          total_amount: parseFloat(formData.totalAmount) || 0,
          gst_number: formData.gstNumber,
          department: formData.department,
          file_url: fileUrl || "",
          ocr_text: formData.ocrText,
          status,
        })
        .select()
        .single();

      if (error) throw error;

      if (status === "pending" && bill) {
        await createApprovalWorkflow(bill.id, parseFloat(formData.totalAmount) || 0);
      }

      toast.success(status === "draft" ? "Bill saved as draft" : "Bill submitted for approval");
      navigate("/bills");
    } catch (err: any) {
      toast.error(err.message || "Failed to save bill");
    } finally {
      setLoading(false);
    }
  };

  const createApprovalWorkflow = async (billId: string, amount: number) => {
    const { data: rules } = await supabase
      .from("workflow_rules")
      .select("*")
      .lte("min_amount", amount)
      .order("min_amount");

    const matchingRule = rules?.find(
      (r) => amount >= Number(r.min_amount) && (r.max_amount === null || amount <= Number(r.max_amount))
    );

    if (!matchingRule) return;

    const levels = matchingRule.approval_levels as string[];
    type RoleType = "reception" | "accounts" | "manager" | "md" | "admin" | "employee" | "it_team";

    for (let i = 0; i < levels.length; i++) {
      // Find a user with the required role for this level
      const role = levels[i] as RoleType;
      const { data: roleUsers } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", role)
        .limit(1);

      if (roleUsers && roleUsers.length > 0) {
        await supabase.from("bill_approvals").insert({
          bill_id: billId,
          approver_id: roleUsers[0].user_id,
          approval_level: i + 1,
          status: i === 0 ? "pending" : "draft",
        });
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">New Expense Bill</h2>
      <BillCapture onImageCaptured={handleImageCaptured} />
      <OcrProcessor imageUrl={previewUrl} onParsed={setParsedData} />
      <BillForm
        parsedData={parsedData}
        onSaveDraft={(data) => saveBill(data, "draft")}
        onSubmit={(data) => saveBill(data, "pending")}
        loading={loading}
      />
    </div>
  );
}
