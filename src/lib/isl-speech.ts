/** Browser speech synthesis helpers for ISL recognition output. */

export function speakText(text: string): void {
  if (!text.trim() || typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}
