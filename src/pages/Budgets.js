import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Button, Card, Col, Form, Input, Modal, Row, Select, Table } from "antd";
import { toast } from "react-toastify";
import dayjs from "../utils/dayjs";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import Header from "../Components/Header";
import BudgetCard from "../Components/BudgetCard";
import { auth, db } from "../firebase";
import { EXPENSE_TAGS } from "../utils/tags";

function Budgets() {
  const [user, loading] = useAuthState(auth);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const month = dayjs().format("YYYY-MM");

  async function fetchData() {
    if (!user) return;
    const budgetSnapshot = await getDocs(collection(db, `users/${user.uid}/budgets`));
    setBudgets(
      budgetSnapshot.docs
        .map((d) => ({ category: d.id, ...d.data() }))
        .filter((b) => b.month === month)
    );

    const txSnapshot = await getDocs(collection(db, `users/${user.uid}/transactions`));
    setTransactions(txSnapshot.docs.map((d) => d.data()));
  }

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  async function addBudget(values) {
    try {
      await addDoc(collection(db, `users/${user.uid}/budgets`), {
        category: values.category,
        limit: parseFloat(values.limit),
        month,
      });
      toast.success("Budget added!");
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (e) {
      toast.error("Couldn't add budget");
    }
  }

  async function removeBudget(category) {
    try {
      const snapshot = await getDocs(collection(db, `users/${user.uid}/budgets`));
      const target = snapshot.docs.find(
        (d) => d.id === category && d.data().month === month
      );
      const fallback = snapshot.docs.find(
        (d) => d.data().month === month && d.data().category === category
      );
      const toDelete = target || fallback;
      if (toDelete) {
        await deleteDoc(doc(db, `users/${user.uid}/budgets`, toDelete.id));
        toast.success("Budget removed");
        fetchData();
      }
    } catch (e) {
      toast.error("Couldn't remove budget");
    }
  }

  if (loading) return <p className="page-note">Loading...</p>;
  if (!user) return <p className="page-note">Please log in to view budgets.</p>;

  const columns = [
    { title: "Category", dataIndex: "category", render: (c) => c.charAt(0).toUpperCase() + c.slice(1) },
    { title: "Monthly limit", dataIndex: "limit", render: (v) => "৳" + v },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Button danger size="small" onClick={() => removeBudget(record.category)}>
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Header />
      <div style={{ padding: "1rem 2rem" }}>
        <Row justify="space-between" align="middle">
          <h1>Budgets — {dayjs().format("MMMM YYYY")}</h1>
          <Button className="btn btn-blue" onClick={() => setModalOpen(true)}>
            Add Budget
          </Button>
        </Row>

        {budgets.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {budgets.map((b) => (
              <Col xs={24} sm={12} md={8} lg={6} key={b.category}>
                <BudgetCard
                  category={b.category}
                  limit={b.limit}
                  month={month}
                  transactions={transactions}
                />
              </Col>
            ))}
          </Row>
        )}

        <Card className="my-card">
          <Table rowKey="category" columns={columns} dataSource={budgets} pagination={false} />
        </Card>
      </div>

      <Modal
        title="Add a monthly budget"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Add"
      >
        <Form form={form} layout="vertical" onFinish={addBudget}>
          <Form.Item label="Category" name="category" rules={[{ required: true, message: "Pick a category" }]}>
            <Select>
              {EXPENSE_TAGS.map((t) => (
                <Select.Option key={t.value} value={t.value}>
                  {t.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Monthly limit (৳)" name="limit" rules={[{ required: true, message: "Enter a limit" }]}>
            <Input type="number" placeholder="5000" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Budgets;