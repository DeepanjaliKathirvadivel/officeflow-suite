import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Save, Send } from "lucide-react";
import type { ParsedBillData } from "./OcrProcessor";

interface BillFormProps {
  parsedData: ParsedBillData | null;
  onSaveDraft: (data: BillFormData) => void;
  onSubmit: (data: BillFormData) => void;
  loading?: boolean;
}

export interface BillFormData {
  vendorName: string;
  billNumber: string;
  billDate: string;
  totalAmount: string;
  gstNumber: string;
  department: string;
  ocrText: string;
}

export default function BillForm({ parsedData, onSaveDraft, onSubmit, loading }: BillFormProps) {
  const [formData, setFormData] = useState<BillFormData>({
    vendorName: "",
    billNumber: "",
    billDate: "",
    totalAmount: "",
    gstNumber: "",
    department: "",
    ocrText: "",
  });

  useEffect(() => {
    if (parsedData) {
      setFormData((prev) => ({
        ...prev,
        vendorName: parsedData.vendorName || prev.vendorName,
        billNumber: parsedData.billNumber || prev.billNumber,
        billDate: parsedData.billDate || prev.billDate,
        totalAmount: parsedData.totalAmount || prev.totalAmount,
        gstNumber: parsedData.gstNumber || prev.gstNumber,
        ocrText: parsedData.rawText,
      }));
    }
  }, [parsedData]);

  const update = (field: keyof BillFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bill Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vendorName">Vendor Name</Label>
            <Input
              id="vendorName"
              value={formData.vendorName}
              onChange={(e) => update("vendorName", e.target.value)}
              placeholder="Vendor / Supplier name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billNumber">Bill Number</Label>
            <Input
              id="billNumber"
              value={formData.billNumber}
              onChange={(e) => update("billNumber", e.target.value)}
              placeholder="INV-001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billDate">Bill Date</Label>
            <Input
              id="billDate"
              type="date"
              value={formData.billDate}
              onChange={(e) => update("billDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalAmount">Total Amount (₹)</Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              value={formData.totalAmount}
              onChange={(e) => update("totalAmount", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gstNumber">GST Number</Label>
            <Input
              id="gstNumber"
              value={formData.gstNumber}
              onChange={(e) => update("gstNumber", e.target.value)}
              placeholder="22AAAAA0000A1Z5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => update("department", e.target.value)}
              placeholder="IT / Admin / Marketing"
            />
          </div>
        </div>

        {formData.ocrText && (
          <div className="space-y-2">
            <Label>Extracted OCR Text</Label>
            <Textarea
              value={formData.ocrText}
              readOnly
              rows={4}
              className="text-xs font-mono bg-muted"
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onSaveDraft(formData)}
            disabled={loading}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => onSubmit(formData)}
            disabled={loading || !formData.vendorName || !formData.totalAmount}
          >
            <Send className="mr-2 h-4 w-4" />
            Submit for Approval
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
