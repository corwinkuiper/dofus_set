import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  body {
    font: 1em/1.62 sans-serif;
    background-color: white;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    margin: 0;
  }

  h1,
  h2,
  h3 {
    line-height: 1.2;
  }
`;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalStyle />
    <App />
  </StrictMode>
);
