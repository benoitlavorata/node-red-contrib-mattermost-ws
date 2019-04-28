# node-red-contrib-mm
Interface with mattermost, based on initial node-red-contrib-mattermost, with small modifications to allow direct access to all methods exposed in mattermost-client lib.
This module requires to create a bot account on mattermost, and uses websocket for connection.

Creates 4 nodes: 
- mm-config: configuration of the bot
Need to provide the url, login, password, ports...

- mm-receive: triggered whenever a message is received by the bot
```json
{
    payload: {
        event: "posted",
        data: object,
        channel_display_name: "",
        channel_name: "ooru7g666f8wmm99dbe9osmeno__qz93pd58ifnpzj84f3pxg859eh",
        channel_type: "D",
        mentions: "["qz93pd58ifnpzj84f3pxg859eh"]",
        post: object,
        sender_name: "benoit",
        team_id: "",
        broadcast: object,
        seq: 6,
    },
    _msgid: "8919fda8.df6f1"
}
```

- mm-send: send a message to users (dm, use "channel=username") or to groups
Example
```json
{
    "channel": "user",
    "payload":{
        message: `Test`,
        //root_id: rootMsgId,
        //parent_id: originalMsgId,
        //original_id: ""
    }
}
```

- mm-api: use mattermost API to perform more operations
Example:
```json
{
    method: "getPostById",
    args: "SomeID",
};
```