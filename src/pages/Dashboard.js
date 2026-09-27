import React, { useEffect, useRef, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '../firebase';
import { Alert, Col, Modal, Row } from 'antd';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import Header from '../Components/Header';
import Cards from '../Components/Cards';
import AddExpenseModal from '../Components/Modals/addExpense';
import AddIncomeModal from '../Components/Modals/addIncome';
import { addDoc, collection, deleteDoc, getDocs, query, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import dayjs from '../utils/dayjs';
import TransactionsTable from '../Components/Modals/TransactionsTable';
import calculateBalance from '../utils/calculateBalance';
import { parseNaturalLanguage } from '../utils/parseNaturalLanguage';
import QuickAddBar from '../Components/QuickAddBar';
import SmsParser from '../Components/SmsParser';
import ReceiptScanner from '../Components/ReceiptScanner';
import MoneyAssistant from '../Components/MoneyAssistant';
import BudgetCard from '../Components/BudgetCard';
import {
  addPendingTransaction,
  clearPendingTransactions,
  getPendingTransactions,
  removePendingTransaction,
} from '../offlineQueue';

function Dashboard() {
  const [user, loading, error] = useAuthState(auth);
  const userRef = useRef(user);
  const [transactions, setTransactions] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  const [expensePrefill, setExpensePrefill] = useState(null);
  const [incomePrefill, setIncomePrefill] = useState(null);
  const [receiptImage, setReceiptImage] = useState(null);
  const [smsOpen, setSmsOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [currentBalance, setCurrentBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Recalculate the displayed balance whenever transactions change.
  useEffect(() => {
    const result = calculateBalance(transactions);
    setIncome(result.income);
    setExpenses(result.expenses);
    setCurrentBalance(result.currentBalance);
  }, [transactions]);

  // Offline / online listeners + load the local queue once.
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    loadPendingTransactions();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchBudgets();
    }
  }, [user]);

  async function loadPendingTransactions() {
    const rows = await getPendingTransactions();
    setPendingTransactions(
      rows.map((row) => ({ id: row.id, pendingSync: true, ...row.transaction }))
    );
  }

  async function handleOnline() {
    setIsOnline(true);
    await flushPendingQueue();
  }

  function handleOffline() {
    setIsOnline(false);
  }

  async function flushPendingQueue() {
    const uid = userRef.current && userRef.current.uid;
    if (!uid || !navigator.onLine) return;
    const rows = await getPendingTransactions();
    if (rows.length === 0) return;
    let synced = 0;
    for (const row of rows) {
      try {
        await addDoc(collection(db, `users/${uid}/transactions`), row.transaction);
        await removePendingTransaction(row.id);
        synced += 1;
      } catch (e) {
        // Leave it queued for the next retry.
      }
    }
    if (synced > 0) {
      toast.success(`${synced} offline transaction${synced > 1 ? 's' : ''} synced.`);
      loadPendingTransactions();
      fetchTransactions();
    }
  }

  async function uploadReceipt(txDocRef, imageFile) {
    const fileRef = storageRef(storage, `users/${user.uid}/receipts/${txDocRef.id}.jpg`);
    await uploadBytes(fileRef, imageFile);
    const url = await getDownloadURL(fileRef);
    await updateDoc(txDocRef, { receiptURL: url });
  }

  async function addTransaction(transaction, imageFile) {
    if (!navigator.onLine) {
      await addPendingTransaction(transaction);
      await loadPendingTransactions();
      toast.warn("Offline — saved locally. It'll sync when you're back online.");
      if (imageFile) {
        toast.info('Receipt photo was not attached (offline).');
      }
      return;
    }
    try {
      const txDocRef = await addDoc(
        collection(db, `users/${user.uid}/transactions`),
        transaction
      );
      if (imageFile) {
        try {
          await uploadReceipt(txDocRef, imageFile);
        } catch (e) {
          toast.warn("Transaction saved, but the receipt photo couldn't be uploaded.");
        }
      }
      toast.success('Transaction Added!');
      setTransactions((prev) => [...prev, transaction]);
    } catch (e) {
      toast.error("Couldn't add transaction");
    }
  }

  function onFinish(values, type) {
    const newTransaction = {
      type: type,
      date: values.date.format('YYYY-MM-DD'),
      amount: parseFloat(values.amount),
      tag: values.tag,
      name: values.name,
    };
    const imageFile = type === 'expense' ? receiptImage : null;
    addTransaction(newTransaction, imageFile);
    setExpensePrefill(null);
    setIncomePrefill(null);
    setReceiptImage(null);
  }

  function openPrefilledModal(parsed) {
    if (parsed.type === 'income') {
      setIncomePrefill(parsed);
      setIsIncomeModalVisible(true);
    } else {
      setExpensePrefill(parsed);
      setIsExpenseModalVisible(true);
    }
  }

  function handleQuickAdd(text) {
    const parsed = parseNaturalLanguage(text);
    if (!parsed.success) {
      toast.error('Could not understand that. Try something like "500 lunch at KFC yesterday".');
      return;
    }
    openPrefilledModal(parsed);
  }

  function handleSmsParsed(result) {
    openPrefilledModal(result);
  }

  function handleScanned({ imageFile, amount, merchant }) {
    setReceiptImage(imageFile);
    openPrefilledModal({
      type: 'expense',
      name: merchant || 'Receipt',
      amount,
      tag: undefined,
      date: dayjs().format('YYYY-MM-DD'),
    });
  }

  function reset() {
    Modal.confirm({
      title: 'Delete all transactions?',
      content: "This removes every transaction from your account. It can't be undone.",
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const q = query(collection(db, `users/${user.uid}/transactions`));
          const querySnapshot = await getDocs(q);
          await Promise.all(
            querySnapshot.docs.map((docRef) => deleteDoc(docRef.ref))
          );
          await clearPendingTransactions();
          setTransactions([]);
          setPendingTransactions([]);
          toast.success('All transactions deleted.');
        } catch (e) {
          toast.error("Couldn't delete transactions");
        }
      },
    });
  }

  async function fetchTransactions() {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/transactions`));
    const querySnapshot = await getDocs(q);
    let transactionsArray = [];
    querySnapshot.forEach((doc) => {
      transactionsArray.push(doc.data());
    });
    setTransactions(transactionsArray);
  }

  async function fetchBudgets() {
    if (!user) return;
    const month = dayjs().format('YYYY-MM');
    const snapshot = await getDocs(collection(db, `users/${user.uid}/budgets`));
    const monthBudgets = snapshot.docs
      .map((d) => ({ category: d.id, ...d.data() }))
      .filter((b) => b.month === month);
    setBudgets(monthBudgets);
  }

  const allTransactions = [...pendingTransactions, ...transactions];

  const showExpenseModal = () => {
    setIsExpenseModalVisible(true);
  };

  const showIncomeModal = () => {
    setIsIncomeModalVisible(true);
  };

  const handleExpenseCancel = () => {
    setExpensePrefill(null);
    setReceiptImage(null);
    setIsExpenseModalVisible(false);
  };

  const handleIncomeCancel = () => {
    setIncomePrefill(null);
    setIsIncomeModalVisible(false);
  };

  if (loading) {
    return <p className="page-note">Loading...</p>;
  }

  if (error) {
    return <p className="page-note">Error: {error.message}</p>;
  }

  if (!user) {
    return <p className="page-note">Please log in to view your dashboard.</p>;
  }

  return (
    <div>
      <Header />
      {!isOnline && (
        <Alert
          banner
          type="warning"
          message="You're offline — transactions are saved locally and will sync automatically when you're back online."
          style={{ position: 'sticky', top: 64, zIndex: 999 }}
        />
      )}
      <Cards
        currentBalance={currentBalance}
        income={income}
        expenses={expenses}
        showExpenseModal={showExpenseModal}
        showIncomeModal={showIncomeModal}
        reset={reset}
      />
      {budgets.length > 0 && (
        <Row gutter={[16, 16]} style={{ padding: '0 2rem', marginBottom: '0.5rem' }}>
          {budgets.map((b) => (
            <Col xs={24} sm={12} md={8} lg={6} key={b.category}>
              <BudgetCard
                category={b.category}
                limit={b.limit}
                month={dayjs().format('YYYY-MM')}
                transactions={allTransactions}
              />
            </Col>
          ))}
        </Row>
      )}
      <QuickAddBar
        onQuickAdd={handleQuickAdd}
        onOpenSms={() => setSmsOpen(true)}
        onOpenScanner={() => setScannerOpen(true)}
      />
      <AddExpenseModal
        isExpenseModalVisible={isExpenseModalVisible}
        handleExpenseCancel={handleExpenseCancel}
        onFinish={onFinish}
        prefill={expensePrefill}
      />
      <AddIncomeModal
        isIncomeModalVisible={isIncomeModalVisible}
        handleIncomeCancel={handleIncomeCancel}
        onFinish={onFinish}
        prefill={incomePrefill}
      />
      <SmsParser open={smsOpen} onClose={() => setSmsOpen(false)} onParsed={handleSmsParsed} />
      <ReceiptScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={handleScanned}
      />
      <TransactionsTable
        transactions={allTransactions}
        user={user}
        onTransactionsChanged={fetchTransactions}
      />
      <MoneyAssistant transactions={allTransactions} />
    </div>
  );
}

export default Dashboard;
