module.exports = function (RED) {

    var handle_error = function (err, node) {
        console.error(err);
        node.status({
            fill: "red",
            shape: "dot",
            text: err.message
        });
        node.error(err.message);
    };

    function MMAPINode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.host = RED.nodes.getNode(config.host);

        //handle messag in
        node.on('input', function (msg) {
            if (!node.host.client) {
                node.host.createClient();
            }

            if (node.host.client[msg.method]) {
                console.error('execute method: ' + msg.method);

                if (!msg.args) {
                    msg.payload = null;
                    node.send(msg);
                    return false;
                }

                (node.host.client[msg.method])(msg.args).then(data => {
                    console.error('received reply');
                    msg.payload = data || false;
                    node.send(msg);
                }).catch(err => {
                    console.error('received error');
                    handle_error(err, node);
                });
            } else {
                return handle_error(`Method not supported`, node);
            }
        });
    }
    RED.nodes.registerType("mm-api", MMAPINode);
};