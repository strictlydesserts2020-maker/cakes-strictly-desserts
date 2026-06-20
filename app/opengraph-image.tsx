import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Strictly Desserts — Luxury Custom Cakes in Chennai";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #FDF6F0 0%, #F5D5C3 50%, #E8A598 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "serif",
        padding: "60px",
      }}
    >
      <div style={{ fontSize: 22, color: "#C2748A", letterSpacing: 8, marginBottom: 20, textTransform: "uppercase" }}>
        Anna Nagar, Chennai
      </div>
      <div style={{ fontSize: 80, fontWeight: "bold", color: "#6B2D2D", marginBottom: 16, textAlign: "center" }}>
        Strictly Desserts
      </div>
      <div style={{ width: 80, height: 3, background: "#C2748A", marginBottom: 24 }} />
      <div style={{ fontSize: 32, color: "#8B4513", textAlign: "center", maxWidth: 800 }}>
        Luxury Custom Cakes
      </div>
      <div style={{ fontSize: 22, color: "#A0674E", marginTop: 24, textAlign: "center" }}>
        Birthday · Wedding · Bento · Celebration
      </div>
      <div style={{ fontSize: 18, color: "#B07A5E", marginTop: 40 }}>
        strictlydesserts.in
      </div>
    </div>,
    { ...size }
  );
}
