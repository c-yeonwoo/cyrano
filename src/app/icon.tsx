import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** 시라노 파비콘 — Cool Mist · 배분 흐름 마크 */
export default function Icon() {
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
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: "#4a90b8",
            }}
          />
          <div
            style={{
              width: 6,
              height: 2,
              borderRadius: 1,
              background: "#4a90b8",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: "#7bb8d4",
              }}
            />
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: "#4a90b8",
              }}
            />
            <div
              style={{
                width: 6,
                height: 6,
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
