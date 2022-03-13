# HA-SIP
**A SIP client inside home assistant!**

With this card you can make and receive calls to other HA clients and other sip devices, so you can use it as for example an intercom.

![image](https://user-images.githubusercontent.com/32220029/149833595-204a0faa-d129-4b9b-9338-78155031b7d7.png)

The card supports video, DTMF signals, custom icons, custom names, status entities and camera entities.

![image](https://user-images.githubusercontent.com/32220029/149833763-6a74bae6-bc6e-4207-97c8-b430123fa3c3.png)

## Roadmap
This is very much still work in progress, and these are the things i want to add in the near future.
 * Include default ringtones
 * Fix video on android companion app
 * Translations
 * Better errror logging
 * Audio visualizer when there is no video 

**Asterisk add-on**
This card works with the [Asterisk add-on](https://github.com/TECH7Fox/Asterisk-add-on), which is very easy to set up, with just some clicks!

## Requirements
For this to work you will need the following:
 * A sip/pbx server. (I use the [Asterisk add-on](https://github.com/TECH7Fox/Asterisk-add-on))
 * Extension for every device. (The add-on auto-generates extensions for every person in HA)
 * HACS on your HA. (Home assistant)

Go to https://github.com/TECH7Fox/HA-SIP/wiki/Setup-FreePBX to see how to setup FreePBX for this card.

## Installation
Download using **HACS**
 1. Go to HACS
 2. Click on `Frontend`
 3. Click on the 3 points in the upper right corner and click on `Custom repositories`
 4. Paste https://github.com/TECH7Fox/HA-SIP/ into `Add custom repository URL` and by category choose Lovelace
 5. Click on add and check if the repository is there.
 6. You should now see SIP.js Client. Click `INSTALL`

## Usage
Click on add card and scroll down to and choose `Custom: SIP Card`.
The entire card is configurable from the editor.

### Set Ringtones
set your ringtones to play when calling/being called.
`/local` is your `www` folder in config. Example: `/local/ringtone.mp3` = `/config/www/ringtone.mp3`.

### Auto call
You can put `?call=<number>` behind the URL to auto call that number when the card loads. Useful for notifications.

## Troubleshooting
Most problems is because your PBX server is not configured correct, or your certificate is not accepted.
To accept the certificate for Asterisk/FreePBX go to `https://<host>:8089/ws` and click continue.
To see how to configure FreePBX go to: https://github.com/TECH7Fox/HA-SIP/wiki/Setup-FreePBX

Android companion app 2022.2 required for speaker + audio permissions.

If you are still having problems you can make an issue or ask on the discord server.

## Contact
**jordy.kuhne@gmail.com**
