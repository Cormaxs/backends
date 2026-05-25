import { Router } from "express";
import {sinAfip, getTiketsCompany} from "../../../controllers/facturas/sin-afip/facturas-crud.js";

const facturas_sin_afip = Router();

facturas_sin_afip.post("/create/:idUser",sinAfip )
facturas_sin_afip.get("/get/all/:idEmpresa",getTiketsCompany);

export default facturas_sin_afip;
