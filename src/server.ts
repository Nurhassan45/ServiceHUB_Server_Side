
import "dotenv/config";

import app from "./app.js";
import { initDB } from "./DB/index.js";

const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
    try {
        await initDB();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
};

startServer();
