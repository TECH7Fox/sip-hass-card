# HA-SIP
**A SIP client inside home assistant!**

With this card you can make and receive calls to other HA clients and other sip devices, so you can use it as for example an intercom.

![image](https://user-images.githubusercontent.com/32220029/136860621-8a12bd7f-a052-4855-a163-29dab84901e1.png)

Add as many devices you want in the config like below.

![image](https://user-images.githubusercontent.com/32220029/136860840-0f3ac948-1ecc-4fa0-8bd8-d3b981891b03.png)

## requirements
For this to work you will need the following:
 * A sip/pbx server. (I use freepbx on a raspberry)
 * Extension for every device.
 * HACS on your HA. (Home assistant)
 * Browser_mod installed and working on your HA.
 * Some time :)

## Installation
Download using **HACS**
 1. Go to HACS
 2. Click on `Frontend`
 3. Click on the 3 points in the upper right corner and click on `Custom repositories`
 4. Paste https://github.com/TECH7Fox/HA-SIP/ into `Add custom repository URL` and by category choose Lovelace
 5. Click on add and check if the repository is there.
 6. You should now see SIP.js Client. Click `INSTALL`

## Usage
To add a client
1. first find the deviceID of your current HA client by typing `localStorage["lovelace-player-device-id"]` in the browser console.
2. Add the settings in the lovelace card.
3. Accept the certificate:


## Troubleshooting
If you cant connect to your sip/pbx server, it may be because your browser wont accept the certificate.
In the browser of your new client, go to: `https://<ip-address>:8089/ws`
