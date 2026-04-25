import { useState } from "react";

const colors = {
  nav: "#6a9b3a",
  btn: "#2b4a9e",
  card: "#fafff5",
  bg: "#f5f9e8",
  text: "#2c1a0e",
  yellow: "#f0c215",
  muted: "#5a4a00",
  bodyText: "#4a3828",
  detailText: "#6a5a4a",
  placeholder: "#d4dfc8",
  placeholderText: "#7a8c6a",
  dividerFull: "#c8d8b0",
  cardBorder: "#d6e8c4",
  yellowDivider: "#c9a200",
};

const LocationIcon = () => (
  <svg width="12" height="15" viewBox="0 0 11 13" fill="none">
    <path
      d="M5.5 0C3.01 0 1 2.01 1 4.5c0 3.37 4.5 8.5 4.5 8.5s4.5-5.13 4.5-8.5C10 2.01 7.99 0 5.5 0zm0 6.1a1.6 1.6 0 110-3.2 1.6 1.6 0 010 3.2z"
      fill={colors.muted}
    />
  </svg>
);

export default function DormitoryListing() {
  const [favorited, setFavorited] = useState(false);
  const [applyHover, setApplyHover] = useState(false);
  const [favHover, setFavHover] = useState(false);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <div style={{
        background: colors.bg,
        fontFamily: "'DM Sans', sans-serif",
        color: colors.text,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}>

        {/* Breadcrumb */}
        <div style={{
          fontSize: 13,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: "#888",
          padding: "16px 80px",
          borderBottom: ".5px solid #ddd",
          flexShrink: 0,
        }}>
          Search &rsaquo; Dormitories &rsaquo;{" "}
          <span style={{ color: colors.text, fontWeight: 500 }}>Women's Dormitory</span>
        </div>

        {/* Main Layout */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: 40,
          padding: "32px 80px",
          flex: 1,
          overflow: "visible",
          minHeight: 0,
        }}>

          {/* LEFT COLUMN */}
          <div style={{ minWidth: 0, overflow: "visible", display: "flex", flexDirection: "column" }}>

            {/* Gallery Main */}
            <div style={{
              background: colors.placeholder,
              borderRadius: 10,
              flex: "0 0 220px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.placeholderText,
              fontSize: 14,
              marginBottom: 12,
            }}>
              Main Gallery Image Placeholder
            </div>

            {/* Thumbnails */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, flexShrink: 0 }}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} style={{
                  background: colors.placeholder,
                  borderRadius: 8,
                  height: 90,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.placeholderText,
                  fontSize: 12,
                }}>
                  Thumb {n}
                </div>
              ))}
            </div>

            {/* About */}
            <div style={{ marginTop: 28, flexShrink: 0 }}>
              <div style={{
                fontFamily: "'Archivo Black', sans-serif",
                fontSize: 20,
                letterSpacing: ".01em",
                color: colors.text,
                marginBottom: 12,
                borderBottom: `2.5px solid ${colors.nav}`,
                paddingBottom: 6,
              }}>
                About This Accommodation
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: colors.bodyText, marginBottom: 10 }}>
                This is a placeholder for the detailed description of the accommodation. Here the owner can describe the vibe, the neighborhood, and specific details that make this place unique. It's meant to provide a comprehensive overview for potential student applicants.
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: colors.bodyText }}>
                Located within walking distance of public transport and local amenities, this spot is ideal for university students looking for a balance between quiet study time and accessibility to city life.
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: .5, background: colors.dividerFull, margin: "24px 0", flexShrink: 0 }} />

            {/* Room Details + Application Requirements */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, flex: 1, minHeight: 0 }}>
              {[
                { title: "Room Details", body: "Section for specific room dimensions, furniture list, and layout diagram placeholder." },
                { title: "Application Requirements", body: "List of required documents (ID, Student Proof, Guarantor details, etc.) and specific tenant rules." },
              ].map(({ title, body }) => (
                <div key={title}>
                  <div style={{
                    fontFamily: "'Archivo Black', sans-serif",
                    fontSize: 20,
                    letterSpacing: ".01em",
                    color: colors.text,
                    marginBottom: 12,
                    borderBottom: `2.5px solid ${colors.nav}`,
                    paddingBottom: 6,
                  }}>
                    {title}
                  </div>
                  <div style={{
                    background: colors.card,
                    border: `0.5px solid ${colors.cardBorder}`,
                    borderRadius: 10,
                    padding: 20,
                    height: "calc(100% - 48px)",
                  }}>
                    <p style={{ fontSize: 12, color: colors.detailText, lineHeight: 1.7 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "visible" }}>
            <div style={{
              background: colors.yellow,
              borderRadius: 14,
              padding: 28,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "visible",
            }}>
              {/* Title */}
              <div style={{
                fontFamily: "'Archivo Black', sans-serif",
                fontSize: 36,
                letterSpacing: ".01em",
                color: colors.text,
                lineHeight: 1.1,
                marginBottom: 10,
              }}>
                Women's Dormitory
              </div>

              {/* Location */}
              <div style={{ fontSize: 12, color: colors.muted, display: "flex", alignItems: "center", gap: 5, marginBottom: 16 }}>
                <LocationIcon />
                Juan V. Panorz, Los Baños, Laguna
              </div>

              {/* Price */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 38, fontWeight: 500, color: colors.text }}>₱350</span>
                <span style={{ fontSize: 13, color: colors.muted }}>/ month</span>
              </div>

              <div style={{ height: .5, background: colors.yellowDivider, margin: "14px 0" }} />

              {/* Meta */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[["Room Type", "Entire Studio"], ["Capacity", "4 Student"]].map(([label, value]) => (
                  <div key={label}>
                    <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".07em", color: colors.muted, display: "block", marginBottom: 2 }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Amenities */}
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".07em", color: colors.muted, marginBottom: 8, display: "block" }}>Amenities</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {["WiFi", "Laundry", "Kitchen"].map((a) => (
                  <span key={a} style={{
                    background: colors.text, color: colors.yellow,
                    fontSize: 10, fontWeight: 500, letterSpacing: ".07em",
                    textTransform: "uppercase", padding: "4px 10px", borderRadius: 4,
                  }}>{a}</span>
                ))}
              </div>

              <div style={{ height: .5, background: colors.yellowDivider, margin: "14px 0" }} />

              {/* Buttons pushed to bottom */}
              <div style={{ marginTop: "auto" }}>
                <button
                  style={{
                    width: "100%", background: colors.btn, color: "#fff",
                    fontSize: 15, fontWeight: 500, letterSpacing: ".08em",
                    textTransform: "uppercase", border: "none", borderRadius: 8,
                    padding: 14, cursor: "pointer", marginBottom: 8,
                    opacity: applyHover ? 0.85 : 1, transition: "opacity .15s",
                  }}
                  onMouseEnter={() => setApplyHover(true)}
                  onMouseLeave={() => setApplyHover(false)}
                >
                  Apply Now
                </button>
                <button
                  style={{
                    width: "100%", background: favHover ? "rgba(0,0,0,.07)" : "transparent",
                    color: colors.text, border: `2px solid ${colors.text}`,
                    fontSize: 13, fontWeight: 500, borderRadius: 8, padding: 11,
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 6, transition: "background .15s",
                  }}
                  onMouseEnter={() => setFavHover(true)}
                  onMouseLeave={() => setFavHover(false)}
                  onClick={() => setFavorited(!favorited)}
                >
                  {favorited ? "♥" : "♡"} Favorite
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
