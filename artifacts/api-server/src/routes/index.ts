import { Router, type IRouter } from "express";
import healthRouter from "./health";

// Public routes
import applicationsRouter from "./public/applications";
import documentsRouter from "./public/documents";
import calculatorRouter from "./public/calculator";
import contactRouter from "./public/contact";

// Admin routes
import adminAuthRouter from "./admin/auth";
import adminDashboardRouter from "./admin/dashboard";
import adminApplicationsRouter from "./admin/applications";
import adminLoansRouter from "./admin/loans";
import adminOverduesRouter from "./admin/overdues";
import adminDocumentsRouter from "./admin/documents";
import adminNotificationsRouter from "./admin/notifications";
import adminUsersRouter from "./admin/users";
import adminAuditRouter from "./admin/audit";

const router: IRouter = Router();

router.use(healthRouter);

// Public
router.use(applicationsRouter);
router.use(documentsRouter);
router.use(calculatorRouter);
router.use(contactRouter);

// Admin
router.use(adminAuthRouter);
router.use(adminDashboardRouter);
router.use(adminApplicationsRouter);
router.use(adminLoansRouter);
router.use(adminOverduesRouter);
router.use(adminDocumentsRouter);
router.use(adminNotificationsRouter);
router.use(adminUsersRouter);
router.use(adminAuditRouter);

export default router;
