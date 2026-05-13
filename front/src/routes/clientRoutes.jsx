import { Route } from "react-router-dom";
import Home from "../pages/home";
import MainLayout from "../layouts/MainLayout";

const clientRoutes = (
  <Route element={<MainLayout />}>
      <Route path="/" element={<Home />} />
  </Route>

);

export default clientRoutes;