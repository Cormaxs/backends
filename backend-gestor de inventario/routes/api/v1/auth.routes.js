import { Router } from "express";
import {login, register, deleteUser, update, getUserId} from "../../../controllers/auth/auth_controllers.js";
import {validateRegistration, validateLogin} from "../../../middlewares/auth_middlewares.js";

const auth_router = Router();

auth_router.post("/register", validateRegistration, register);

auth_router.post("/login", validateLogin, login);

auth_router.post("/update/:idUser", update);

auth_router.delete("/delete/:id", deleteUser);

auth_router.get("/get",getUserId)



export default auth_router; 
