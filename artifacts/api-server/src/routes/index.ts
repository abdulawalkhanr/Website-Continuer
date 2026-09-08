import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import leadsRouter from "./leads";
import customersRouter from "./customers";
import casesRouter from "./cases";
import documentsRouter from "./documents";
import paymentsRouter from "./payments";
import payuRouter from "./payu";
import referralsRouter from "./referrals";
import ticketsRouter from "./tickets";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";
import staffRouter from "./staff";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(staffRouter);
router.use(leadsRouter);
router.use(customersRouter);
router.use(casesRouter);
router.use(documentsRouter);
router.use(paymentsRouter);
router.use(payuRouter);
router.use(referralsRouter);
router.use(ticketsRouter);
router.use(notificationsRouter);
router.use(adminRouter);

export default router;
