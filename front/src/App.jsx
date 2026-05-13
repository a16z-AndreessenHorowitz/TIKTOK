import { BrowserRouter, Routes } from "react-router-dom";
import clientRoutes from "./routes/clientRoutes";

function App() {
  return (
    <BrowserRouter>
    <Routes>
      {clientRoutes}
    </Routes>
  </BrowserRouter>
  )
}

export default App
