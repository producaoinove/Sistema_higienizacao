import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

export default function Layout() {
  return (
    <Box>
      <Navbar />
      <Box mt={2}>
        <Outlet />
      </Box>
    </Box>
  );
}
