import { ImageResponse } from "next/og";

const background = "#020617";
const gradientA = "rgba(59, 130, 246, 0.95)";
const gradientB = "rgba(168, 85, 247, 0.88)";

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
              "radial-gradient(circle at 30% 25%, rgba(59,130,246,0.42), transparent 42%), radial-gradient(circle at 72% 18%, rgba(168,85,247,0.36), transparent 36%), radial-gradient(circle at 50% 82%, rgba(34,197,94,0.18), transparent 28%)",
          }}
        />
        <div
          style={{
            width: 136,
            height: 136,
            borderRadius: 42,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(145deg, ${gradientA}, ${gradientB})`,
            boxShadow: "0 18px 50px rgba(15, 23, 42, 0.38)",
            color: "#f8fafc",
            fontSize: 68,
            fontWeight: 800,
            letterSpacing: "-0.08em",
          }}
        >
          V
        </div>
      </div>
    ),
    { width: 192, height: 192 },
  );
}
