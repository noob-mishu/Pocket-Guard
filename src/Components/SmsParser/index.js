import React, { useState } from "react";
import { Button, Modal, Input } from "antd";
import { toast } from "react-toastify";
import { parseSms } from "../../utils/parseSms";

function SmsParser({ open, onClose, onParsed }) {
  const [smsText, setSmsText] = useState("");

  function handleParse() {
    const result = parseSms(smsText);
    if (!result.success) {
      toast.error(
        "Couldn't read this SMS. Try a bKash / Nagad / Rocket transaction message, or enter it manually."
      );
      return;
    }
    toast.success(
      `Parsed ${result.provider} ${result.type === "income" ? "income" : "payment"} of Tk ${result.amount}. Please confirm below.`
    );
    onParsed(result);
    setSmsText("");
    onClose();
  }

  return (
    <Modal
      title="Quick Add from SMS"
      open={open}
      onCancel={() => {
        setSmsText("");
        onClose();
      }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="parse"
          type="primary"
          className="btn btn-blue"
          onClick={handleParse}
          disabled={!smsText.trim()}
        >
          Parse SMS
        </Button>,
      ]}
    >
      <p style={{ marginTop: 0 }}>
        Paste a bKash / Nagad / Rocket transaction SMS below. We&apos;ll extract
        the amount, type, merchant and transaction ID for you to confirm.
      </p>
      <Input.TextArea
        rows={4}
        value={smsText}
        onChange={(e) => setSmsText(e.target.value)}
        placeholder="e.g. You have received Tk 500.00 from 01712345678. TrxID 9H4G8F2D1A5B"
      />
    </Modal>
  );
}

export default SmsParser;