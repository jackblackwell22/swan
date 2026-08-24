import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          background: "#b35a3a",
          padding: 3,
        }}
      >
        <div style={{ flex: 1, background: "#1e6bb5", marginRight: 2 }} />
        <div style={{ flex: 1, background: "#1e6bb5" }} />
      </div>
    ),
    { ...size },
  );
}
