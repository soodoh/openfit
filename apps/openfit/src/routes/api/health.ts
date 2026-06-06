import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/db";
import { schema } from "@/db/schema";

export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: async () => {
				try {
					await db
						.select({ id: schema.repetitionUnits.id })
						.from(schema.repetitionUnits)
						.limit(1);

					return Response.json({ status: "ok" });
				} catch {
					return Response.json({ status: "error" }, { status: 503 });
				}
			},
		},
	},
});
