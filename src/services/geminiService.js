export const getGeminiRecommendation = (
  status
) => {
  switch (status) {
    case "BAHAYA":
      return "Segera buka ventilasi, matikan sumber api, dan evakuasi area.";

    case "WASPADA":
      return "Periksa area sekitar sensor dan tingkatkan ventilasi.";

    default:
      return "Kondisi ruangan aman dan terkendali.";
  }
};