import "./styles.css";
import { Card, Row } from "antd";
import Button from "../Button";

function Cards({
    currentBalance,
    income,
    expenses,
    showExpenseModal,
    showIncomeModal,
    reset
  }) {
    return (
        <div>
            <Row className="my-row">
                <Card bordered={true} className="my-card">
                    <h2>Current Balance</h2>
                    <p>${currentBalance}</p>
                    <Button text="Reset Balance" blue={true} onClick={reset} />
                </Card>

                <Card bordered={true} className="my-card">
                    <h2>Total Income</h2>
                    <p>${income}</p>
                    <Button text="Add Income" blue={true} onClick={showIncomeModal} />
                </Card>

                <Card bordered={true} className="my-card">
                    <h2>Total Expenses</h2>
                    <p>${expenses}</p>
                    <Button text="Add Expense" blue={true} onClick={showExpenseModal} />
                </Card>
            </Row>
        </div>
    );
}

export default Cards;
