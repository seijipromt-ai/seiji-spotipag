import os
import yt_dlp
import requests
from flask import Flask, request, jsonify, render_template, Response, stream_with_context

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/search", methods=["POST"])
def search():
    data = request.get_json()
    query = data.get("query", "").strip()
    if not query: 
        return jsonify({"ok": False, "err": "Query required"}), 400

    ydl_opts = {
        'quiet': True,
        'extract_flat': True,
        'force_generic_extractor': False,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(f"ytsearch15:{query}", download=False)
            
            tracks = []
            for entry in result.get('entries', []):
                thumb = entry.get('thumbnails', [{}])[-1].get('url', '') if entry.get('thumbnails') else ''
                
                tracks.append({
                    "id": entry.get('id'),
                    "title": entry.get('title'),
                    "artist": entry.get('uploader', 'Unknown Artist'),
                    "duration": entry.get('duration', 0),
                    "cover": thumb
                })
            return jsonify({"ok": True, "data": tracks})
    except Exception as e:
        return jsonify({"ok": False, "err": str(e)}), 500

@app.route("/api/stream/<video_id>")
def stream_audio(video_id):
    ydl_opts = {
        'quiet': True,
        'format': 'bestaudio/best',
        'nocheckcertificate': True,
        'extract_flat': False,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            audio_url = info['url']
            
            req = requests.get(audio_url, stream=True, headers={
                'User-Agent': 'Mozilla/5.0',
                'Range': request.headers.get('Range', '')
            })
            
            def generate():
                for chunk in req.iter_content(chunk_size=1024*1024):
                    yield chunk

            headers = {
                'Content-Type': req.headers.get('Content-Type', 'audio/webm'),
                'Accept-Ranges': 'bytes',
                'Content-Length': req.headers.get('Content-Length', ''),
                'Content-Range': req.headers.get('Content-Range', '')
            }
            
            return Response(stream_with_context(generate()), status=req.status_code, headers=headers)
            
    except Exception as e:
        return str(e), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
