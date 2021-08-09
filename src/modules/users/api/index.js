import apiUserLogin from "./apiUserLogin";
import apiUsersList from "./apiUsersList";
import apiUserSave from "./apiUserSave";
import apiUserLoad from "./apiUserLoad";
import apiUserDelete from "./apiUserDelete";
import apiUsersRecycledRestore from "./apiUsersRecycledRestore";
import apiUsersRecycledDelete from "./apiUsersRecycledDelete";
import apiUsersRecycledList from "./apiUsersRecycledList";
import apiAclList from "./apiAclList";
import apiAclSave from "./apiAclSave";
import apiAclLoad from "./apiAclLoad";
import apiAclDelete from "./apiAclDelete";

export default fastify => {
    fastify.post("/api/users/login", apiUserLogin());
    fastify.post("/api/users/list", apiUsersList());
    fastify.post("/api/users/edit/save", apiUserSave());
    fastify.post("/api/users/edit/load", apiUserLoad());
    fastify.post("/api/users/edit/delete", apiUserDelete());
    fastify.post("/api/users/list/recycled", apiUsersRecycledList());
    fastify.post("/api/users/edit/delete/restore", apiUsersRecycledRestore());
    fastify.post("/api/users/edit/delete/recycled", apiUsersRecycledDelete());
    fastify.post("/api/acl/list", apiAclList());
    fastify.post("/api/acl/edit/save", apiAclSave());
    fastify.post("/api/acl/edit/load", apiAclLoad());
    fastify.post("/api/acl/edit/delete", apiAclDelete());
};
