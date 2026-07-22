import { Link } from "react-router-dom";

function HomePage() {
  const categories = [
    {
      emoji: "🍦",
      name: "Ice Cream",
      description: "Creamy and premium flavours",
    },
    {
      emoji: "🧇",
      name: "Waffles",
      description: "Fresh, crispy and delicious",
    },
    {
      emoji: "🥤",
      name: "Cold Drinks",
      description: "Chilled drinks for every mood",
    },
    {
      emoji: "🎂",
      name: "Cakes",
      description: "Sweet treats for celebrations",
    },
  ];

  return (
    <>
      <section
        style={{
          minHeight: "78vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px",
          background:
            "linear-gradient(135deg, #fff5f2 0%, #ffe4dc 50%, #fff8f5 100%)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              display: "inline-block",
              background: "#ffffff",
              color: "#ff4d4f",
              padding: "10px 18px",
              borderRadius: "30px",
              fontWeight: "700",
              marginTop: 0,
              marginBottom: "20px",
              boxShadow: "0 8px 25px rgba(255, 77, 79, 0.12)",
            }}
          >
            Ice Cream, Waffles, Cakes & Cold Drinks
          </p>

          <h1
            style={{
              fontSize: "clamp(42px, 7vw, 76px)",
              lineHeight: "1.05",
              margin: "0 0 20px",
              color: "#1f2937",
            }}
          >
            Your favourite treats,
            <span style={{ color: "#ff4d4f" }}> delivered fast.</span>
          </h1>

          <p
            style={{
              maxWidth: "680px",
              margin: "0 auto 32px",
              fontSize: "19px",
              lineHeight: "1.7",
              color: "#6b7280",
            }}
          >
            Order premium ice creams, chilled drinks, waffles and desserts
            directly from ChillBite.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/products"
              style={{
                background: "#ff4d4f",
                color: "#ffffff",
                padding: "15px 28px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "700",
                boxShadow: "0 10px 25px rgba(255, 77, 79, 0.25)",
              }}
            >
              Order Now
            </Link>

            <Link
              to="/login"
              style={{
                background: "#ffffff",
                color: "#1f2937",
                padding: "15px 28px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "700",
                border: "1px solid #e5e7eb",
              }}
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "75px 20px",
          background: "#ffffff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "42px",
            }}
          >
            <p
              style={{
                color: "#ff4d4f",
                fontWeight: "700",
                marginBottom: "8px",
              }}
            >
              Explore Our Menu
            </p>

            <h2
              style={{
                fontSize: "36px",
                color: "#1f2937",
                marginTop: 0,
                marginBottom: "10px",
              }}
            >
              Popular Categories
            </h2>

            <p
              style={{
                color: "#6b7280",
                fontSize: "17px",
                margin: 0,
              }}
            >
              Choose something delicious for every mood.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "22px",
            }}
          >
            {categories.map((category) => (
              <Link
                key={category.name}
                to="/products"
                style={{
                  background: "#ffffff",
                  padding: "35px 22px",
                  borderRadius: "18px",
                  textAlign: "center",
                  textDecoration: "none",
                  boxShadow: "0 10px 35px rgba(0, 0, 0, 0.08)",
                  border: "1px solid #f3f4f6",
                }}
              >
                <div
                  style={{
                    fontSize: "54px",
                    marginBottom: "16px",
                  }}
                >
                  {category.emoji}
                </div>

                <h3
                  style={{
                    margin: "0 0 9px",
                    color: "#1f2937",
                    fontSize: "22px",
                  }}
                >
                  {category.name}
                </h3>

                <p
                  style={{
                    color: "#6b7280",
                    lineHeight: "1.5",
                    margin: 0,
                  }}
                >
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "70px 20px",
          background: "#fff8f5",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "38px",
              color: "#1f2937",
              marginTop: 0,
              marginBottom: "14px",
            }}
          >
            Delicious food is just one click away
          </h2>

          <p
            style={{
              color: "#6b7280",
              fontSize: "18px",
              marginBottom: "28px",
            }}
          >
            Browse our menu and get your favourite ChillBite treats delivered.
          </p>

          <Link
            to="/products"
            style={{
              display: "inline-block",
              background: "#ff4d4f",
              color: "#ffffff",
              padding: "15px 30px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "700",
            }}
          >
            Explore Products
          </Link>
        </div>
      </section>
    </>
  );
}

export default HomePage;