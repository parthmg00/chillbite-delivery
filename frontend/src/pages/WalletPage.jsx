import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosInstance from "../api/axiosInstance.js";
import { useAuth } from "../context/AuthContext.jsx";

function WalletPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuth();

  const [walletBalance, setWalletBalance] = useState(
    Number(user?.walletBalance || 0)
  );

  const [transactions, setTransactions] = useState([]);

  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [upiId, setUpiId] = useState("");
  const [cardLastFour, setCardLastFour] = useState("");

  const [loading, setLoading] = useState(true);
  const [addingMoney, setAddingMoney] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const quickAmounts = [100, 200, 500, 1000, 2000];

  const finalAddAmount = useMemo(() => {
    if (customAmount !== "") {
      return Number(customAmount);
    }

    return Number(selectedAmount);
  }, [customAmount, selectedAmount]);

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getToken = () =>
    localStorage.getItem("chillbite-token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  const loadWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get("/wallet");
      const responseData = response.data;

      const balance = Number(
        responseData?.walletBalance ??
          responseData?.balance ??
          responseData?.data?.walletBalance ??
          responseData?.data?.balance ??
          0
      );

      const transactionList =
        responseData?.transactions ||
        responseData?.data?.transactions ||
        [];

      setWalletBalance(balance);

      setTransactions(
        Array.isArray(transactionList) ? transactionList : []
      );

      if (typeof updateUser === "function") {
        updateUser({
          walletBalance: balance,
        });
      }
    } catch (requestError) {
      console.error("Wallet load error:", requestError);

      setError(
        requestError.response?.data?.message ||
          "Wallet details load nahi hui."
      );
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: {
          from: "/wallet",
        },
      });

      return;
    }

    loadWallet();
  }, [isAuthenticated, loadWallet, navigate]);

  useEffect(() => {
    setWalletBalance(Number(user?.walletBalance || 0));
  }, [user?.walletBalance]);

  const handleQuickAmount = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    setError("");
    setSuccessMessage("");
  };

  const handleCustomAmountChange = (event) => {
    const value = event.target.value;

    if (value === "") {
      setCustomAmount("");
      return;
    }

    if (!/^\d+$/.test(value)) {
      return;
    }

    setCustomAmount(value);
    setError("");
    setSuccessMessage("");
  };

  const validateAddMoney = () => {
    if (!Number.isFinite(finalAddAmount) || finalAddAmount <= 0) {
      return "Valid amount enter karo.";
    }

    if (finalAddAmount < 10) {
      return "Minimum ₹10 add kar sakte ho.";
    }

    if (finalAddAmount > 10000) {
      return "Maximum ₹10,000 ek transaction me add kar sakte ho.";
    }

    if (
      !["razorpay", "gpay", "phonepe", "upi", "card"].includes(
        paymentMethod
      )
    ) {
      return "Payment method select karo.";
    }

    if (paymentMethod === "upi") {
      const cleanUpiId = upiId.trim();

      if (!cleanUpiId || !cleanUpiId.includes("@")) {
        return "Valid UPI ID enter karo, jaise name@upi.";
      }
    }

    if (paymentMethod === "card") {
      if (!/^\d{4}$/.test(cardLastFour.trim())) {
        return "Card ke last 4 digits enter karo.";
      }
    }

    return "";
  };

  // Razorpay checkout popup kholta hai wallet top-up ke liye
  const startRazorpayTopUp = (amount) => {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const token = getToken();

          const { data } = await axiosInstance.post(
            "/payment/create-order",
            { amount, receipt: `wallet_${Date.now()}` },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (!data?.success) {
            throw new Error("Payment order create nahi hua.");
          }

          const options = {
            key: data.keyId,
            amount: data.amount,
            currency: data.currency,
            name: "ChillBite",
            description: "Wallet Top-up",
            order_id: data.razorpayOrderId,

            handler: async function (response) {
              try {
                const verifyRes = await axiosInstance.post(
                  "/payment/verify-wallet",
                  {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    amount,
                  },
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                if (verifyRes.data?.success) {
                  resolve(verifyRes.data);
                } else {
                  reject(new Error("Payment verify nahi hui."));
                }
              } catch (verifyError) {
                reject(verifyError);
              }
            },

            modal: {
              ondismiss: function () {
                reject(new Error("Payment cancel kar diya gaya."));
              },
            },

            prefill: {
              name: user?.name || "",
              contact: user?.phone || "",
            },

            theme: {
              color: "#ff4d4f",
            },
          };

          if (!window.Razorpay) {
            throw new Error(
              "Razorpay script load nahi hui. Page refresh karke try karo."
            );
          }

          const razorpayInstance = new window.Razorpay(options);
          razorpayInstance.open();
        } catch (setupError) {
          reject(setupError);
        }
      })();
    });
  };

  const handleAddMoney = async () => {
    setError("");
    setSuccessMessage("");

    const validationError = validateAddMoney();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setAddingMoney(true);

      // Razorpay se real payment
      if (paymentMethod === "razorpay") {
        const result = await startRazorpayTopUp(finalAddAmount);

        const updatedBalance = Number(
          result?.walletBalance ?? result?.balance ?? walletBalance + finalAddAmount
        );

        setWalletBalance(updatedBalance);

        if (result?.transaction) {
          setTransactions((currentTransactions) => [
            result.transaction,
            ...currentTransactions,
          ]);
        } else {
          await loadWallet();
        }

        if (typeof updateUser === "function") {
          updateUser({
            walletBalance: updatedBalance,
          });
        }

        setSelectedAmount(500);
        setCustomAmount("");

        setSuccessMessage(
          `₹${finalAddAmount.toFixed(
            2
          )} successfully ChillBite Wallet me add hua.`
        );

        return;
      }

      // Purana demo flow (GPay/PhonePe/UPI/Card)
      const requestData = {
        amount: finalAddAmount,
        paymentMethod,
      };

      if (paymentMethod === "upi") {
        requestData.upiId = upiId.trim();
      }

      if (paymentMethod === "card") {
        requestData.cardLastFour = cardLastFour.trim();
      }

      const response = await axiosInstance.post(
        "/wallet/add-money",
        requestData
      );

      const responseData = response.data;

      const updatedBalance = Number(
        responseData?.walletBalance ??
          responseData?.balance ??
          responseData?.data?.walletBalance ??
          responseData?.data?.balance ??
          walletBalance + finalAddAmount
      );

      const newTransaction =
        responseData?.transaction ||
        responseData?.data?.transaction ||
        null;

      setWalletBalance(updatedBalance);

      if (newTransaction) {
        setTransactions((currentTransactions) => [
          newTransaction,
          ...currentTransactions,
        ]);
      } else {
        await loadWallet();
      }

      if (typeof updateUser === "function") {
        updateUser({
          walletBalance: updatedBalance,
        });
      }

      setSelectedAmount(500);
      setCustomAmount("");
      setUpiId("");
      setCardLastFour("");

      setSuccessMessage(
        `₹${finalAddAmount.toFixed(
          2
        )} successfully ChillBite Wallet me add hua.`
      );
    } catch (requestError) {
      console.error("Add wallet money error:", requestError);

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Wallet me money add nahi hua. Please try again."
      );
    } finally {
      setAddingMoney(false);
    }
  };

  if (loading) {
    return (
      <main style={styles.centerPage}>
        <div style={styles.statusCard}>
          <h2>Wallet loading...</h2>
          <p>Balance aur transactions fetch ho rahe hain.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headingRow}>
          <div>
            <p style={styles.eyebrow}>CHILLBITE PAY</p>
            <h1 style={styles.pageTitle}>My Wallet</h1>
            <p style={styles.mutedText}>
              Wallet balance manage karo aur transactions track karo.
            </p>
          </div>

          <button
            type="button"
            onClick={loadWallet}
            style={styles.outlineButton}
          >
            Refresh
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {successMessage && (
          <div style={styles.successBox}>{successMessage}</div>
        )}

        <div style={styles.grid}>
          <section style={styles.balanceCard}>
            <p style={styles.balanceLabel}>Available Balance</p>

            <h2 style={styles.balanceAmount}>
              ₹{formatAmount(walletBalance)}
            </h2>

            <div style={styles.divider} />

            <p>
              Account Holder:{" "}
              <strong>{user?.name || "ChillBite Customer"}</strong>
            </p>
          </section>

          <section style={styles.card}>
            <p style={styles.eyebrow}>ADD MONEY</p>
            <h2>Recharge your wallet</h2>

            <div style={styles.amountGrid}>
              {quickAmounts.map((amount) => {
                const selected =
                  customAmount === "" &&
                  Number(selectedAmount) === amount;

                return (
                  <button
                    type="button"
                    key={amount}
                    onClick={() => handleQuickAmount(amount)}
                    style={{
                      ...styles.amountButton,
                      ...(selected ? styles.selectedButton : {}),
                    }}
                  >
                    ₹{amount}
                  </button>
                );
              })}
            </div>

            <label style={styles.label}>
              Custom Amount

              <input
                type="text"
                inputMode="numeric"
                value={customAmount}
                onChange={handleCustomAmountChange}
                placeholder="Enter amount"
                maxLength={5}
                style={styles.input}
              />
            </label>

            <h3 style={styles.paymentHeading}>Payment Method</h3>

            <div style={styles.paymentGrid}>
              <PaymentOption
                value="razorpay"
                label="Pay Online (Razorpay)"
                selected={paymentMethod}
                onChange={setPaymentMethod}
              />

              <PaymentOption
                value="gpay"
                label="Google Pay"
                selected={paymentMethod}
                onChange={setPaymentMethod}
              />

              <PaymentOption
                value="phonepe"
                label="PhonePe"
                selected={paymentMethod}
                onChange={setPaymentMethod}
              />

              <PaymentOption
                value="upi"
                label="UPI"
                selected={paymentMethod}
                onChange={setPaymentMethod}
              />

              <PaymentOption
                value="card"
                label="Card"
                selected={paymentMethod}
                onChange={setPaymentMethod}
              />
            </div>

            {paymentMethod === "upi" && (
              <label style={styles.label}>
                UPI ID

                <input
                  type="text"
                  value={upiId}
                  onChange={(event) => setUpiId(event.target.value)}
                  placeholder="example@upi"
                  style={styles.input}
                />
              </label>
            )}

            {paymentMethod === "card" && (
              <label style={styles.label}>
                Card Last 4 Digits

                <input
                  type="text"
                  inputMode="numeric"
                  value={cardLastFour}
                  onChange={(event) => {
                    const value = event.target.value;

                    if (value === "" || /^\d{0,4}$/.test(value)) {
                      setCardLastFour(value);
                    }
                  }}
                  placeholder="1234"
                  maxLength={4}
                  style={styles.input}
                />
              </label>
            )}

            <button
              type="button"
              onClick={handleAddMoney}
              disabled={addingMoney}
              style={{
                ...styles.primaryButton,
                opacity: addingMoney ? 0.65 : 1,
              }}
            >
              {addingMoney
                ? paymentMethod === "razorpay"
                  ? "Opening Payment..."
                  : "Adding Money..."
                : `Add ₹${formatAmount(finalAddAmount)}`}
            </button>

            <p style={styles.demoText}>
              {paymentMethod === "razorpay"
                ? "🔒 Secure payment via Razorpay."
                : "Demo payment hai. Real payment gateway connected nahi hai."}
            </p>
          </section>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={() => navigate("/products")}
            style={styles.actionButton}
          >
            Order Food
          </button>

          <button
            type="button"
            onClick={() => navigate("/my-orders")}
            style={styles.actionButton}
          >
            My Orders
          </button>
        </div>

        <section style={styles.transactionsCard}>
          <div style={styles.headingRow}>
            <div>
              <p style={styles.eyebrow}>WALLET ACTIVITY</p>
              <h2>Transaction History</h2>
            </div>

            <strong>{transactions.length} transactions</strong>
          </div>

          {transactions.length === 0 ? (
            <p style={styles.mutedText}>No transactions yet.</p>
          ) : (
            transactions.map((transaction, index) => {
              const isCredit =
                String(transaction?.type || "").toLowerCase() ===
                "credit";

              return (
                <article
                  key={
                    transaction?._id ||
                    transaction?.id ||
                    `${transaction?.createdAt}-${index}`
                  }
                  style={styles.transactionRow}
                >
                  <div>
                    <strong>
                      {transaction?.reason ||
                        (isCredit
                          ? "Money added to wallet"
                          : "Wallet payment")}
                    </strong>

                    <p style={styles.smallText}>
                      {formatDate(transaction?.createdAt)}
                    </p>
                  </div>

                  <div style={styles.transactionRight}>
                    <strong
                      style={{
                        color: isCredit ? "#059669" : "#dc2626",
                      }}
                    >
                      {isCredit ? "+" : "-"}₹
                      {formatAmount(transaction?.amount)}
                    </strong>

                    <small>
                      Balance ₹
                      {formatAmount(
                        transaction?.balanceAfterTransaction
                      )}
                    </small>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}

function PaymentOption({
  value,
  label,
  selected,
  onChange,
}) {
  const checked = selected === value;

  return (
    <label
      style={{
        ...styles.paymentOption,
        ...(checked ? styles.selectedPayment : {}),
      }}
    >
      <input
        type="radio"
        name="paymentMethod"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
      />

      <span>{label}</span>
    </label>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px 70px",
    background: "#fff8f5",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    maxWidth: "1150px",
    margin: "0 auto",
  },

  centerPage: {
    minHeight: "80vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff8f5",
    fontFamily: "Arial, sans-serif",
  },

  statusCard: {
    padding: "35px",
    borderRadius: "18px",
    background: "#ffffff",
    textAlign: "center",
    boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
  },

  headingRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "24px",
  },

  eyebrow: {
    margin: "0 0 7px",
    color: "#ff4d4f",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "1.3px",
  },

  pageTitle: {
    margin: "0 0 8px",
    color: "#1f2937",
    fontSize: "38px",
  },

  mutedText: {
    color: "#6b7280",
    lineHeight: "1.6",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "25px",
  },

  balanceCard: {
    minHeight: "300px",
    padding: "32px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, #ff4d4f, #ff7a45)",
    color: "#ffffff",
    boxSizing: "border-box",
  },

  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "700",
  },

  balanceAmount: {
    margin: "15px 0",
    fontSize: "43px",
  },

  divider: {
    height: "1px",
    margin: "100px 0 20px",
    background: "rgba(255,255,255,0.3)",
  },

  card: {
    padding: "30px",
    borderRadius: "22px",
    background: "#ffffff",
    boxShadow: "0 15px 40px rgba(0,0,0,0.07)",
  },

  amountGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(70px, 1fr))",
    gap: "9px",
    margin: "20px 0",
  },

  amountButton: {
    padding: "11px 5px",
    border: "1px solid #e5e7eb",
    borderRadius: "9px",
    background: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  selectedButton: {
    borderColor: "#ff4d4f",
    background: "#fff1f2",
    color: "#ff4d4f",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "17px",
    color: "#374151",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    outline: "none",
    fontSize: "15px",
  },

  paymentHeading: {
    marginTop: "22px",
    color: "#1f2937",
  },

  paymentGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "10px",
    marginBottom: "18px",
  },

  paymentOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "13px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    cursor: "pointer",
  },

  selectedPayment: {
    borderColor: "#ff4d4f",
    background: "#fff1f2",
  },

  primaryButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "900",
    cursor: "pointer",
  },

  outlineButton: {
    padding: "11px 17px",
    border: "1px solid #ff4d4f",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#ff4d4f",
    fontWeight: "800",
    cursor: "pointer",
  },

  errorBox: {
    marginBottom: "20px",
    padding: "14px",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#dc2626",
    fontWeight: "700",
  },

  successBox: {
    marginBottom: "20px",
    padding: "14px",
    border: "1px solid #a7f3d0",
    borderRadius: "10px",
    background: "#ecfdf5",
    color: "#047857",
    fontWeight: "700",
  },

  demoText: {
    color: "#9ca3af",
    fontSize: "12px",
    textAlign: "center",
  },

  actions: {
    display: "flex",
    gap: "15px",
    margin: "25px 0",
  },

  actionButton: {
    flex: 1,
    padding: "15px",
    border: "1px solid #eeeeee",
    borderRadius: "12px",
    background: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  transactionsCard: {
    padding: "28px",
    borderRadius: "20px",
    background: "#ffffff",
    boxShadow: "0 14px 38px rgba(0,0,0,0.06)",
  },

  transactionRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    padding: "16px 0",
    borderBottom: "1px solid #eeeeee",
  },

  transactionRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "5px",
  },

  smallText: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "12px",
  },
};

export default WalletPage;