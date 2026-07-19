import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS 홈 화면용 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "#4a90b8",
            }}
          />
          <div
            style={{
              width: 28,
              height: 10,
              borderRadius: 4,
              background: "#4a90b8",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                background: "#7bb8d4",
              }}
            />
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                background: "#4a90b8",
              }}
            />
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                background: "#2d5f7c",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
