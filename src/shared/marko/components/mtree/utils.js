module.exports = class {
    findNodeByUUID(uuid, data) {
        let node;
        data.map(i => {
            if (i.uuid === uuid) {
                node = i;
            }
            if (!node && i.c) {
                node = this.findNodeByUUID(uuid, i.c);
            }
        });
        return node;
    }

    getPathByUUID(uuid, data, path = []) {
        let res = [];
        data.map(i => {
            if (res.length) {
                return;
            }
            path.push(i.id);
            if (i.uuid === uuid) {
                res = path;
                return;
            }
            if (i.c) {
                const sr = this.getPathByUUID(uuid, i.c, path);
                if (sr.length) {
                    res = path;
                    return;
                }
            }
            path.pop();
        });
        return res;
    }

    findNodesByUUID(uuid, data) {
        let nodes;
        data.map(i => {
            if (i.uuid === uuid) {
                nodes = data;
            }
            if (!nodes && i.c) {
                nodes = this.findNodesByUUID(uuid, i.c);
            }
        });
        return nodes;
    }

    removeNodeByUUID(uuid, data) {
        return data.map(i => {
            if (i.uuid === uuid) {
                i = null;
            }
            if (i && i.c && i.c.length) {
                i.c = this.removeNodeByUUID(uuid, i.c);
            }
            return i;
        }).filter(i => i);
    }

    findNodeById(id, data) {
        let node;
        data.map(i => {
            if (i.id === id) {
                node = i;
            }
        });
        return node;
    }
};
