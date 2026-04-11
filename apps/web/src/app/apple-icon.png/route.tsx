import { ImageResponse } from "next/og";

const background = "#020617";
const gradientA = "rgba(59, 130, 246, 0.95)";
const gradientB = "rgba(16, 185, 129, 0.9)";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background,
          position: "relative",
          overflow: "hidden",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 35% 22%, rgba(59,130,246,0.4), transparent 42%), radial-gradient(circle at 74% 20%, rgba(16,185,129,0.32), transparent 34%)",
          }}
        />
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(145deg, ${gradientA}, ${gradientB})`,
            boxShadow: "0 18px 48px rgba(15, 23, 42, 0.38)",
            color: "#f8fafc",
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "-0.08em",
          }}
        >
          V
        </div>
      </div>
    ),
    { width: 180, height: 180 },
  );
}
