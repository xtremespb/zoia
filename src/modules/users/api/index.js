import apiUserLogin from "./apiUserLogin";
import apiUsersList from "./apiUsersList";
import apiUserSave from "./apiUserSave";
import apiUserLoad from "./apiUserLoad";
import apiUserDelete from "./apiUserDelete";

export default fastify => {
    fastify.post("/api/users/login", apiUserLogin());
    fastify.post("/api/users/list", apiUsersList());
    fastify.post("/api/users/edit/save", apiUserSave());
    fastify.post("/api/users/edit/load", apiUserLoad());
    fastify.post("/api/users/edit/delete", apiUserDelete());
};
