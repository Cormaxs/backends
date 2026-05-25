import { Router } from "express";
import { createPointSale, getPointSales, updatePointSale, deletePointSale, getPointSaleById } from "../../../controllers/point-sales/point-sales-controllers.js";

const point_salesRoutes = Router();

point_salesRoutes.post("/create", createPointSale);
point_salesRoutes.get("/company/:id", getPointSales);
point_salesRoutes.get("/get/:id", getPointSaleById);
point_salesRoutes.post("/update/:id", updatePointSale);
point_salesRoutes.delete("/delete/:id", deletePointSale);
point_salesRoutes.get("/:id", getPointSales); // alias compatible para obtener puntos de venta de una empresa

export default point_salesRoutes;
