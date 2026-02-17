import { useState } from "react";
import { createWorker } from "tesseract.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, ScanText } from "lucide-react";

export interface ParsedBillData {
  vendorName: string;
  billNumber: string;
  billDate: string;
  totalAmount: string;
  gstNumber: string;
  rawText: string;
}

function parseBillText(text: string): ParsedBillData {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Vendor name: typically first non-empty meaningful line
  const vendorName = lines[0] || "";

  // Bill/Invoice number
  const billNumMatch = text.match(/(?:bill|invoice|inv|receipt)\s*(?:no|number|#|:)\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i);
  const billNumber = billNumMatch?.[1] || "";

  // Date
  const dateMatch = text.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/);
  const billDate = dateMatch?.[1] || "";

  // Total amount
  const amountMatch = text.match(/(?:total|amount|grand\s*total|net\s*amount|payable)\s*[:\-]?\s*[₹$]?\s*([\d,]+\.?\d*)/i);
  const totalAmount = amountMatch?.[1]?.replace(/,/g, "") || "";

  // GST number
  const gstMatch = text.match(/\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2})\b/);
  const gstNumber = gstMatch?.[1] || "";

  return { vendorName, billNumber, billDate, totalAmount, gstNumber, rawText: text };
}

interface OcrProcessorProps {
  imageUrl: string | null;
  onParsed: (data: ParsedBillData) => void;
}

export default function OcrProcessor({ imageUrl, onParsed }: OcrProcessorProps) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const runOcr = async () => {
    if (!imageUrl) return;
    setProcessing(true);
    setProgress(0);

    try {
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      const { data: { text } } = await worker.recognize(imageUrl);
      await worker.terminate();

      const parsed = parseBillText(text);
      onParsed(parsed);
    } catch (err) {
      console.error("OCR failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (!imageUrl) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">OCR Processing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {processing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting text from bill...
            </div>
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">{progress}% complete</p>
          </div>
        ) : (
          <Button onClick={runOcr} className="w-full">
            <ScanText className="mr-2 h-4 w-4" />
            Extract Bill Data (OCR)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
