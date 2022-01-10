# HA-SIP
**A SIP client inside home assistant!**

This card can be used with the [Asterisk integration](https://github.com/TECH7Fox/Asterisk-integration). You can also setup your own PBX but this is out of scope and won't be explained here.

With this card you can make and receive calls to other HA clients and other sip devices, so you can use it as for example an intercom.

## Roadmap
This is very much still work in progress, and these are the things i want to add in the near future.
 * Better CSS. **if you want to help, please do!**
 * GUI config
 * Better errror logging
 * Mute function
 * Popup when called (via browser_mod)
 * Conference function
 * Videocalls (send video from webcam)
 * PA function? (broadcast to all)
 * Sound wave animation? (when there is no video)

**Asterisk add-on**
This card works with the [Asterisk add-on](https://github.com/TECH7Fox/Asterisk-add-on), that very easy to set up, just some clicks!

## Requirements
For this to work you will need the following:
 * A sip/pbx server. (I use the [Asterisk add-on](https://github.com/TECH7Fox/Asterisk-add-on))
 * Extension for every device. (The add-on auto-generates extensions for every person in HA)
 * HACS on your HA. (Home assistant)
 * Browser_mod installed and working on your HA.
 * Some time :)

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
Add the card by setting **type** to `custom:sipjs-card`.

**Set ringtone**
set your ringtone to play when being called.
`/local` is your www folder in config.

## Troubleshooting
Most problems is because your pbx server is not configured correct.
To see how to configure FreePBX go to: https://github.com/TECH7Fox/HA-SIP/wiki/Setup-FreePBX

If you are still having problems you can make an issue or send me a email.

## Contact
**jordy.kuhne@gmail.com**
