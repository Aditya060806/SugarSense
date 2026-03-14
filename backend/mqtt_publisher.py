"""
SugarSense — MQTT Publisher
Singleton publisher that sends each prediction payload to an MQTT broker.
Gracefully degrades: if broker is unreachable all publish() calls are no-ops.
"""
import json
import threading
import logging

logger = logging.getLogger("sugarsense.mqtt")

try:
    import paho.mqtt.client as mqtt
    _PAHO_AVAILABLE = True
except ImportError:
    _PAHO_AVAILABLE = False
    logger.warning("[MQTT] paho-mqtt not installed. Run: pip install paho-mqtt")


class MQTTPublisher:
    def __init__(self, broker_host: str = "localhost", broker_port: int = 1883,
                 topic_prefix: str = "sugarsense", client_id: str = "sugarsense-backend"):
        self.broker_host   = broker_host
        self.broker_port   = broker_port
        self.topic_prefix  = topic_prefix
        self.client_id     = client_id
        self.is_connected  = False
        self._client       = None
        self._lock         = threading.Lock()

    def connect(self):
        """Attempt non-blocking connection to the MQTT broker."""
        if not _PAHO_AVAILABLE:
            logger.warning("[MQTT] paho-mqtt not available — publisher disabled.")
            return
        try:
            self._client = mqtt.Client(client_id=self.client_id, protocol=mqtt.MQTTv311)
            self._client.on_connect    = self._on_connect
            self._client.on_disconnect = self._on_disconnect

            self._client.connect_async(self.broker_host, self.broker_port, keepalive=60)
            self._client.loop_start()
            logger.info(f"[MQTT] Connecting to {self.broker_host}:{self.broker_port}...")
        except Exception as e:
            logger.warning(f"[MQTT] Could not connect to broker: {e}. Publisher disabled.")
            self._client = None

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.is_connected = True
            logger.info(f"[MQTT] Connected to broker {self.broker_host}:{self.broker_port}")
        else:
            self.is_connected = False
            logger.warning(f"[MQTT] Connection refused (rc={rc}). Retrying...")

    def _on_disconnect(self, client, userdata, rc):
        self.is_connected = False
        if rc != 0:
            logger.warning(f"[MQTT] Unexpected disconnect (rc={rc}). Auto-reconnecting...")

    def publish(self, topic_suffix: str, payload: dict):
        """Publish a JSON payload. No-op if broker is not connected."""
        if not self.is_connected or self._client is None:
            return
        topic = f"{self.topic_prefix}/{topic_suffix}"
        try:
            with self._lock:
                self._client.publish(topic, json.dumps(payload), qos=0, retain=False)
        except Exception as e:
            logger.warning(f"[MQTT] Publish failed: {e}")

    def publish_prediction(self, payload: dict):
        """Convenience method — publishes to topic_prefix/mill1/prediction."""
        self.publish("mill1/prediction", payload)

    def publish_alert(self, payload: dict):
        """Convenience method — publishes to topic_prefix/mill1/alert."""
        self.publish("mill1/alert", payload)

    def disconnect(self):
        if self._client:
            try:
                self._client.loop_stop()
                self._client.disconnect()
            except Exception:
                pass
        self.is_connected = False

    def status(self) -> dict:
        return {
            "connected": self.is_connected,
            "broker": f"{self.broker_host}:{self.broker_port}",
            "topic_prefix": self.topic_prefix,
            "paho_available": _PAHO_AVAILABLE,
        }
