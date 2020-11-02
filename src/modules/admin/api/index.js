import apiRestart from "./apiRestart";

export default fastify => {
    fastify.post("/api/admin/restart", apiRestart());
};
