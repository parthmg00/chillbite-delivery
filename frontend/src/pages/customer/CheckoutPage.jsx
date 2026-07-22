import {
  useContext,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { CartContext } from "../../context/CartContext";
import { createOrder } from "../../services/orderService";

const getProductImage = (item) => {
  const product = item.product || item;

  if (typeof product.image === "string") {
    return product.image;
  }

  if (
    Array.isArray(product.images) &&
    product.images.length > 0
  ) {
    const firstImage = product.images[0];

    if (typeof firstImage === "string") {
      return firstImage;
    }

    return firstImage?.url || "";
  }

  const imageMap = {
    "Diet Coke": "/products/diet-coke.jpg",
    "Thums Up": "/products/thums-up.jpg",
    "Seven Up": "/products/seven-up.jpg",
    "Nutella Waffle":
      "/products/nutella-waffle.jpg",
    "Magnum Classic Ice Cream":
      "/products/magnum.jpg",
  };

  return imageMap[product.name] || "";
};

const getFinalPrice = (item) => {
  const product = item.product || item;

  if (item.finalPrice !== undefined) {
    return Number(item.finalPrice);
  }

  if (product.finalPrice !== undefined) {
    return Number(product.finalPrice);
  }

  const price = Number(product.price) || 0;
  const discount =
    Number(product.discountPercentage) || 0;

  return Math.round(
    price - (price * discount) / 100
  );
};

function CheckoutPage() {
  const navigate = useNavigate();

  const cartContext =
    useContext(CartContext) || {};

  const cartItems =
    cartContext.cartItems ||
    cartContext.cart ||
    cartContext.items ||
    [];

  const clearCart =
    cartContext.clearCart ||
    cartContext.emptyCart ||
    (() => {});

  const [formData, setFormData] =
    useState({
      fullName: "",
      phone: "",
      alternatePhone: "",
      addressLine: "",
      landmark: "",
      city: "",
      state: "Maharashtra",
      postalCode: "",
      addressType: "home",
      paymentMethod:
        "cash-on-delivery",
      customerNote: "",
    });

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) => {
        const quantity =
          Number(item.quantity) || 1;

        return (
          total +
          getFinalPrice(item) * quantity
        );
      },
      0
    );
  }, [cartItems]);

  const deliveryCharge =
    subtotal >= 499 ? 0 : 40;

  const totalAmount =
    subtotal + deliveryCharge;

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      "fullName",
      "phone",
      "addressLine",
      "city",
      "state",
      "postalCode",
    ];

    const missingField =
      requiredFields.find(
        (field) =>
          !formData[field]?.trim()
      );

    if (missingField) {
      return "Please fill all required address fields.";
    }

    if (
      !/^[0-9]{10}$/.test(
        formData.phone.trim()
      )
    ) {
      return "Enter a valid 10-digit phone number.";
    }

    if (
      !/^[0-9]{6}$/.test(
        formData.postalCode.trim()
      )
    ) {
      return "Enter a valid 6-digit postal code.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (cartItems.length === 0) {
      setError(
        "Your cart is empty. Add products before checkout."
      );

      return;
    }

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem(
        "authToken"
      ) ||
      localStorage.getItem(
        "accessToken"
      );

    if (!token) {
      navigate("/login", {
        state: {
          from: "/checkout",
          message:
            "Please login before placing your order.",
        },
      });

      return;
    }

    const items = cartItems.map(
      (item) => {
        const product =
          item.product || item;

        return {
          product:
            product._id ||
            product.id ||
            item.productId,

          quantity:
            Number(item.quantity) || 1,
        };
      }
    );

    const invalidItem = items.find(
      (item) => !item.product
    );

    if (invalidItem) {
      setError(
        "One of the cart products does not have a valid product ID."
      );

      return;
    }

    const orderData = {
      items,

      shippingAddress: {
        fullName:
          formData.fullName.trim(),

        phone:
          formData.phone.trim(),

        alternatePhone:
          formData.alternatePhone.trim(),

        addressLine:
          formData.addressLine.trim(),

        landmark:
          formData.landmark.trim(),

        city:
          formData.city.trim(),

        state:
          formData.state.trim(),

        postalCode:
          formData.postalCode.trim(),

        addressType:
          formData.addressType,
      },

      paymentMethod:
        formData.paymentMethod,

      customerNote:
        formData.customerNote.trim(),

      couponCode: "",
    };

    try {
      setIsSubmitting(true);

      const result =
        await createOrder(orderData);

      if (!result.success) {
        throw new Error(
          result.message ||
            "Order could not be placed."
        );
      }

      clearCart();

      localStorage.setItem(
        "latestOrder",
        JSON.stringify(result.order)
      );

      navigate("/order-success", {
        state: {
          order: result.order,
        },
      });
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to place your order."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="checkout-page page-container">
        <section className="checkout-empty-state">
          <div className="checkout-empty-icon">
            🛒
          </div>

          <h1>Your cart is empty</h1>

          <p>
            Add some delicious products before
            continuing to checkout.
          </p>

          <Link
            to="/"
            className="primary-button"
          >
            Explore Products
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page page-container">
      <div className="checkout-heading">
        <div>
          <span className="checkout-label">
            Secure checkout
          </span>

          <h1>Complete Your Order</h1>

          <p>
            Add your delivery details and choose
            a payment method.
          </p>
        </div>
      </div>

      <div className="checkout-layout">
        <form
          className="checkout-form"
          onSubmit={handleSubmit}
        >
          <section className="checkout-card">
            <div className="checkout-card-heading">
              <span>1</span>

              <div>
                <h2>Delivery Address</h2>

                <p>
                  Where should we deliver your
                  order?
                </p>
              </div>
            </div>

            <div className="checkout-form-grid">
              <label className="checkout-field">
                <span>Full name *</span>

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Parth Gandhi"
                  autoComplete="name"
                />
              </label>

              <label className="checkout-field">
                <span>Phone number *</span>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  maxLength="10"
                  autoComplete="tel"
                />
              </label>

              <label className="checkout-field">
                <span>
                  Alternate phone
                </span>

                <input
                  type="tel"
                  name="alternatePhone"
                  value={
                    formData.alternatePhone
                  }
                  onChange={handleChange}
                  placeholder="Optional"
                  maxLength="10"
                />
              </label>

              <label className="checkout-field checkout-field-full">
                <span>Complete address *</span>

                <textarea
                  name="addressLine"
                  value={
                    formData.addressLine
                  }
                  onChange={handleChange}
                  placeholder="House number, building, road and area"
                  rows="3"
                />
              </label>

              <label className="checkout-field checkout-field-full">
                <span>Landmark</span>

                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  placeholder="Near bus stand, hospital, school..."
                />
              </label>

              <label className="checkout-field">
                <span>City *</span>

                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Mahad"
                />
              </label>

              <label className="checkout-field">
                <span>State *</span>

                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                />
              </label>

              <label className="checkout-field">
                <span>Postal code *</span>

                <input
                  type="text"
                  name="postalCode"
                  value={
                    formData.postalCode
                  }
                  onChange={handleChange}
                  placeholder="402301"
                  maxLength="6"
                  inputMode="numeric"
                />
              </label>

              <label className="checkout-field">
                <span>Address type</span>

                <select
                  name="addressType"
                  value={
                    formData.addressType
                  }
                  onChange={handleChange}
                >
                  <option value="home">
                    Home
                  </option>

                  <option value="work">
                    Work
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </label>
            </div>
          </section>

          <section className="checkout-card">
            <div className="checkout-card-heading">
              <span>2</span>

              <div>
                <h2>Payment Method</h2>

                <p>
                  Select how you want to pay.
                </p>
              </div>
            </div>

            <div className="payment-options">
              <label
                className={`payment-option ${
                  formData.paymentMethod ===
                  "cash-on-delivery"
                    ? "payment-option-active"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash-on-delivery"
                  checked={
                    formData.paymentMethod ===
                    "cash-on-delivery"
                  }
                  onChange={handleChange}
                />

                <div>
                  <strong>
                    Cash on Delivery
                  </strong>

                  <span>
                    Pay when the order reaches
                    you.
                  </span>
                </div>
              </label>

              <label
                className={`payment-option ${
                  formData.paymentMethod ===
                  "upi"
                    ? "payment-option-active"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={
                    formData.paymentMethod ===
                    "upi"
                  }
                  onChange={handleChange}
                />

                <div>
                  <strong>UPI</strong>

                  <span>
                    Payment integration will be
                    added later.
                  </span>
                </div>
              </label>

              <label
                className={`payment-option ${
                  formData.paymentMethod ===
                  "card"
                    ? "payment-option-active"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={
                    formData.paymentMethod ===
                    "card"
                  }
                  onChange={handleChange}
                />

                <div>
                  <strong>
                    Debit or Credit Card
                  </strong>

                  <span>
                    Payment integration will be
                    added later.
                  </span>
                </div>
              </label>
            </div>
          </section>

          <section className="checkout-card">
            <div className="checkout-card-heading">
              <span>3</span>

              <div>
                <h2>Delivery Note</h2>

                <p>
                  Add optional instructions for
                  delivery.
                </p>
              </div>
            </div>

            <label className="checkout-field">
              <textarea
                name="customerNote"
                value={
                  formData.customerNote
                }
                onChange={handleChange}
                placeholder="Example: Please deliver chilled."
                rows="3"
                maxLength="500"
              />
            </label>
          </section>

          {error && (
            <div className="checkout-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="place-order-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Placing Order..."
              : `Place Order • ₹${totalAmount}`}
          </button>
        </form>

        <aside className="checkout-summary">
          <section className="checkout-card checkout-summary-card">
            <h2>Order Summary</h2>

            <div className="checkout-items">
              {cartItems.map(
                (item, index) => {
                  const product =
                    item.product || item;

                  const quantity =
                    Number(
                      item.quantity
                    ) || 1;

                  const price =
                    getFinalPrice(item);

                  const productId =
                    product._id ||
                    product.id ||
                    index;

                  return (
                    <article
                      className="checkout-item"
                      key={productId}
                    >
                      <div className="checkout-item-image">
                        {getProductImage(
                          item
                        ) ? (
                          <img
                            src={getProductImage(
                              item
                            )}
                            alt={
                              product.name
                            }
                          />
                        ) : (
                          <span>🍦</span>
                        )}
                      </div>

                      <div className="checkout-item-info">
                        <h3>
                          {product.name}
                        </h3>

                        <p>
                          Qty: {quantity}
                        </p>
                      </div>

                      <strong>
                        ₹
                        {price *
                          quantity}
                      </strong>
                    </article>
                  );
                }
              )}
            </div>

            <div className="checkout-price-list">
              <div>
                <span>Subtotal</span>
                <strong>
                  ₹{subtotal}
                </strong>
              </div>

              <div>
                <span>
                  Delivery charge
                </span>

                <strong>
                  {deliveryCharge === 0
                    ? "FREE"
                    : `₹${deliveryCharge}`}
                </strong>
              </div>

              <div className="checkout-total">
                <span>Total</span>

                <strong>
                  ₹{totalAmount}
                </strong>
              </div>
            </div>

            {subtotal < 499 && (
              <p className="free-delivery-message">
                Add ₹{499 - subtotal} more to get
                free delivery.
              </p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

export default CheckoutPage;