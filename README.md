# HA-SIP
**A SIP client inside home assistant!**

With this card you can make and receive calls to other HA clients and other sip devices, so you can use it as for example an intercom.

![image](https://user-images.githubusercontent.com/32220029/136860621-8a12bd7f-a052-4855-a163-29dab84901e1.png)

## Roadmap
This is very much still work in progress, and these are the things i want to add in the near future.
 * Better CSS. **if you want to help, please do!**
 * GUI config
 * Option to set display name for buttons
 * Better errror logging
 * Ringtone when called
 * Mute function
 * Conference function
 * Videocalls
 * Option to auto answer
 * PA function? (broadcast to all)
 * Sound wave animation?

**Asterisk add-on**

One idea is to make this a all-in-one add-on that makes and configures a pbx server for you.
If enough people want this i will consider trying it. If you want to help me with this, please contact me at **jordy.kuhne@gmail.com**

## Requirements
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
Add the card by setting **type** to `custom:sipjs-client-card`.

![image](https://user-images.githubusercontent.com/32220029/137117118-95e69880-9ebe-44a6-88db-ffc050ed3e04.png)

**To add a client**
1. first find the **deviceID** of your current HA client by typing `localStorage["lovelace-player-device-id"]` in the browser console. (F12) (You can also set your own **deviceID** by typing `?deviceID=<deviceID>` behind your HA URL)
2. Add your **deviceID** to `clients` and set all your settings. (If you only want to call to a SIP device, you dont need `password`, but you do need `username` to display).
3. You may need to accept the certificate if you get a **1006** error. With your client go to: `https://<ip-address>:8089/ws`.

## Troubleshooting
Most problems is because your pbx server is not configured correct.
If you dont know how you can always make an issue or send me a email.

## Contact
**jordy.kuhne@gmail.com**
