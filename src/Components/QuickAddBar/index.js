import React, { useState } from "react";
import { Button, Input } from "antd";

function QuickAddBar({ onQuickAdd, onOpenSms, onOpenScanner }) {
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim()) return;
    onQuickAdd(text.trim());
    setText("");
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        alignItems: "center",
        width: "100%",
        padding: "1rem 2rem",
        flexWrap: "wrap",
      }}
    >
      <div className="input-flex" style={{ flex: 1, minWidth: "260px" }}>
        <input
          value={text}
          aria-label="Describe a transaction"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder='Quick add… "500 lunch at KFC yesterday"'
        />
      </div>
      <Button className="btn btn-blue" onClick={submit} disabled={!text.trim()}>
        Quick add
      </Button>
      <Button className="btn" onClick={onOpenSms}>
        Add from SMS
      </Button>
      <Button className="btn" onClick={onOpenScanner}>
        Scan receipt
      </Button>
    </div>
  );
}

export default QuickAddBar;