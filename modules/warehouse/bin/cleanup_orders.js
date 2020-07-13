const path = require('path');
const config = require(path.join(__dirname, '..', '..', '..', 'core', 'config.js'));

const script = async() => {
    try {
        const database = new(require(path.join(__dirname, '..', '..', '..', 'core', 'database.js')))(false, config.mongo, false);
        await database.connect();
        const db = database.get();
        const timestamp = parseInt(Date.now() / 1000, 10);
        const cleanstamp = 3600;
        const orders = await db.collection('warehouse_orders').find({
            date: { $lt: (timestamp - cleanstamp) },
            status: 1,
            paid: false
        }).toArray();
        if (orders && orders.length) {
            for (let i in orders) {
                const order = orders[i];
                for (let c in order.cart) {
                    const [cid] = c.split('|');
                    const count = order.cart[c].count;
                    await db.collection('warehouse').update({ sku: cid }, { $inc: { amount: parseInt(count, 10) } });
                }
                await db.collection('warehouse_orders').update({ _id: parseInt(order._id, 10) }, { $set: { status: 0, cart: {} } });
            }
        }
        process.exit(0);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
};
script();