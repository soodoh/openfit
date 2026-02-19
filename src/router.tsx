/* eslint-disable eslint-plugin-import(prefer-default-export), typescript-eslint(explicit-module-boundary-types) */
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./route-tree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
  });

  return router;
}

declare module "@tanstack/react-router" {
  type Register = {
    router: ReturnType<typeof getRouter>;
  }
}
