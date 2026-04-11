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
              "radial-gradient(circle at 28% 24%, rgba(59,130,246,0.44), transparent 44%), radial-gradient(circle at 72% 16%, rgba(168,85,247,0.4), transparent 34%), radial-gradient(circle at 54% 84%, rgba(34,197,94,0.2), transparent 28%)",
          }}
        />
        <div
          style={{
            width: 352,
            height: 352,
            borderRadius: 112,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(145deg, ${gradientA}, ${gradientB})`,
            boxShadow: "0 36px 96px rgba(15, 23, 42, 0.42)",
            color: "#f8fafc",
            fontSize: 176,
            fontWeight: 800,
            letterSpacing: "-0.08em",
          }}
        >
          V
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
