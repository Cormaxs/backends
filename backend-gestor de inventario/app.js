import Express from "express";
import env from "dotenv";
import cors from "cors";
import connectDB from "./db/connect.js";
import { seedPlans } from "./db/seeders.js";
import routerV1 from "./routes/api/index.js";
import { checkPlan, checkUsageLimits } from './middlewares/plan.middleware.js';
import { errorHandler } from "./middlewares/error_handler.js";


env.config();
const app = Express();
app.use(cors());
app.use(Express.json());
const PORT = process.env.PORT || 3000;

// Apply plan middleware to API
app.use(checkPlan);
app.use(checkUsageLimits);
app.use("/api/v1", routerV1);
app.use("/", (req, res) => {
    res.send("raiz general");
});

app.use(errorHandler);

const startServer = async () => {
    try {
        await connectDB();
        await seedPlans();
        app.listen(PORT, () => {
            process.stdout.write(`Server is running on port ${PORT} http://localhost:${PORT}\n`);
        });
    } catch (error) {
        console.error("Fallo al iniciar el servidor:", error);
        process.exit(1);
    }
};

startServer();
