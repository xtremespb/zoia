import apiBackupList from "./apiBackupList";
import apiBackupStart from "./apiBackupStart";
import apiBackupStatus from "./apiBackupStatus";
import apiBackupAbort from "./apiBackupAbort";

export default fastify => {
    fastify.post("/api/backup/list", apiBackupList());
    fastify.post("/api/backup/start", apiBackupStart());
    fastify.post("/api/backup/status", apiBackupStatus());
    fastify.post("/api/backup/abort", apiBackupAbort());
};
