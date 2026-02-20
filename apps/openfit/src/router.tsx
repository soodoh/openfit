import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./route-tree.gen";
export function getRouter(): any {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
  });
  return router;
}
declare module "@tanstack/react-router" {
  type Register = {
    router: ReturnType<typeof getRouter>;
  };
}

export default getRouter;
