const findNodeByUUID = (uuid, data) => {
    let node;
    data.map(i => {
        if (i.uuid === uuid) {
            node = i;
        }
        if (!node && i.c) {
            node = findNodeByUUID(uuid, i.c);
        }
    });
    return node;
};

const getLabel = (uuid, language, treeData) => {
    if (!uuid) {
        return "/";
    }
    const node = findNodeByUUID(uuid, treeData);
    return node ? node.data[language] || node.id : null;
};

export default {
    findNodeByUUID,
    getLabel,
};
