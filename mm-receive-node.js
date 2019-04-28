module.exports = function (RED) {

    var handle_error = function (err, node) {
        node.log(err.body);
        node.status({
            fill: "red",
            shape: "dot",
            text: err.message
        });
        node.error(err.message);
    };

    function MMReceiveNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.host = RED.nodes.getNode(config.host);
        node.alreadyProcessed = [];

        setInterval(function () {
            node.status({
                fill: "blue",
                shape: "dot",
                text: `Cleaned cache`
            });
            node.alreadyProcessed = [];
        }, 1000 * 60);

        // handle message in
        node.host.client.on('message', message => {
            if (!message || !message.data || !message.data.post) {
                return false;
            }
            try {
                message.data.post = JSON.parse(message.data.post);
            } catch (err) {
                console.log(err);
                console.log(message.data.post);
            }
            //do not catch our own message...
            if (message.data.post.user_id !== node.host.client.self.id) {

                // avoid potential duplicata
                if (!node.alreadyProcessed.includes(message.data.post.id)) {

                    node.alreadyProcessed.push(message.data.post.id);
                    //console.log(node.alreadyProcessed);

                    node.send({
                        payload: message
                    });
                }
            }
        });
    }
    RED.nodes.registerType("mm-receive", MMReceiveNode);
};