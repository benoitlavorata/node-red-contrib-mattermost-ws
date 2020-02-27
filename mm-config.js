module.exports = function (RED) {

    const fs = require('fs');
    //const moment = require('moment');
    const fetch = require('fetch-base64');
    const Client = require('mattermost-client');

    function MMConfigNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        node.name = n.name;
        node.url = n.url;
        node.team = n.team;
        node.wssPort = n.wssPort;
        node.httpPort = n.httpPort;
        node.defaultChannel = n.defaultChannel;
        node.client = null;

        node.on('close', function (done) {
            console.log('closing node mm');
            node.client.disconnect();
            node.client = null;
            done();
        });

        node.createClient = function () {
            if (!node.client) {
                //var Base64 = require('js-base64').Base64;
                //create client
                node.client = new Client(
                    node.url,
                    node.team, {
                        wssPort: node.wssPort,
                        httpPort: node.httpPort
                    }
                );
                if (node.credentials.username && node.credentials.password) {
                    node.client.login(
                        node.credentials.username,
                        node.credentials.password
                    );
                } else if (node.credentials.access_token) {
                    node.client.tokenLogin(
                        node.credentials.access_token
                    );
                };
            }

            node.client.getUserByUsername = function (username) {
                if (!node.client.users)
                    return false;

                for (let u in node.client.users) {
                    if (node.client.users[u].username === username) {
                        return node.client.users[u];
                    }
                }
            }

            node.client.getPostById = function (messageID = false) {
                if (!messageID)
                    return false;
                const uri = `/posts/${messageID}`;
                return new Promise(res => {
                    node.client._apiCall('GET', uri, [], (data, headers) => {
                        node.client.logger.debug('Received Post');
                        res(data);
                    });
                })
            }

            node.client.getFileById = function (fileID = false) {
                if (!fileID)
                    return false;


                const uri = `/files/${fileID}`;
                const uriInfo = `/files/${fileID}/info`;
                return new Promise((res, rej) => {

                    node.client._apiCall('GET', uriInfo, [], (dataInfo, headersInfo) => {
                        node.client.logger.debug('Received File Info');

                        node.client._apiCall('GET', uri, [], (data, headers) => {
                            node.client.logger.debug('Received File');
                            var tmpFileName = dataInfo.id; //moment('X');
                            var tmpFilePath = `/data/${tmpFileName}.${dataInfo.extension}`;

                            fs.writeFile(
                                tmpFilePath,
                                data,
                                "binary",
                                function (err) {
                                    if (err) {
                                        rej(err);
                                    } else {
                                        fetch.local(tmpFilePath)
                                            .then((data) => {
                                                // data[0] contains the raw base64-encoded jpg
                                                res({
                                                    meta: dataInfo,
                                                    fileBase64: data[0],
                                                    fileBuffer: data
                                                });
                                            }).catch((reason) => {
                                                rej(reason);
                                            });
                                    }
                                });
                        }, {}, {
                            encoding: null
                        });
                    });
                })
            }

            return node.client;
        }

        node.createClient();
    }
    RED.nodes.registerType("mm-config", MMConfigNode,{
        credentials: {
            username: {type: 'text'},
            password: {type: 'password'},
            access_token: {type: 'password'}
        }
    });
}