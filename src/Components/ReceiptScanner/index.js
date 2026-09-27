import React, { useRef, useState } from "react";
import { Button, Modal, Progress, Spin } from "antd";
import { toast } from "react-toastify";
import { createWorker } from "tesseract.js";
import { extractTotal, extractMerchant } from "../../utils/receiptExtractor";

function ReceiptScanner({ open, onClose, onScanned }) {
  const inputRef = useRef(null);
  const [phase, setPhase] = useState("idle"); // idle | scanning | done
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  function reset() {
    setPhase("idle");
    setProgress(0);
    setResult(null);
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    runOcr(file);
  }

  async function runOcr(file) {
    setPhase("scanning");
    setProgress(0);
    let data = null;
    try {
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round((m.progress || 0) * 100));
          }
        },
      });
      data = await worker.recognize(file);
      await worker.terminate();
    } catch (err) {
      toast.error("OCR failed. Check your connection and try again.");
      setPhase("idle");
      setProgress(0);
      return;
    }

    const text = data && data.data ? data.data.text : "";
    const amount = extractTotal(text);
    const merchant = extractMerchant(text);

    if (amount == null) {
      toast.warn("Could not read a total amount from this receipt. Try a clearer photo.");
      setPhase("idle");
      setProgress(0);
      return;
    }

    setResult({ amount, merchant });
    setPhase("done");
  }

  function confirmResult() {
    if (!result) return;
    onScanned({ imageFile, amount: result.amount, merchant: result.merchant });
    reset();
    onClose();
  }

  return (
    <Modal
      title="Scan Receipt (OCR)"
      open={open}
      onCancel={() => {
        reset();
        onClose();
      }}
      footer={
        phase === "done"
          ? [
              <Button key="again" onClick={reset}>
                Scan another
              </Button>,
              <Button key="use" type="primary" className="btn btn-blue" onClick={confirmResult}>
                Use extracted values
              </Button>,
            ]
          : [
              <Button key="close" onClick={onClose}>
                Close
              </Button>,
            ]
      }
    >
      {phase === "idle" && (
        <div style={{ textAlign: "center" }}>
          <p>Upload a receipt photo. On mobile you can take a photo directly.</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleFileChange}
            id="receipt-input"
          />
          <label htmlFor="receipt-input" className="btn btn-blue" style={{ cursor: "pointer" }}>
            Choose / Take photo
          </label>
        </div>
      )}

      {phase === "scanning" && (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <Spin />
          <p>Reading receipt…</p>
          <Progress percent={progress} />
        </div>
      )}

      {phase === "done" && (
        <div>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="receipt preview"
              style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 6, marginBottom: 12 }}
            />
          )}
          <p>
            <b>Total:</b> {result.amount}
            {result.merchant ? (
              <>
                <br />
                <b>Merchant:</b> {result.merchant}
              </>
            ) : null}
          </p>
        </div>
      )}
    </Modal>
  );
}

export default ReceiptScanner;