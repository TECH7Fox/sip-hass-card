sip_config = {
    "ice_config": {
        "iceGatheringTimeout": 1000,
        "iceCandidatePoolSize": 0,
        "iceTransportPolicy": "all",
        "iceServers": [
            {
                "urls": ["stun:stun.l.google.com:19302"]
            }
        ],
        "rtcpMuxPolicy": "require"
    },
    "outgoingRingtoneUrl": "/sip_core_files/ringback-tone.mp3",
    "incomingRingtoneUrl": "/sip_core_files/ring-tone.mp3",
    "backup_user": {
        "ha_username": "myuser",
        "extension": "100",
        "password": "1234"
    },
    "users": [
        {
            "ha_username": "jordy",
            "extension": "101",
            "password": "1234"
        },
        {
            "ha_username": "alice",
            "extension": "102",
            "password": "1234"
        }
    ],
    "sip_video": False,
    "auto_answer": False,
    "popup_config": {
        "auto_open": True,
        "large": False,
        "hide_header_button": False,
        "buttons": [
            {
                "label": "Open Door",
                "icon": "mdi:door-open",
                "type": "dtmf",
                "data": "1"
            },
            {
                "label": "Switch lights",
                "icon": "mdi:lightbulb",
                "type": "service_call",
                "data": {
                    "domain": "light",
                    "service": "toggle",
                    "entity_id": "light.bedroom_lights"
                }
            }
        ],
        "extensions": {
            "008": {
                "name": "Bob"
            },
            "8001": {
                "name": "Doorbell",
                "camera_entity": "camera.doorbell"
            }
        }
    }
}
