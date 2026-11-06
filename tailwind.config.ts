import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { marinho: "#071B33", eletrico: "#087BFF", claro: "#8BCBFF", gelo: "#F5F8FC", tecnico: "#A8B7C9", grafite: "#182638" } } },
  plugins: [],
} satisfies Config;
