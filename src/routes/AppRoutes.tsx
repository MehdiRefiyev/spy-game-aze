import { createBrowserRouter } from "react-router";
import App from "../App";
import Cards from "../pages/Cards";
import Finish from "../pages/Finish";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>
  },
  {
    path: "/cards",
    element: <Cards/>
  },
  {
    path: "/finish",
    element: <Finish/>
  }
]);
