import { Router } from "express";
import {
    createClient,
    getClientById,
    getClientsByEmpresa,
    updateClient,
    deleteClient
} from "../../../controllers/sales/client_controllers.js";

const clientRoutes = Router();

clientRoutes.post("/", createClient);
clientRoutes.get("/company/:idEmpresa", getClientsByEmpresa);
clientRoutes.get("/:id", getClientById);
clientRoutes.put("/:id", updateClient);
clientRoutes.delete("/:id", deleteClient);

export default clientRoutes;
