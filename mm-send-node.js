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

    function MMSendNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.host = RED.nodes.getNode(config.host);

        node.postMessage = function (msg, channelID) {
            const postData = {
                message: msg,
                filenames: [],
                create_at: 0,
                user_id: node.host.client.self.id,
                channel_id: channelID
            };

            if (typeof msg === 'string') {
                postData.message = msg;
            } else {
                postData.message = msg.message;
                if (msg.props) {
                    postData.props = msg.props;
                }
                if (msg.filenames) {
                    postData.filenames = msg.filenames;
                }
                if (msg.root_id) {
                    postData.root_id = msg.root_id;
                }
                if (msg.parent_id) {
                    postData.parent_id = msg.parent_id;
                }
                if (msg.original_id) {
                    postData.original_id = msg.original_id;
                }
            }

            // break apart long messages
            const chunks = node.host.client._chunkMessage(postData.message);
            postData.message = chunks.shift();

            node.status({
                fill: "green",
                shape: "dot",
                text: `Sent !`
            });
            setTimeout(function () {
                node.status({
                    fill: "blue",
                    shape: "dot",
                    text: `Ready`
                });
            }, 500)

            return node.host.client._apiCall('POST', '/posts', postData, (data, header) => {
                node.host.client.logger.debug('Posted message.');

                if ((chunks != null ? chunks.length : undefined) > 0) {
                    msg = chunks.join();
                    node.host.client.logger.debug(`Recursively posting remainder of message: (${(chunks != null ? chunks.length : undefined)})`);
                    return node.postMessage(msg, channelID);
                }


                return true;
            });
        }

        //handle messag in
        node.on('input', function (msg) {

            if (!node.host.client) {
                node.host.createClient();
            }

            node.status({
                fill: "orange",
                shape: "dot",
                text: `Try to send to ${channel}...`
            });

            if (!msg.payload)
                return handle_error(new Error("No payload provided"), node);

            var channelName = msg.channel ? msg.channel : node.defaultChannel;

            // try by id
            if (node.host.client.channels[channelName])
                return node.postMessage(msg.payload, node.host.client.channels[channelName].id);

            // by channel name
            var channel = node.host.client.findChannelByName(channelName);
            if (channel)
                return node.postMessage(msg.payload, channel.id);

            // try by username
            var user = node.host.client.getUserByUsername(channelName);
            if (!user)
                user = node.host.client.getUserByEmail(channelName);

            if (user)
                return node.host.client.getUserDirectMessageChannel(user.id, function (privateChannel) {
                    node.postMessage(msg.payload, privateChannel.id);
                });

            return handle_error(new Error(`Channel ${channelName} cannot be found`), node);
        });
    }
    RED.nodes.registerType("mm-send", MMSendNode);
};