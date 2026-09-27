import { Image, Radio, Select, Table, Tag } from "antd";
import React, { useMemo, useState } from "react";
import searchimg from "../TransactionsTable/assets/search.svg";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { toast } from "react-toastify";
import "./styles.css";

const CSV_HEADER = ["name", "type", "amount", "date", "tag"];

function formatMoney(value) {
  const n = Number(value) || 0;
  return Math.round(n).toLocaleString();
}

function balanceMap(transactions) {
  const map = new Map();
  const sorted = [...transactions].sort((a, b) => {
    const dateDiff = (a.date || "").localeCompare(b.date || "");
    if (dateDiff !== 0) return dateDiff;
    const nameDiff = (a.name || "").localeCompare(b.name || "");
    if (nameDiff !== 0) return nameDiff;
    return (Number(a.amount) || 0) - (Number(b.amount) || 0);
  });
  let running = 0;
  for (const t of sorted) {
    const amount = Number(t.amount) || 0;
    running += t.type === "income" ? amount : -amount;
    map.set(t, running);
  }
  return map;
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function buildTransactionFromRow(row) {
  const [name, type, amount, date, tag] = row;
  if (!name || !type || !date) return null;
  if (type !== "income" && type !== "expense") return null;
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return {
    name: name.trim(),
    type,
    amount: numericAmount,
    date,
    tag: (tag || "").trim(),
  };
}

function TransactionsTable({ transactions, user, onTransactionsChanged }) {
  const { Option } = Select;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortKey, setSortKey] = useState("");

  const tillBalances = useMemo(() => balanceMap(transactions), [transactions]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <div>
          <div className="tx-name">{record.name || "Untitled"}</div>
          {record.tag && <div className="tx-meta">{record.tag}</div>}
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (_, record) => {
        const isIncome = record.type === "income";
        return (
          <span
            className={`tx-amount ${isIncome ? "tx-amount--in" : "tx-amount--out"}`}
          >
            {isIncome ? "+" : "−"}৳{formatMoney(record.amount)}
          </span>
        );
      },
    },
    {
      title: "Till",
      key: "till",
      render: (_, record) => (
        <span className="tx-till">
          <span className="tx-till-label">Balance</span>
          ৳{formatMoney(tillBalances.get(record))}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Receipt",
      key: "receipt",
      render: (_, record) =>
        record.receiptURL ? (
          <Image
            src={record.receiptURL}
            alt="receipt"
            width={36}
            height={36}
            style={{ objectFit: "cover", borderRadius: 6 }}
          />
        ) : (
          <span className="tx-receipt-empty">—</span>
        ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) =>
        record.pendingSync ? (
          <Tag color="warning">pending sync</Tag>
        ) : (
          <Tag color="success">synced</Tag>
        ),
    },
  ];

  let filteredTransactions = transactions.filter(
    (item) =>
      (item.name || "").toLowerCase().includes(search.toLowerCase()) &&
      (typeFilter ? (item.type || "").includes(typeFilter) : true)
  );
  let sortedTransactions = filteredTransactions.sort((a, b) => {
    if (sortKey === "date") {
      return new Date(a.date) - new Date(b.date);
    } else if (sortKey === "amount") {
      return a.amount - b.amount;
    } else {
      return 0;
    }
  });

  function exportToCsv() {
    if (sortedTransactions.length === 0) {
      toast.info("No transactions to export.");
      return;
    }
    const rows = sortedTransactions.map((t) =>
      [t.name, t.type, t.amount, t.date, t.tag].map(csvEscape).join(",")
    );
    const csv = [CSV_HEADER.map(csvEscape).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transactions.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importFromCsv(file) {
    if (!user) {
      toast.error("Please log in to import transactions.");
      return;
    }
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
      if (lines.length === 0) {
        toast.warn("CSV file is empty.");
        return;
      }

      // Skip a header row if present (matches our export format).
      const firstLine = lines[0].toLowerCase();
      const dataLines =
        firstLine.includes("name") || firstLine.includes("type")
          ? lines.slice(1)
          : lines;

      let validCount = 0;
      let invalidCount = 0;
      let writeErrors = 0;

      for (const line of dataLines) {
        const row = parseCsvLine(line);
        const transaction = buildTransactionFromRow(row);
        if (!transaction) {
          invalidCount += 1;
          continue;
        }
        try {
          await addDoc(
            collection(db, `users/${user.uid}/transactions`),
            transaction
          );
          validCount += 1;
        } catch (e) {
          writeErrors += 1;
        }
      }

      const summary = [
        `Imported ${validCount} transaction${validCount === 1 ? "" : "s"}.`,
        invalidCount > 0
          ? `${invalidCount} invalid row${invalidCount === 1 ? "" : "s"} skipped.`
          : "",
        writeErrors > 0
          ? `${writeErrors} write${writeErrors === 1 ? "" : "s"} failed.`
          : "",
      ]
        .filter(Boolean)
        .join(" ");

      if (validCount > 0) {
        toast.success(summary);
        if (onTransactionsChanged) onTransactionsChanged();
      } else {
        toast.warn(summary || "No transactions imported.");
      }
    } catch (e) {
      toast.error("Could not import CSV file.");
    }
  }

  function handleCsvFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
      importFromCsv(file);
    }
    e.target.value = "";
  }

  return (
    <div 
    style={{
      width: "100%",
      padding: "0rem 2rem",
    }} 
    >
    
    <div 
    style={{
      display: "flex",
      justifyContent: "space-between",
      gap: "1rem",
      alignItems: "center",
      marginBottom: "1rem",
    }}
    >
    
    <div className="input-flex">
  <img src={searchimg} width="16" alt="" />
  <input
        value={search}
        aria-label="Search transactions by name"
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name"
      />
</div>
      <Select
        className="select-input"
        onChange={(value) => setTypeFilter(value)}
        value={typeFilter}
        placeholder="Filter"
        allowClear
      >
        <Option value="">All</Option>
        <Option value="income">Income</Option>
        <Option value="expense">Expense</Option>
      </Select>
      </div>
      <div className="my-table">
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      marginBottom: "1rem",
      flexWrap: "wrap",
      gap: "0.75rem",
    }}
  >
    <h2>My Transactions</h2>
    <Radio.Group
      className="input-radio"
      onChange={(e) => setSortKey(e.target.value)}
      value={sortKey}
    >
      <Radio.Button value="">No sort</Radio.Button>
      <Radio.Button value="date">By date</Radio.Button>
      <Radio.Button value="amount">By amount</Radio.Button>
    </Radio.Group>
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      gap: "0.75rem",
      width: "100%",
      maxWidth: "400px",
    }}
  >
    <button className="btn" onClick={exportToCsv}>
      Export to CSV
    </button>
    <label htmlFor="file-csv" className="btn btn-blue">
      Import from CSV
    </label>
    <input
    id="file-csv"
    type="file"
    accept=".csv"
    required
    style={{display: "none"}}
    onChange={handleCsvFileChange}
    />
  </div>
</div>
      <Table
        rowKey={(record, index) =>
          (record && (record.id || record.key)) || index
        }
        dataSource={sortedTransactions}
        columns={columns}
        locale={{ emptyText: "No transactions to show." }}
      />
      </div>
    </div>
  );
}

export default TransactionsTable;