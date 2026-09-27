import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Table,
  Tag,
} from "antd";
import { toast } from "react-toastify";
import dayjs from "../utils/dayjs";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import Header from "../Components/Header";
import { auth, db } from "../firebase";
import {
  computeBalances,
  minTransfers,
} from "../utils/groupsUtils";

function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [expenseModal, setExpenseModal] = useState(false);
  const [form] = Form.useForm();

  const myEmail = user && user.email;
  const members = (group && group.memberEmails) || [];
  const signedUpMembers = members.filter((m) => m !== myEmail);

  async function fetchData() {
    const groupDoc = await getDoc(doc(db, "groups", groupId));
    if (!groupDoc.exists()) {
      toast.error("Group not found.");
      navigate("/groups");
      return;
    }
    setGroup({ id: groupDoc.id, ...groupDoc.data() });

    const expSnap = await getDocs(collection(db, "groups", groupId, "expenses"));
    setExpenses(expSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

    const settSnap = await getDocs(collection(db, "groups", groupId, "settlements"));
    setSettlements(settSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  useEffect(() => {
    if (user) fetchData();
  }, [user, groupId]);

  async function addExpense(values) {
    const transaction = {
      description: values.description,
      amount: parseFloat(values.amount),
      paidBy: values.paidBy,
      splitBetween: values.splitBetween || members,
      date: values.date.format("YYYY-MM-DD"),
      createdAt: Date.now(),
      createdBy: myEmail,
    };
    try {
      await addDoc(collection(db, "groups", groupId, "expenses"), transaction);
      toast.success("Group expense added!");
      setExpenseModal(false);
      form.resetFields();
      fetchData();
    } catch (e) {
      toast.error("Couldn't add group expense");
    }
  }

  if (loading) return <p className="page-note">Loading...</p>;
  if (!user) return <p className="page-note">Please log in to view groups.</p>;
  if (!group) return <p>Loading group…</p>;

  const balances = computeBalances(expenses, settlements, members);
  const balancesOverview = members.map((m) => ({
    email: m,
    owes: (balances.get(m) || 0) < 0 ? -(balances.get(m) || 0) : 0,
    isOwed: (balances.get(m) || 0) > 0 ? balances.get(m) || 0 : 0,
  }));
  const transfers = minTransfers(balances);

  async function settleUp() {
    const plan = minTransfers(balances);
    if (plan.length === 0) {
      toast.info("Nothing to settle up — balances are already even.");
      return;
    }
    try {
      for (const transfer of plan) {
        await addDoc(collection(db, "groups", groupId, "settlements"), {
          from: transfer.from,
          to: transfer.to,
          amount: transfer.amount,
          date: dayjs().format("YYYY-MM-DD"),
          createdAt: Date.now(),
        });
      }
      toast.success("Settlements recorded — group is now even!");
      form.resetFields();
      fetchData();
    } catch (e) {
      toast.error("Couldn't record settlements");
    }
  }

  const expenseColumns = [
    { title: "Description", dataIndex: "description" },
    { title: "Amount", dataIndex: "amount", render: (v) => "৳" + v },
    { title: "Paid by", dataIndex: "paidBy" },
    { title: "Split between", dataIndex: "splitBetween", render: (list) => (list || []).map((m) => <Tag key={m}>{m}</Tag>) },
    { title: "Date", dataIndex: "date" },
  ];

  const settlementColumns = [
    { title: "From", dataIndex: "from" },
    { title: "To", dataIndex: "to" },
    { title: "Amount", dataIndex: "amount", render: (v) => "৳" + v },
    { title: "Date", dataIndex: "date" },
  ];

  return (
    <div>
      <Header />
      <div style={{ padding: "1rem 2rem" }}>
        <Button onClick={() => navigate("/groups")}>← Back</Button>
        <Row justify="space-between" align="middle">
          <h1>{group.name}</h1>
          <Button className="btn btn-blue" onClick={() => setExpenseModal(true)}>
            Add Group Expense
          </Button>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <Card className="my-card" title="Group expenses">
              <Table
                rowKey="id"
                columns={expenseColumns}
                dataSource={expenses}
                pagination={expenses.length > 5 ? { pageSize: 5 } : false}
              />
            </Card>
          </Col>
          <Col xs={24} md={10}>
            <Card
              className="my-card"
              title="Settlements"
              extra={
                <Button type="primary" size="small" className="btn btn-blue" onClick={settleUp}>
                  Settle Up
                </Button>
              }
            >
              <Table
                rowKey="id"
                columns={settlementColumns}
                dataSource={settlements}
                pagination={false}
                locale={{ emptyText: "No settlements yet." }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card className="my-card" title="Who owes what (balances)">
              <Table
                rowKey="email"
                pagination={false}
                columns={[
                  { title: "Member", dataIndex: "email" },
                  { title: "Owes", dataIndex: "owes", render: (v) => (v ? "৳" + v : 0) },
                  { title: "Is owed", dataIndex: "isOwed", render: (v) => (v ? "৳" + v : 0) },
                ]}
                dataSource={balancesOverview}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card className="my-card" title="Simplified settlement plan">
              <Table
                rowKey={(r) => `${r.from}-${r.to}`}
                pagination={false}
                columns={[
                  { title: "From", render: (_, r) => (r.from === myEmail ? "You" : r.from) },
                  { title: "To", render: (_, r) => (r.to === myEmail ? "You" : r.to) },
                  { title: "Amount", dataIndex: "amount", render: (v) => "৳" + v },
                ]}
                dataSource={transfers}
                locale={{
                  emptyText:
                    "Everyone is settled up! Nice. 🎉",
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Modal
        title="Add group expense"
        open={expenseModal}
        onCancel={() => setExpenseModal(false)}
        onOk={() => form.submit()}
        okText="Add"
      >
        <Form form={form} layout="vertical" onFinish={addExpense}>
          <Form.Item label="Description" name="description" rules={[{ required: true, message: "Description required" }]}>
            <Input placeholder="Dinner at Sizzling"> </Input>
          </Form.Item>
          <Form.Item label="Amount" name="amount" rules={[{ required: true, message: "Amount required" }]}>
            <Input type="number" placeholder="1500" />
          </Form.Item>
          <Form.Item label="Paid by" name="paidBy" rules={[{ required: true, message: "Who paid?" }]}>
            <Select>
              {[...members].map((m, index) => (
                <Select.Option key={m + index} value={m}>
                  {m === myEmail ? "You" : m}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Split between (who was part of it?)" name="splitBetween" initialValue={members}>
            <Select mode="multiple">
              {[...members].map((m, index) => (
                <Select.Option key={m + index} value={m}>
                  {m === myEmail ? "You" : m}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Date" name="date" rules={[{ required: true, message: "Date required" }]}>
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default GroupDetail;