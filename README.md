# HA-SIP
 A SIP client inside home assistant

This requires browser_mod

To add a client
1. first find the deviceID by typing localStorage["lovelace-player-device-id"] in the browser console.
2. Add the settings in the lovelace card.
3. Accept the certificate:

In the browser of your new client, go to: https://[IP]:8089/ws and click continue