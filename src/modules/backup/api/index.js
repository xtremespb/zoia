import apiBackupList from "./apiBackupList";
import apiBackupStart from "./apiBackupStart";

export default fastify => {
    fastify.post("/api/backup/list", apiBackupList());
    fastify.post("/api/backup/start", apiBackupStart());
};
