"""
OpenClaw-CN TTS Bridge - OpenAI Compatible API
"""

import http.server
import socketserver
import json
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PORT = 5007

VOICES = [
    {"id": "zh-CN-XiaoxiaoNeural", "name": "Chinese Xiaoxiao", "languages": ["zh-CN"], "gender": "female"},
    {"id": "zh-CN-XiaoyiNeural", "name": "Chinese Xiaoyi", "languages": ["zh-CN"], "gender": "female"},
    {"id": "zh-CN-YunxiNeural", "name": "Chinese Yunxi", "languages": ["zh-CN"], "gender": "male"},
    {"id": "zh-CN-YunxiaNeural", "name": "Chinese Yunxia", "languages": ["zh-CN"], "gender": "male"},
    {"id": "zh-CN-YunyangNeural", "name": "Chinese Yunyang", "languages": ["zh-CN"], "gender": "male"},
    {"id": "zh-CN-YunjianNeural", "name": "Chinese Yunjian", "languages": ["zh-CN"], "gender": "male"},
    {"id": "en-US-JennyNeural", "name": "US Female Jenny", "languages": ["en-US"], "gender": "female"},
    {"id": "en-US-GuyNeural", "name": "US Male Guy", "languages": ["en-US"], "gender": "male"},
    {"id": "en-GB-SoniaNeural", "name": "UK Female Sonia", "languages": ["en-GB"], "gender": "female"},
    {"id": "en-GB-RyanNeural", "name": "UK Male Ryan", "languages": ["en-GB"], "gender": "male"},
    {"id": "ja-JP-NanamiNeural", "name": "Japanese Nanami", "languages": ["ja-JP"], "gender": "female"},
    {"id": "ja-JP-KeitaNeural", "name": "Japanese Keita", "languages": ["ja-JP"], "gender": "male"},
]

def format_rate(speed):
    if speed == 1.0:
        return "+0%"
    elif speed > 1.0:
        return f"+{int((speed - 1.0) * 100)}%"
    else:
        return f"{int((speed - 1.0) * 100)}%"

async def generate_async(text, voice, speed):
    from edge_tts import Communicate
    rate = format_rate(speed)
    comm = Communicate(text=text, voice=voice, rate=rate)
    audio = b""
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]
    return audio

def generate_speech(text, voice, speed):
    return asyncio.run(generate_async(text, voice, speed))

class TTSHandler(http.server.BaseHTTPRequestHandler):
    executor = ThreadPoolExecutor(max_workers=4)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health" or self.path == "/v1/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "provider": "openclaw-tts"}).encode())
        elif self.path == "/v1/models":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"object": "list", "data": [{"id": "openclaw-tts"}]}).encode())
        elif self.path == "/v1/audio/voices":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"object": "list", "data": VOICES}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path != "/v1/audio/speech":
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            request = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(json.dumps({"error": {"message": "Invalid JSON"}}).encode())
            return

        text = request.get("input", "")
        voice = request.get("voice", "zh-CN-XiaoxiaoNeural")
        speed = float(request.get("speed", 1.0))

        logger.info(f"[TTS] voice={voice}, len={len(text)}")

        try:
            audio_data = self.executor.submit(generate_speech, text, voice, speed)
            audio_bytes = audio_data.result()
            self.send_response(200)
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Content-Length", len(audio_bytes))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(audio_bytes)
            logger.info(f"[TTS] Done: {len(audio_bytes)} bytes")
        except Exception as e:
            logger.error(f"Error: {e}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": {"message": str(e)}}).encode())

class ReuseAddrTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

if __name__ == "__main__":
    logger.info("OpenClaw-CN TTS Bridge running on port %d", PORT)
    with ReuseAddrTCPServer(("", PORT), TTSHandler) as httpd:
        httpd.serve_forever()
