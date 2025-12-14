import logging
import voluptuous as vol
from typing import Any

from homeassistant.core import callback
from homeassistant.config_entries import ConfigFlowResult, OptionsFlow, ConfigFlow, ConfigEntry
from homeassistant.helpers.selector import ObjectSelector
from .const import DOMAIN
from .defaults import sip_config

logger: logging.Logger = logging.getLogger(__name__)


class SipCoreConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for SIP Core."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None):
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        return self.async_create_entry(title="SIP Core", data=user_input or {})

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry[Any]) -> "SipCoreOptionsFlowHandler":
        return SipCoreOptionsFlowHandler()


class SipCoreOptionsFlowHandler(OptionsFlow):
    """Handle SIP Core options flow."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage the SIP Core options."""
        if user_input is not None:
            return self.async_create_entry(title="SIP Core", data=user_input)

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema({
                vol.Required(
                    "sip_config",
                    description={
                        "suggested_value": self.config_entry.options.get("sip_config", sip_config),
                    }
                ): ObjectSelector(),
            })
        )
