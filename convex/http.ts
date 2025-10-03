import { auth } from "./auth";
import router from "./router";

auth.addHttpRoutes(router);

export default router;
