// backend/src/routes/index.ts
import express from "express";
import bodyParser from "body-parser";
import { approveVolunteerCoverage } from "../controllers/shiftCoverageController.js";

const router = express.Router();

router.post("/approve-volunteer-coverage", approveVolunteerCoverage);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use("/api", router);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default router;