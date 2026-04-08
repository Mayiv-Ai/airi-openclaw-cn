"""
MiMo-V2-TTS Bridge - OpenAI Compatible API
小米 MiMo Token Plan TTS 桥接服务
"""

import http.server
import socketserver
import json
import asyncio
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PORT = int(os.environ.get("MIMO_TTS_PORT", "5007"))
API_KEY = os.environ.get("MIMO_API_KEY", "")
BASE_URL = os.environ.get("MIMO_BASE_URL", "https://token-plan-cn.xiaomimimo.com/v1")

VOICES = [
    {"id": "mimo-v2-tts", "name": "MiMo V2 TTS", "languages": ["zh-CN"], "gender": "neutral"},
]


async def generate_speech_mimo(text: str, voice: str = "mimo-v2-tts") -> bytes:
    """调用小米 MiMo-V2-TTS API 生成语音"""
    import aiohttp

    url = f"{BASE_URL}/audio/speech"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "mimo-v2-tts",
        "input": text,
        "voice": voice,
        "response_format": "mp3",
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload, headers=headers) as resp:
            if resp.status == 200:
                return await resp.read()
            else:
                error = await resp.text()
                logger.error(f"MiMo TTS API error {resp.status}: {error}")
                raise Exception(f"MiMo TTS API error: {resp.status}")


class TTSHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        logger.info(f"{self.address_string()} - {format % args}")

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _send_audio(self, audio_bytes, content_type="audio/mpeg"):
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(audio_bytes)

    def do_GET(self):
        if self.path == "/health":
            self._send_json({"status": "ok", "backend": "mimo-v2-tts", "port": PORT})
        elif self.path.startswith("/v1/models"):
            self._send_json({
                "data": [{"id": v["id"], "object": "model"} for v in VOICES]
            })
        elif self.path.startswith("/v1/audio/voices"):
            self._send_json({"voices": VOICES})
        else:
            self._send_json({"error": "Not Found"}, 404)

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        if self.path == "/v1/audio/speech":
            try:
                data = json.loads(body)
                text = data.get("input", "")
                voice = data.get("voice", "mimo-v2-tts")

                if not text:
                    self._send_json({"error": "Missing 'input' field"}, 400)
                    return

                logger.info(f"TTS request: voice={voice}, text={text[:50]}...")
                audio = asyncio.run(generate_speech_mimo(text, voice))
                self._send_audio(audio)

            except Exception as e:
                logger.error(f"TTS error: {e}")
                self._send_json({"error": str(e)}, 500)
        else:
            self._send_json({"error": "Not Found"}, 404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()


def main():
    with socketserver.ThreadingTCPServer(("0.0.0.0", PORT), TTSHandler) as httpd:
        logger.info("=" * 50)
        logger.info("  MiMo-V2-TTS Bridge 启动成功！")
        logger.info(f"  端口: {PORT}")
        logger.info(f"  API: http://localhost:{PORT}/v1/audio/speech")
        logger.info(f"  健康检查: http://localhost:{PORT}/health")
        logger.info(f"  后端: token-plan-cn.xiaomimimo.com")
        logger.info("=" * 50)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
