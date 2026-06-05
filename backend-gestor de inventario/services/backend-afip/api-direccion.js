
import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = process.env.AFIP_BACKEND_URL || "http://localhost:3005/api/";
export default API_BASE_URL;
