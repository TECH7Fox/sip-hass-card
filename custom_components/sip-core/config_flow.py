import logging
import voluptuous as vol
from typing import Any

from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


class SipCoreConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for SIP Core."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Handle the initial step."""
        errors = {}

        if user_input is not None:
            # Check if already configured
            await self.async_set_unique_id("sip_core")
            self._abort_if_unique_id_configured()

            # Validate configuration here if needed
            # For example, test WebSocket connection

            return self.async_create_entry(
                title="SIP Core",
                data=user_input,
            )

        # Show configuration form
        data_schema = vol.Schema(
            {
                vol.Optional("pbx_server", default=""): str,
                vol.Optional("custom_wss_url", default=""): str,
                vol.Optional("auto_answer", default=False): bool,
                vol.Optional("sip_video", default=False): bool,
            }
        )

        return self.async_show_form(
            step_id="user",
            data_schema=data_schema,
            errors=errors,
            description_placeholders={
                "docs_url": "https://tech7fox.github.io/sip-hass-docs"
            },
        )

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Get the options flow for this handler."""
        return SipCoreOptionsFlow(config_entry)


class SipCoreOptionsFlow(config_entries.OptionsFlow):
    """Handle options flow for SIP Core."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        # Get current options or use defaults from config entry
        current_auto_answer = self.config_entry.options.get(
            "auto_answer", self.config_entry.data.get("auto_answer", False)
        )
        current_sip_video = self.config_entry.options.get(
            "sip_video", self.config_entry.data.get("sip_video", False)
        )

        data_schema = vol.Schema(
            {
                vol.Optional("auto_answer", default=current_auto_answer): bool,
                vol.Optional("sip_video", default=current_sip_video): bool,
            }
        )

        return self.async_show_form(
            step_id="init",
            data_schema=data_schema,
        )