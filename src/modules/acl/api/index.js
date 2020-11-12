import apiAclList from "./apiAclList";
import apiAclSave from "./apiAclSave";
import apiAclLoad from "./apiAclLoad";
import apiAclDelete from "./apiAclDelete";

export default fastify => {
    fastify.post("/api/acl/list", apiAclList());
    fastify.post("/api/acl/edit/save", apiAclSave());
    fastify.post("/api/acl/edit/load", apiAclLoad());
    fastify.post("/api/acl/edit/delete", apiAclDelete());
};
