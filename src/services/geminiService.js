const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

/**
 * Memanggil API Gemini di backend untuk mendapatkan rekomendasi keselamatan gas real-time.
 * @param {string} status - AMAN / WASPADA / BAHAYA
 * @param {number} ppm - Nilai kadar gas ppm saat ini
 * @returns {Promise<string>} rekomendasi dari AI Gemini
 */
export const getGeminiRecommendation = async (status, ppm = 0) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/gemini?status=${encodeURIComponent(status)}&ppm=${ppm}`
    );
    if (response.ok) {
      const data = await response.json();
      return data.recommendation;
    }
  } catch (error) {
    console.error("[Gemini Service Error] Gagal memanggil API:", error);
  }

  // Fallback lokal jika backend atau API Gemini terganggu
  switch (status) {
    case "BAHAYA":
      return "Segera buka ventilasi, matikan sumber api, dan evakuasi area. (Lokal)";
    case "WASPADA":
      return "Periksa area sekitar sensor dan tingkatkan ventilasi. (Lokal)";
    default:
      return "Kondisi ruangan aman dan terkendali. (Lokal)";
  }
};