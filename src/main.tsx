import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clear the reload flag if the application loads successfully
if (sessionStorage.getItem("dynamic_import_reload_attempted")) {
    sessionStorage.removeItem("dynamic_import_reload_attempted");
}

createRoot(document.getElementById("root")!).render(<App />);
