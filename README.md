# sip-hass-card
**A SIP client inside home assistant!**

With this card you can make and receive calls to other HA clients and other sip devices, so you can use it as for example an intercom.

![image](https://user-images.githubusercontent.com/32220029/149833595-204a0faa-d129-4b9b-9338-78155031b7d7.png)

The card supports video, DTMF signals, custom icons, custom names, status entities and camera entities.

![image](https://user-images.githubusercontent.com/32220029/158247719-0c568186-bee5-4490-9678-58f5d3860c51.png)

## Roadmap
This is still work in progress, and these are the things i want to add in the near future.
 * Improve styling (hard because custom cards can't use all ha elements)
 * Include default ringtones
 * Translations

**Asterisk add-on**
This card works with the [Asterisk add-on](https://github.com/TECH7Fox/Asterisk-add-on), which is very easy to set up, with just some clicks!

## Requirements
For this to work you will need the following:
 * A sip/pbx server. (I use the [Asterisk add-on](https://github.com/TECH7Fox/Asterisk-add-on))
 * Extension for every device. (The add-on auto-generates extensions for every person in HA)
 * HACS on your HA. (Home assistant)

Go to https://tech7fox.github.io/sip-hass-docs/docs/card/guides/freepbx to see how to setup FreePBX for this card.

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

### Auto Call
You can put `?call=<number>` behind the URL to auto call that number when the card loads. Useful for notifications.

### Ice Options
You can set ICE options for external use. These settings are not (yet) configurable with the card editor, so you will
need to set them in the code editor. Don't set `iceConfig` if you don't want to use ICE.

Here is a example:

```
iceTimeout: 5
iceConfig:
  iceCandidatePoolSize: 0
  iceTransportPolicy: all
  iceServers:
    - urls:
        - stun:stun.l.google.com:19302
        - stun:stun1.l.google.com:19302
  rtcpMuxPolicy: require
```

### Card Configuration

Everything (expect ICE) is configurable with the card editor.
But for people that are configuring it with YAML, here is a example:

```
type: custom:sipjs-card
server: 192.168.0.10
port: '8089'
video: false
ringtone: /local/asterisk/ringtone.mp3
button_size: '62'
custom:
  - name: Doorbell
    number: '007'
    icon: mdi:doorbell
    camera: 'camera.doorbell'
  - name: Jordy deskphone
    number: '008'
    icon: mdi:deskphone
    camera: ''
dtmfs:
  - name: Door
    signal: '1'
    icon: mdi:door
extensions:
  - person: person.person1
    name: Test person
    extension: '101'
    secret: 1234
    icon: mdi:person
    entity: binary_sensor.myphone
    camera: ''
  - person: person.jordy
    name: Jordy PC
    extension: '100'
    secret: 1234
    icon: mdi:monitor
  - person: person.tablet
    name: Tablet
    extension: '102'
    secret: 1234
    icon: mdi:tablet
state_color: false 
ringbacktone: /local/asterisk/backtone.mp3
auto_answer: false
buttons:
  - name: 'Garage Door'
    icon: mdi:garage
    entity: switch.garagedoor
custom_title: ''
hide_me: true
iceTimeout: 3 # Default is 5 seconds
backup_name: Tablet
backup_extension: '200'
backup_secret: 1234
iceConfig: # Remove if you don't want to use ICE
  iceCandidatePoolSize: 0
  iceTransportPolicy: all
  iceServers:
    - urls:
        - stun:stun.l.google.com:19302
        - stun:stun1.l.google.com:19302
  rtcpMuxPolicy: require
```

## Wiki
You can find more information on the [SIP-HASS Docs](https://tech7fox.github.io/sip-hass-docs/).

## Troubleshooting
Most problems is because your PBX server is not configured correct, or your certificate is not accepted.
To accept the certificate for Asterisk/FreePBX go to `https://<host>:8089/ws` and click continue.
To see how to configure FreePBX go to the [FreePBX guide](https://tech7fox.github.io/sip-hass-docs/docs/card/guides/freepbx).

Android companion app 2022.2 required for speaker + audio permissions.

If you are still having problems you can make an issue or ask on the discord server.

## Contact
**jordy.kuhne@gmail.com**
