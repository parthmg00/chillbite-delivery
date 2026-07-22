import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

function ProductCard({ product }) {
  const navigate = useNavigate();

  const { addToCart } = useCart();

  const {
    isInWishlist,
    toggleWishlist,
  } = useWishlist();

  const price =
    Number(product?.price) || 0;

  const discount =
    Number(
      product?.discountPercentage
    ) || 0;

  const finalPrice = Math.round(
    price -
      (price * discount) / 100
  );

  const identifier =
    product?.slug || product?._id;

  const getProductImage = () => {
    const name =
      product?.name?.toLowerCase() ||
      "";

    const slug =
      product?.slug?.toLowerCase() ||
      "";

    const brand =
      product?.brand?.toLowerCase() ||
      "";

    const searchText =
      `${name} ${slug} ${brand}`;

    if (
      searchText.includes(
        "diet coke"
      ) ||
      searchText.includes(
        "diet-coke"
      )
    ) {
      return "/products/diet-coke.jpg";
    }

    if (
      searchText.includes(
        "thums up"
      ) ||
      searchText.includes(
        "thums-up"
      ) ||
      searchText.includes(
        "thumbs up"
      )
    ) {
      return "/products/thums-up.jpg";
    }

    if (
      searchText.includes("7up") ||
      searchText.includes("7-up") ||
      searchText.includes(
        "seven up"
      ) ||
      searchText.includes(
        "seven-up"
      )
    ) {
      return "/products/seven-up.jpg";
    }

    if (
      searchText.includes(
        "nutella"
      ) &&
      searchText.includes("waffle")
    ) {
      return "/products/nutella-waffle.jpg";
    }

    if (
      searchText.includes("magnum")
    ) {
      return "/products/magnum.jpg";
    }

    return (
      product?.images?.[0]?.url ||
      `https://placehold.co/600x600/fff3e8/1f2937?text=${encodeURIComponent(
        product?.name ||
          "ChillBite"
      )}`
    );
  };

  const imageUrl =
    getProductImage();

  const isUnavailable =
    Number(product?.stock) <= 0 ||
    product?.isAvailable === false;

  const productWithImage = {
    ...product,
    images: [
      {
        publicId:
          product?.images?.[0]
            ?.publicId ||
          product?.slug ||
          product?._id ||
          "product-image",
        url: imageUrl,
      },
    ],
  };

  const wished =
    isInWishlist(product?._id);

  const handleWishlist = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    toggleWishlist(
      productWithImage
    );
  };

  const handleAddToCart = () => {
    if (isUnavailable) {
      return;
    }

    addToCart(
      productWithImage,
      1
    );
  };

  const handleBuyNow = () => {
    if (isUnavailable) {
      return;
    }

    addToCart(
      productWithImage,
      1
    );

    navigate("/checkout");
  };

  return (
    <article className="premium-product-card">
      <div className="product-image-wrapper">
        <Link
          to={`/products/${identifier}`}
          className="product-image-link"
        >
          <img
            src={imageUrl}
            alt={
              product?.name ||
              "Product"
            }
            className="premium-product-image"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror =
                null;

              event.currentTarget.src =
                "https://placehold.co/600x600/fff3e8/1f2937?text=ChillBite";
            }}
          />
        </Link>

        <button
          type="button"
          className={
            wished
              ? "wishlist-heart-button wishlist-heart-active"
              : "wishlist-heart-button"
          }
          aria-label={
            wished
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          title={
            wished
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          onClick={
            handleWishlist
          }
        >
          {wished ? "♥" : "♡"}
        </button>

        {discount > 0 && (
          <span className="offer-badge">
            {discount}% OFF
          </span>
        )}

        {product?.isBestSeller && (
          <span className="best-seller-badge">
            Best Seller
          </span>
        )}
      </div>

      <div className="premium-product-content">
        <span className="premium-category">
          {product?.category ||
            "Food"}
        </span>

        <Link
          to={`/products/${identifier}`}
          className="product-name-link"
        >
          <h3>
            {product?.name}
          </h3>
        </Link>

        <p className="premium-description">
          {product?.shortDescription ||
            product?.description ||
            "Fresh and delicious product delivered to your doorstep."}
        </p>

        <div className="premium-meta">
          <span>
            ⏱{" "}
            {product?.preparationTime ||
              15}{" "}
            min
          </span>

          <span
            className={
              isUnavailable
                ? "product-out-stock"
                : "product-in-stock"
            }
          >
            {isUnavailable
              ? "Out of stock"
              : "In stock"}
          </span>
        </div>

        <div className="premium-price">
          <strong>
            ₹{finalPrice}
          </strong>

          {discount > 0 && (
            <>
              <span className="old-price">
                ₹
                {Math.round(
                  price
                )}
              </span>

              <span className="discount-text">
                {discount}% OFF
              </span>
            </>
          )}
        </div>

        <div className="product-actions-three">
          <Link
            to={`/products/${identifier}`}
            className="details-button"
          >
            Details
          </Link>

          <button
            type="button"
            className="add-button"
            disabled={
              isUnavailable
            }
            onClick={
              handleAddToCart
            }
          >
            {isUnavailable
              ? "Unavailable"
              : "Add"}
          </button>

          <button
            type="button"
            className="buy-now-button"
            disabled={
              isUnavailable
            }
            onClick={
              handleBuyNow
            }
          >
            Buy Now
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;