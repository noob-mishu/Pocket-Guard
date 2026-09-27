import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { Button, Card, Form, Input, Modal, Row } from "antd";
import { toast } from "react-toastify";
import Header from "../Components/Header";
import { auth, db } from "../firebase";
import { addDoc, collection, getDocs, setDoc, doc } from "firebase/firestore";

function Groups() {
  const [user, loading, error] = useAuthState(auth);
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const myEmail = user && user.email;

  async function fetchGroups() {
    if (!myEmail) return;
    const snapshot = await getDocs(collection(db, "groups"));
    const mine = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(
        (g) => g.createdBy === myEmail || (g.memberEmails || []).includes(myEmail)
      );
    setGroups(mine);
  }

  useEffect(() => {
    if (myEmail) fetchGroups();
  }, [myEmail]);

  async function createGroup(values) {
    const members = String(values.memberEmails || "")
      .split(/[\n,]/)
      .map((m) => m.trim().toLowerCase())
      .filter(Boolean);
    if (!members.includes(myEmail)) members.unshift(myEmail);
    try {
      const groupRef = await addDoc(collection(db, "groups"), {
        name: values.name,
        memberEmails: [...new Set(members)],
        createdBy: myEmail,
        createdAt: Date.now(),
      });
      // Also create the creator's member profile doc so Group Detail can show names.
      await setDoc(doc(db, "groups", groupRef.id, "members", myEmail.replace(/[^a-z0-9]/gi, "_")), {
        email: myEmail,
        name: user.displayName || user.email,
      });
      toast.success("Group created!");
      setModalOpen(false);
      form.resetFields();
      fetchGroups();
    } catch (e) {
      toast.error("Couldn't create group");
    }
  }

  if (loading) return <p className="page-note">Loading...</p>;
  if (!user) return <p className="page-note">Please log in to view groups.</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <Header />
      <div style={{ padding: "1rem 2rem" }}>
        <Row justify="space-between" align="middle">
          <h1>Groups</h1>
          <Button className="btn btn-blue" onClick={() => setModalOpen(true)}>
            Create Group
          </Button>
        </Row>
        <Row gutter={[16, 16]}>
          {groups.length === 0 && <p style={{ paddingLeft: 4 }}>You are not in any groups yet.</p>}
          {groups.map((group) => (
            <Card
              key={group.id}
              className="my-card"
              hoverable
              style={{ width: 260 }}
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <h3 style={{ margin: 0 }}>{group.name}</h3>
              <p style={{ margin: 0, color: "var(--muted)" }}>
                {(group.memberEmails || []).length} member{(group.memberEmails || []).length === 1 ? "" : "s"}
              </p>
            </Card>
          ))}
        </Row>
      </div>

      <Modal
        title="Create Group"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Create"
      >
        <Form form={form} layout="vertical" onFinish={createGroup}>
          <Form.Item label="Group name" name="name" rules={[{ required: true, message: "Group name is required" }]}>
            <Input placeholder="Weekend trip 2026" />
          </Form.Item>
          <Form.Item label="Member emails (one per line)" name="memberEmails">
            <Input.TextArea
              rows={4}
              placeholder={`You (${myEmail || "your email"}) are added automatically.\nfriend@example.com\n...`}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Groups;