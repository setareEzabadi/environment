const ToastReaction = {
  success: {
    position: "bottom-right",
    autoClose: 3000,
    hideProgressBar: true,
    closeButton: false,
    rtl: true,
    theme: "light",
    style: {
      backgroundColor: "#E6FFFA",
      color: "#0F766E", // teal-700
      border: "1px solid #99F6E4", // teal-200
      boxShadow: "0 4px 10px rgba(16, 185, 129, 0.15)",
    },
  },

  error: {
    position: "bottom-right",
    autoClose: 3000,
    hideProgressBar: true,
    closeButton: false,
    rtl: true,
    theme: "light",
    style: {
      backgroundColor: "#FEF2F2",
      color: "#B91C1C", // red-700
      border: "1px solid #FCA5A5", // red-300
      boxShadow: "0 4px 10px rgba(239, 68, 68, 0.15)",
    },
  },

  warning: {
    position: "bottom-right",
    autoClose: 3000,
    hideProgressBar: true,
    closeButton: false,
    rtl: true,
    style: {
      backgroundColor: "#FFFBEB",
      color: "#92400E", // amber-800
      border: "1px solid #FCD34D", // amber-300
      boxShadow: "0 4px 10px rgba(251, 191, 36, 0.15)",
    },
  },
};

export default ToastReaction;
