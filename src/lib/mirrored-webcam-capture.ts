import type Webcam from "react-webcam";

/**
 * Capture the same mirrored view the user sees (react-webcam CSS mirror does not
 * apply to getScreenshot()). Matches hand overlay + server input orientation.
 */
export function getMirroredWebcamScreenshot(
  webcam: Webcam | null,
  format: "image/webp" | "image/jpeg" = "image/webp",
  quality = 0.85
): string | null {
  const video = webcam?.video;
  if (!video || video.readyState !== 4 || video.videoWidth === 0) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL(format, quality);
}
