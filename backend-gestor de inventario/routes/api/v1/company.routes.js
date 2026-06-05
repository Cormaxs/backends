import { Router } from "express";
import {CreateCompany, updateCompany, deleteCompany, 
    getCompany, getCompanyAll, getCompanyPlanStatus} from "../../../controllers/company/CRUD.controller.js";

const companyRoutes = Router();

companyRoutes.post("/create", CreateCompany);
companyRoutes.post("/update/:idEmpresa", updateCompany);
companyRoutes.delete("/delete/:id", deleteCompany);
companyRoutes.get("/get/all", getCompanyAll);
companyRoutes.get("/get/:id", getCompany);
companyRoutes.get("/plan-status/:id", getCompanyPlanStatus);



//rutas relacionadas a la creacion de partes asociadas a la empresa



//agregar a futuro rutas de 
//filtros, relacion de empresas y productos/usuarios
export default companyRoutes;
